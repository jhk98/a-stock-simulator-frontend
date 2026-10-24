import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext.jsx";
import { getMyProfile } from "../../member/memberApi.js";

import "./Header.css";

// 서버에서 전달한 마지막 로그인 시간을 표시한다.
function formatLoginTime(value) {
    if (!value) return "기록 없음";

    return value.replace("T", " ").slice(0, 19);
}

// 모의거래는 독립 메뉴에서 제외한다.
// 종목을 클릭하면 기존 상세 화면에서 차트와 주문 기능을 이용한다.
const MENU_LINKS = [
    { to: "/", label: "내 투자" },
    { to: "/stocks", label: "종목" },
    { to: "/orders", label: "주문내역" },
    { to: "/members/me", label: "회원정보 수정" }
];

export default function Header() {
    const { loginUser, logout, authFetch } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [loginInfo, setLoginInfo] = useState(null);

    const busy = useRef(false);
    const memberId = loginUser?.memberId;

    // 로그인한 회원의 마지막 로그인 시간을 조회한다.
    useEffect(() => {
        if (!memberId) return;

        const controller = new AbortController();

        async function loadLoginTime() {
            try {
                const member = await getMyProfile(
                    authFetch,
                    controller.signal
                );

                if (controller.signal.aborted) return;

                setLoginInfo({
                    memberId,
                    lastAccessTime: member.lastAccessTime,
                    failed: false
                });
            } catch {
                if (controller.signal.aborted) return;

                setLoginInfo({
                    memberId,
                    lastAccessTime: null,
                    failed: true
                });
            }
        }

        loadLoginTime();

        return () => controller.abort();
    }, [authFetch, memberId]);

    // 이전 회원의 조회 결과가 표시되지 않도록 회원 ID를 확인한다.
    const currentLoginInfo =
        loginInfo?.memberId === memberId ? loginInfo : null;

    const lastLoginText = !currentLoginInfo
        ? "조회 중..."
        : currentLoginInfo.failed
            ? "조회 실패"
            : formatLoginTime(currentLoginInfo.lastAccessTime);

    async function handleLogout() {
        if (busy.current) return;

        busy.current = true;
        setLoading(true);
        setError("");

        try {
            await logout();
            setLoginInfo(null);
            navigate("/", { replace: true });
        } catch (requestError) {
            setError(
                requestError.message || "로그아웃에 실패했습니다."
            );
        } finally {
            busy.current = false;
            setLoading(false);
        }
    }

    // 종목 상세 화면에서도 상위 메뉴인 '종목'을 선택 상태로 표시한다.
    function isActiveMenu(path) {
        if (path === "/stocks") {
            return location.pathname === "/stocks"
                || location.pathname === "/trade";
        }

        return location.pathname === path;
    }

    return (
        <header className="site-header">
            <div className="site-header-inner">
                <Link to="/" className="site-logo">
                    STOCK SIMULATOR
                </Link>

                <nav className="site-navigation" aria-label="주 메뉴">
                    {loginUser ? (
                        <>
                            {MENU_LINKS.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    aria-current={
                                        isActiveMenu(link.to)
                                            ? location.pathname === link.to
                                                ? "page"
                                                : "location"
                                            : undefined
                                    }
                                    style={
                                        isActiveMenu(link.to)
                                        && location.pathname !== link.to
                                            ? {
                                                color: "var(--accent, #2759cc)",
                                                background:
                                                    "var(--accent-soft, #eef3ff)"
                                            }
                                            : undefined
                                    }
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {/* 회원 이름은 굵게 표시하고 로그인 시간과 간격을 둔다. */}
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    columnGap: "16px",
                                    rowGap: "4px"
                                }}
                            >
                                <strong style={{ fontWeight: 700 }}>
                                    {loginUser.name}님
                                </strong>

                                <small>
                                    마지막 로그인 시간:{" "}
                                    {currentLoginInfo
                                    && !currentLoginInfo.failed
                                    && currentLoginInfo.lastAccessTime ? (
                                        <time
                                            dateTime={
                                                currentLoginInfo.lastAccessTime
                                            }
                                        >
                                            {lastLoginText}
                                        </time>
                                    ) : (
                                        lastLoginText
                                    )}
                                </small>
                            </span>

                            <button
                                type="button"
                                className="site-profile-button"
                                onClick={handleLogout}
                                disabled={loading}
                            >
                                {loading ? "로그아웃 중..." : "로그아웃"}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">로그인</Link>
                            <Link to="/signup">회원가입</Link>
                        </>
                    )}
                </nav>
            </div>

            {error && (
                <p className="site-header-error" role="alert">
                    {error}
                </p>
            )}
        </header>
    );
}