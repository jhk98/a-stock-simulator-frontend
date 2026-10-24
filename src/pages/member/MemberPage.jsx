import { useEffect, useRef, useState } from "react";

import Header from "../../components/common/Header.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
    getMyProfile,
    sendProfileEmailCode,
    updateMyProfile
} from "../../member/memberApi.js";

import "./MemberPage.css";

const PASSWORD_PATTERN =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,20}$/;

const PHONE_PATTERN = /^010[0-9]{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
    return value.trim().toLowerCase();
}

function phoneDigits(value) {
    return (value ?? "").replace(/\D/g, "");
}

/**
 * 로그인한 회원의 개인정보 수정 화면
 * 비밀번호, 전화번호, 이메일만 수정할 수 있다.
 */
export default function MemberPage() {
    const { authFetch } = useAuth();

    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [emailCode, setEmailCode] = useState("");

    // 실제 발송에 성공한 이메일을 기억한다.
    const [sentEmail, setSentEmail] = useState("");

    const [action, setAction] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // state 반영 전의 연속 클릭도 막는다.
    const busy = useRef(false);
    const resendAfter = useRef(0);

    const normalizedEmail = normalizeEmail(email);
    const emailChanged = Boolean(
        member && normalizedEmail !== normalizeEmail(member.email)
    );

    // 화면을 떠나면 조회 요청을 취소한다.
    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            try {
                const data = await getMyProfile(
                    authFetch,
                    controller.signal
                );

                if (controller.signal.aborted) return;

                setMember(data);
                setPhoneNumber(phoneDigits(data.phoneNumber));
                setEmail(data.email);
            } catch (requestError) {
                if (!controller.signal.aborted) {
                    setError(
                        requestError.message || "회원정보 조회에 실패했습니다."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => controller.abort();
    }, [authFetch]);

    function changeEmail(value) {
        setEmail(value);

        // 이메일을 바꾸면 이전 주소의 인증번호를 사용할 수 없게 한다.
        setSentEmail("");
        setEmailCode("");
        setMessage("");
        setError("");
    }

    async function sendCode() {
        if (busy.current) return;

        setError("");
        setMessage("");

        if (!emailChanged) {
            setError("현재 이메일과 다른 주소를 입력해주세요.");
            return;
        }

        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            setError("올바른 이메일 주소를 입력해주세요.");
            return;
        }

        if (Date.now() < resendAfter.current) {
            setError("잠시 후 인증번호를 다시 요청해주세요.");
            return;
        }

        busy.current = true;
        setAction("send");

        // 재발송이 실패해도 이전 번호를 새 번호로 오해하지 않도록 초기화한다.
        setSentEmail("");
        setEmailCode("");

        try {
            await sendProfileEmailCode(authFetch, normalizedEmail);

            setSentEmail(normalizedEmail);
            resendAfter.current = Date.now() + 5000;
            setMessage(
                "인증번호를 발송했습니다. 5분 안에 입력하고 변경사항을 저장해주세요."
            );
        } catch (requestError) {
            setError(requestError.message || "인증번호 발송에 실패했습니다.");
        } finally {
            busy.current = false;
            setAction("");
        }
    }

    async function save(event) {
        event.preventDefault();

        if (busy.current || !member) return;

        setError("");
        setMessage("");

        if (!currentPassword.trim()) {
            setError("현재 비밀번호를 입력해주세요.");
            return;
        }

        const payload = { currentPassword };

        if (newPassword || passwordConfirm) {
            if (!PASSWORD_PATTERN.test(newPassword)) {
                setError(
                    "새 비밀번호는 영문·숫자·특수문자를 포함한 8~20자로 입력해주세요."
                );
                return;
            }

            if (new TextEncoder().encode(newPassword).length > 72) {
                setError("새 비밀번호의 바이트 길이가 너무 깁니다.");
                return;
            }

            if (newPassword !== passwordConfirm) {
                setError("새 비밀번호와 확인 입력이 일치하지 않습니다.");
                return;
            }

            if (newPassword === currentPassword) {
                setError("새 비밀번호는 현재 비밀번호와 다르게 입력해주세요.");
                return;
            }

            payload.newPassword = newPassword;
        }

        if (phoneNumber !== phoneDigits(member.phoneNumber)) {
            if (!PHONE_PATTERN.test(phoneNumber)) {
                setError("전화번호는 010으로 시작하는 숫자 11자리로 입력해주세요.");
                return;
            }

            payload.phoneNumber = phoneNumber;
        }

        if (emailChanged) {
            if (!EMAIL_PATTERN.test(normalizedEmail)) {
                setError("올바른 이메일 주소를 입력해주세요.");
                return;
            }

            if (sentEmail !== normalizedEmail) {
                setError("새 이메일로 인증번호를 먼저 발송해주세요.");
                return;
            }

            if (!/^[0-9]{6}$/.test(emailCode)) {
                setError("이메일 인증번호 6자리를 입력해주세요.");
                return;
            }

            payload.email = normalizedEmail;
            payload.emailCode = emailCode;
        }

        if (Object.keys(payload).length === 1) {
            setError("변경할 정보를 입력해주세요.");
            return;
        }

        busy.current = true;
        setAction("save");

        try {
            const updated = await updateMyProfile(authFetch, payload);

            setMember(updated);
            setPhoneNumber(phoneDigits(updated.phoneNumber));
            setEmail(updated.email);

            // 민감한 입력값은 저장 성공 후 화면에서 지운다.
            setCurrentPassword("");
            setNewPassword("");
            setPasswordConfirm("");
            setEmailCode("");
            setSentEmail("");

            setMessage(
                payload.newPassword
                    ? "회원정보를 수정했습니다. 다음 로그인부터 새 비밀번호를 사용해주세요."
                    : "회원정보를 수정했습니다."
            );
        } catch (requestError) {
            /*
             * 이메일 인증번호가 이미 소모되었을 수 있다.
             * 저장 실패 후 이메일 변경을 재시도할 때는 재발송하도록 한다.
             */
            if (payload.email) {
                setSentEmail("");
                setEmailCode("");
            }

            setError(
                (requestError.message || "저장에 실패했습니다.")
                + (payload.email
                    ? " 이메일 변경 재시도 전 인증번호를 다시 발송해주세요."
                    : "")
                + (requestError.status
                    ? ""
                    : " 서버에 반영되었을 수 있으니 새로고침으로 확인해주세요.")
            );
        } finally {
            busy.current = false;
            setAction("");
        }
    }

    return (
        <>
            <Header />

            <main className="member-page">
                <section className="member-card">
                    <h1>회원정보 수정</h1>
                    <p className="member-description">
                        비밀번호, 전화번호, 이메일을 변경할 수 있습니다.
                    </p>

                    {loading && (
                        <p role="status">회원정보를 불러오고 있습니다.</p>
                    )}

                    {error && (
                        <p className="member-error" role="alert">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p className="member-success" role="status">
                            {message}
                        </p>
                    )}

                    {!loading && !member && (
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            다시 불러오기
                        </button>
                    )}

                    {member && (
                        <form onSubmit={save}>
                            <fieldset disabled={Boolean(action)}>
                                <legend>개인정보</legend>

                                {/* 아이디와 이름은 수정 대상이 아니다. */}
                                <dl className="member-summary">
                                    <div>
                                        <dt>아이디</dt>
                                        <dd>{member.loginId}</dd>
                                    </div>
                                    <div>
                                        <dt>이름</dt>
                                        <dd>{member.name}</dd>
                                    </div>
                                </dl>

                                <label htmlFor="member-current-password">
                                    현재 비밀번호
                                </label>
                                <input
                                    id="member-current-password"
                                    type="password"
                                    autoComplete="current-password"
                                    maxLength={100}
                                    required
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                />
                                <p className="member-help">
                                    개인정보를 변경하려면 현재 비밀번호가 필요합니다.
                                </p>

                                <label htmlFor="member-new-password">
                                    새 비밀번호
                                </label>
                                <input
                                    id="member-new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    maxLength={20}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                                <p className="member-help">
                                    변경할 때만 입력하세요. 영문·숫자·특수문자 포함 8~20자.
                                </p>

                                <label htmlFor="member-password-confirm">
                                    새 비밀번호 확인
                                </label>
                                <input
                                    id="member-password-confirm"
                                    type="password"
                                    autoComplete="new-password"
                                    maxLength={20}
                                    value={passwordConfirm}
                                    onChange={e => setPasswordConfirm(e.target.value)}
                                />

                                <label htmlFor="member-phone">전화번호</label>
                                <input
                                    id="member-phone"
                                    type="tel"
                                    autoComplete="tel"
                                    inputMode="numeric"
                                    maxLength={11}
                                    required
                                    value={phoneNumber}
                                    onChange={e =>
                                        setPhoneNumber(phoneDigits(e.target.value))
                                    }
                                />
                                <p className="member-help">
                                    하이픈 없이 숫자 11자리를 입력하세요.
                                </p>

                                <label htmlFor="member-email">이메일</label>
                                <div className="member-email-row">
                                    <input
                                        id="member-email"
                                        type="email"
                                        autoComplete="email"
                                        maxLength={255}
                                        required
                                        value={email}
                                        onChange={e => changeEmail(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={sendCode}
                                        disabled={!emailChanged}
                                    >
                                        {action === "send"
                                            ? "발송 중..."
                                            : "인증번호 발송"}
                                    </button>
                                </div>

                                {emailChanged && (
                                    <>
                                        <label htmlFor="member-email-code">
                                            이메일 인증번호
                                        </label>
                                        <input
                                            id="member-email-code"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            value={emailCode}
                                            disabled={sentEmail !== normalizedEmail}
                                            onChange={e =>
                                                setEmailCode(
                                                    e.target.value.replace(/\D/g, "")
                                                )
                                            }
                                        />
                                        <p className="member-help">
                                            인증번호는 변경사항 저장 시 확인합니다.
                                        </p>
                                    </>
                                )}

                                <button
                                    className="member-save"
                                    type="submit"
                                >
                                    {action === "save"
                                        ? "저장 중..."
                                        : "변경사항 저장"}
                                </button>
                            </fieldset>
                        </form>
                    )}
                </section>
            </main>
        </>
    );
}