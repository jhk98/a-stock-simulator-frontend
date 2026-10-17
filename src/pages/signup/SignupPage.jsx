import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API_BASE_URL from "../../config/api.js";
import "./SignupPage.css";

function SignupPage() {

    const navigate = useNavigate();

    // ============================================================
    // 1. 회원가입 입력값
    // ============================================================

    const [name, setName] = useState("");
    const [loginId, setLoginId] = useState("");

    const [emailId, setEmailId] = useState("");
    const [emailDomain, setEmailDomain] = useState("");
    const [emailDomainSelect, setEmailDomainSelect] = useState("");

    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    // 이메일 인증번호
    const [verificationCode, setVerificationCode] = useState("");

    // ============================================================
    // 2. 중복 확인 및 인증 상태
    // ============================================================

    // 중복 확인에 성공한 아이디 및 이메일을 저장한다.
    // 입력값이 변경되면 해당 확인 결과는 더 이상 유효하지 않다.
    const [checkedLoginId, setCheckedLoginId] = useState("");
    const [checkedEmail, setCheckedEmail] = useState("");

    // 인증번호가 발송된 이메일
    const [sentEmail, setSentEmail] = useState("");

    // 인증에 성공한 이메일
    const [verifiedEmail, setVerifiedEmail] = useState("");

    // ============================================================
    // 3. 화면 메시지 및 요청 상태
    // ============================================================

    const [loginIdMessage, setLoginIdMessage] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [verificationMessage, setVerificationMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [loading, setLoading] = useState(false);

    // ============================================================
    // 4. 공통 값 및 검증
    // ============================================================

    const email = `${emailId.trim()}@${emailDomain.trim()}`
        .toLowerCase();

    const loginIdPattern = /^[a-zA-Z0-9]{4,20}$/;

    const passwordPattern =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,20}$/;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phonePattern = /^010[0-9]{8}$/;

    // 이메일 주소가 변경되면 인증 관련 상태 초기화
    const resetEmailVerification = () => {
        setCheckedEmail("");
        setSentEmail("");
        setVerifiedEmail("");
        setVerificationCode("");
        setEmailMessage("");
        setVerificationMessage("");
    };

    // 서버에서 문자열 또는 JSON 응답이 오는 경우 처리
    const readErrorMessage = async (response, fallback) => {
        try {
            const data = await response.json();

            if (typeof data?.message === "string") {
                return data.message;
            }
        } catch {
            // JSON 응답이 아닌 경우 기본 메시지 사용
        }

        return fallback;
    };

    // ============================================================
    // 5. 아이디 중복 확인
    // ============================================================

    const handleCheckLoginId = async () => {

        setErrorMessage("");
        setLoginIdMessage("");
        setCheckedLoginId("");

        if (!loginIdPattern.test(loginId)) {
            setLoginIdMessage("아이디는 영문·숫자 4~20자로 입력해주세요.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/signup/check-login-id?loginId=${encodeURIComponent(loginId)}`
            );

            if (!response.ok) {
                throw new Error("아이디 중복 확인 요청에 실패했습니다.");
            }

            // true: 중복 / false: 사용 가능
            const duplicated = await response.json();

            if (duplicated === true) {
                setLoginIdMessage("이미 사용 중인 아이디입니다.");
                return;
            }

            if (duplicated !== false) {
                throw new Error("예상하지 못한 서버 응답입니다.");
            }

            setCheckedLoginId(loginId);
            setLoginIdMessage("사용 가능한 아이디입니다.");

        } catch (error) {
            console.error(error);
            setLoginIdMessage("아이디 중복 확인에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // 6. 이메일 중복 확인
    // ============================================================

    const handleCheckEmail = async () => {

        setErrorMessage("");
        setEmailMessage("");
        setCheckedEmail("");

        if (!emailPattern.test(email)) {
            setEmailMessage("올바른 이메일 주소를 입력해주세요.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/signup/check-email?email=${encodeURIComponent(email)}`
            );

            if (!response.ok) {
                throw new Error("이메일 중복 확인 요청에 실패했습니다.");
            }

            // true: 중복 / false: 사용 가능
            const duplicated = await response.json();

            if (duplicated === true) {
                setEmailMessage("이미 사용 중인 이메일입니다.");
                return;
            }

            if (duplicated !== false) {
                throw new Error("예상하지 못한 서버 응답입니다.");
            }

            setCheckedEmail(email);
            setEmailMessage("사용 가능한 이메일입니다.");

        } catch (error) {
            console.error(error);
            setEmailMessage("이메일 중복 확인에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // 7. 이메일 인증번호 발송
    // ============================================================

    const handleSendEmailCode = async () => {

        setErrorMessage("");
        setVerificationMessage("");
        setSentEmail("");
        setVerifiedEmail("");
        setVerificationCode("");

        if (checkedEmail !== email) {
            setVerificationMessage("이메일 중복 확인을 먼저 진행해주세요.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/emails/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const message = await readErrorMessage(
                    response,
                    "인증번호 발송에 실패했습니다."
                );
                throw new Error(message);
            }

            setSentEmail(email);
            setVerificationMessage("인증번호를 발송했습니다. 이메일을 확인해주세요.");

        } catch (error) {
            console.error(error);
            setVerificationMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // 8. 이메일 인증번호 확인
    // ============================================================

    const handleVerifyEmailCode = async () => {

        setErrorMessage("");
        setVerificationMessage("");

        if (sentEmail !== email) {
            setVerificationMessage("인증번호를 먼저 발송해주세요.");
            return;
        }

        if (!/^\d{6}$/.test(verificationCode)) {
            setVerificationMessage("인증번호 6자리를 입력해주세요.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/emails/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    code: verificationCode
                })
            });

            if (!response.ok) {
                const message = await readErrorMessage(
                    response,
                    "이메일 인증에 실패했습니다."
                );
                throw new Error(message);
            }

            setVerifiedEmail(email);
            setVerificationMessage("이메일 인증이 완료되었습니다.");

        } catch (error) {
            console.error(error);
            setVerificationMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // 9. 회원가입
    // ============================================================

    const handleSignup = async (event) => {

        event.preventDefault();
        setErrorMessage("");

        if (!name.trim() || name.trim().length > 10) {
            setErrorMessage("이름은 1~10자로 입력해주세요.");
            return;
        }

        if (!loginIdPattern.test(loginId)) {
            setErrorMessage("아이디는 영문·숫자 4~20자로 입력해주세요.");
            return;
        }

        if (checkedLoginId !== loginId) {
            setErrorMessage("아이디 중복 확인을 진행해주세요.");
            return;
        }

        if (!emailPattern.test(email) || checkedEmail !== email) {
            setErrorMessage("이메일 중복 확인을 진행해주세요.");
            return;
        }

        if (verifiedEmail !== email) {
            setErrorMessage("이메일 인증을 완료해주세요.");
            return;
        }

        if (!phonePattern.test(phoneNumber)) {
            setErrorMessage("휴대폰 번호는 010으로 시작하는 11자리여야 합니다.");
            return;
        }

        if (!passwordPattern.test(password)) {
            setErrorMessage(
                "비밀번호는 영문·숫자·특수문자를 포함한 8~20자여야 합니다."
            );
            return;
        }

        if (password !== passwordConfirm) {
            setErrorMessage("비밀번호가 일치하지 않습니다.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    loginId,
                    password,
                    name: name.trim(),
                    phoneNumber,
                    email
                })
            });

            if (!response.ok) {
                const message = await readErrorMessage(
                    response,
                    "회원가입에 실패했습니다."
                );
                throw new Error(message);
            }

            alert("회원가입이 완료되었습니다.");
            navigate("/login");

        } catch (error) {
            console.error("회원가입 실패:", error);
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // 10. 회원가입 화면
    // ============================================================

    return (
        <div className="signup-page">
            <div className="signup-container">

                <Link to="/" className="signup-logo">
                    STOCK SIMULATOR
                </Link>

                <h1>회원가입</h1>

                <p className="signup-description">
                    모의주식 투자를 시작하기 위한 정보를 입력해주세요.
                </p>

                <form className="signup-form" onSubmit={handleSignup}>

                    {/* 이름 */}
                    <div className="input-group">
                        <label htmlFor="name">이름</label>
                        <input
                            id="name"
                            type="text"
                            maxLength={10}
                            placeholder="이름을 입력해주세요."
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>

                    {/* 아이디 */}
                    <div className="input-group">
                        <label htmlFor="loginId">아이디</label>

                        <div className="signup-action-row">
                            <input
                                id="loginId"
                                type="text"
                                maxLength={20}
                                placeholder="영문·숫자 4~20자"
                                value={loginId}
                                onChange={(event) => {
                                    const value = event.target.value.replace(
                                        /[^a-zA-Z0-9]/g,
                                        ""
                                    );

                                    setLoginId(value);
                                    setCheckedLoginId("");
                                    setLoginIdMessage("");
                                }}
                            />

                            <button
                                type="button"
                                className="signup-action-button"
                                onClick={handleCheckLoginId}
                                disabled={loading}
                            >
                                중복 확인
                            </button>
                        </div>

                        {loginIdMessage && (
                            <p className={
                                   checkedLoginId === loginId
                                       ? "password-match"
                                       : "input-error"
                               }>
                                {loginIdMessage}
                            </p>
                        )}
                    </div>

                    {/* 이메일 */}
                    <div className="input-group">
                        <label htmlFor="emailId">이메일</label>

                        <div className="email-input-group">
                            <input
                                id="emailId"
                                type="text"
                                placeholder="이메일"
                                value={emailId}
                                onChange={(event) => {
                                    setEmailId(event.target.value);
                                    resetEmailVerification();
                                }}
                            />

                            <span className="email-at">@</span>

                            <input
                                type="text"
                                placeholder="도메인"
                                value={emailDomain}
                                disabled={emailDomainSelect !== ""}
                                onChange={(event) => {
                                    setEmailDomain(event.target.value);
                                    resetEmailVerification();
                                }}
                            />

                            <select
                                value={emailDomainSelect}
                                onChange={(event) => {
                                    const domain = event.target.value;

                                    setEmailDomainSelect(domain);
                                    setEmailDomain(domain);
                                    resetEmailVerification();
                                }}
                            >
                                <option value="">직접입력</option>
                                <option value="naver.com">naver.com</option>
                                <option value="gmail.com">gmail.com</option>
                                <option value="daum.net">daum.net</option>
                                <option value="kakao.com">kakao.com</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            className="signup-action-button signup-full-button"
                            onClick={handleCheckEmail}
                            disabled={loading}
                        >
                            이메일 중복 확인
                        </button>

                        {emailMessage && (
                            <p className={
                                   checkedEmail === email
                                       ? "password-match"
                                       : "input-error"
                               }>
                                {emailMessage}
                            </p>
                        )}

                        <button
                            type="button"
                            className="signup-action-button signup-full-button"
                            onClick={handleSendEmailCode}
                            disabled={loading || checkedEmail !== email}
                        >
                            인증번호 발송
                        </button>

                        {sentEmail === email && (
                            <div className="signup-action-row">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="인증번호 6자리"
                                    value={verificationCode}
                                    onChange={(event) => {
                                        setVerificationCode(
                                            event.target.value.replace(/\D/g, "")
                                        );
                                    }}
                                />

                                <button
                                    type="button"
                                    className="signup-action-button"
                                    onClick={handleVerifyEmailCode}
                                    disabled={loading || verifiedEmail === email}
                                >
                                    인증 확인
                                </button>
                            </div>
                        )}

                        {verificationMessage && (
                            <p className={
                                   verifiedEmail === email
                                       ? "password-match"
                                       : "input-error"
                               }>
                                {verificationMessage}
                            </p>
                        )}
                    </div>

                    {/* 휴대폰 번호 */}
                    <div className="input-group">
                        <label htmlFor="phoneNumber">휴대폰 번호</label>

                        <input
                            id="phoneNumber"
                            type="text"
                            inputMode="numeric"
                            maxLength={11}
                            placeholder="01012345678"
                            value={phoneNumber}
                            onChange={(event) => {
                                setPhoneNumber(
                                    event.target.value.replace(/\D/g, "")
                                );
                            }}
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div className="input-group">
                        <label htmlFor="password">비밀번호</label>

                        <input
                            id="password"
                            type="password"
                            maxLength={20}
                            placeholder="영문·숫자·특수문자 포함 8~20자"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>

                    {/* 비밀번호 확인 */}
                    <div className="input-group">
                        <label htmlFor="passwordConfirm">비밀번호 확인</label>

                        <input
                            id="passwordConfirm"
                            type="password"
                            maxLength={20}
                            placeholder="비밀번호를 다시 입력해주세요."
                            value={passwordConfirm}
                            onChange={(event) =>
                                setPasswordConfirm(event.target.value)
                            }
                        />

                        {passwordConfirm && (
                            <p className={
                                   password === passwordConfirm
                                       ? "password-match"
                                       : "password-mismatch"
                               }>
                                {password === passwordConfirm
                                    ? "비밀번호가 일치합니다."
                                    : "비밀번호가 일치하지 않습니다."}
                            </p>
                        )}
                    </div>

                    {/* 회원가입 오류 */}
                    {errorMessage && (
                        <p className="signup-error" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    {/* 회원가입 버튼 */}
                    <button
                        type="submit"
                        className="signup-button"
                        disabled={loading}
                    >
                        {loading ? "처리 중..." : "회원가입"}
                    </button>
                </form>

                <div className="signup-footer">
                    <span>이미 회원이신가요?</span>
                    <Link to="/login">로그인</Link>
                </div>

            </div>
        </div>
    );
}

export default SignupPage;