import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";

import {
    loginApi,
    getCsrfTokenApi,
    refreshSessionApi,
    logoutApi
} from "./authApi.js";

const AuthContext = createContext(null);

function toLoginUser(data) {
    return {
        memberId: data.memberId,
        loginId: data.loginId,
        name: data.name
    };
}

export function AuthProvider({ children }) {
    const [loginUser, setLoginUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [restoreError, setRestoreError] = useState("");

    // Effect가 다시 실행되어도 최초 복원 요청을 공유한다.
    const restorePromiseRef = useRef(null);

    // 로그인·로그아웃 요청의 중복 실행을 방지한다.
    const authActionRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        if (!restorePromiseRef.current) {
            restorePromiseRef.current = refreshSessionApi();
        }

        const restoreLogin = async () => {
            try {
                const data = await restorePromiseRef.current;

                if (cancelled) {
                    return;
                }

                setAccessToken(data.accessToken);
                setLoginUser(toLoginUser(data));
                setRestoreError("");
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setAccessToken(null);
                setLoginUser(null);

                if (error.status === 401) {
                    // 처음 방문했거나 Refresh Token이 만료된 경우.
                    setRestoreError("");
                } else {
                    // 통신 오류를 정상적인 비로그인 상태와 구분한다.
                    setRestoreError(
                        error.message
                        || "로그인 정보를 확인하지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setAuthLoading(false);
                }
            }
        };

        restoreLogin();

        return () => {
            cancelled = true;
        };
    }, []);

    const login = async (loginId, password) => {
        if (authLoading || restoreError) {
            throw new Error(
                "로그인 정보 확인이 완료된 후 다시 시도해주세요."
            );
        }

        if (authActionRef.current) {
            throw new Error("인증 요청을 처리하고 있습니다.");
        }

        authActionRef.current = true;

        try {
            const data = await loginApi(loginId.trim(), password);

            setAccessToken(data.accessToken);
            setLoginUser(toLoginUser(data));

            return data;
        } finally {
            authActionRef.current = false;
        }
    };

    const logout = async () => {
        if (authLoading) {
            throw new Error(
                "로그인 정보 확인이 완료된 후 다시 시도해주세요."
            );
        }

        if (authActionRef.current) {
            throw new Error("인증 요청을 처리하고 있습니다.");
        }

        authActionRef.current = true;

        try {
            const csrfToken = await getCsrfTokenApi();

            // 서버에서 Refresh Token 삭제 및 쿠키 만료가
            // 성공한 뒤 화면의 인증 상태를 제거한다.
            await logoutApi(csrfToken);

            setAccessToken(null);
            setLoginUser(null);
        } finally {
            authActionRef.current = false;
        }
    };

    const contextValue = {
        loginUser,
        accessToken,
        authLoading,
        isAuthenticated: Boolean(accessToken && loginUser),
        login,
        logout
    };

    let content = children;

    if (authLoading) {
        content = (
            <div role="status" aria-live="polite">
                로그인 정보를 확인하고 있습니다.
            </div>
        );
    } else if (restoreError) {
        content = (
            <div role="alert">
                <p>{restoreError}</p>

                <button
                    type="button"
                    onClick={() => window.location.reload()}
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {content}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth는 AuthProvider 내부에서 사용해야 합니다."
        );
    }

    return context;
}