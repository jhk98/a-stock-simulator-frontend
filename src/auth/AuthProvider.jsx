import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import API_BASE_URL from "../config/api.js";
import { AuthContext } from "./AuthContext.jsx";
import {
    AuthApiError,
    getCsrfTokenApi,
    loginApi,
    logoutApi,
    refreshSessionApi
} from "./authApi.js";

function getLoginUser(session) {
    if (!session) {
        return null;
    }

    return {
        memberId: session.memberId,
        loginId: session.loginId,
        name: session.name
    };
}

function sessionChangedError() {
    return new AuthApiError(
        "인증 상태가 변경되었습니다. 다시 시도해주세요.",
        409
    );
}

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [restoreError, setRestoreError] = useState("");

    const sessionRef = useRef(null);
    const restorePromiseRef = useRef(null);
    const refreshPromiseRef = useRef(null);
    const authActionRef = useRef(false);
    const generationRef = useRef(0);

    const applySession = useCallback(data => {
        sessionRef.current = data;
        setSession(data);
    }, []);

    useEffect(() => {
        let cancelled = false;

        // StrictMode에서도 최초 복원 요청을 공유한다.
        if (!restorePromiseRef.current) {
            restorePromiseRef.current = refreshSessionApi();
        }

        async function restore() {
            try {
                const data = await restorePromiseRef.current;

                if (!cancelled) {
                    applySession(data);
                    setRestoreError("");
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                applySession(null);

                setRestoreError(
                    error.status === 401
                        ? ""
                        : error.message || "로그인 정보를 확인하지 못했습니다."
                );
            } finally {
                if (!cancelled) {
                    setAuthLoading(false);
                }
            }
        }

        restore();

        return () => {
            cancelled = true;
        };
    }, [applySession]);

    const refreshAccessToken = useCallback(() => {
        if (authActionRef.current) {
            return Promise.reject(sessionChangedError());
        }

        if (!refreshPromiseRef.current) {
            const generation = generationRef.current;

            refreshPromiseRef.current = (async () => {
                try {
                    const data = await refreshSessionApi();

                    if (generation !== generationRef.current) {
                        throw sessionChangedError();
                    }

                    applySession(data);
                    return data.accessToken;
                } catch (error) {
                    if (
                        error.status === 401
                        && generation === generationRef.current
                    ) {
                        applySession(null);
                    }

                    throw error;
                } finally {
                    refreshPromiseRef.current = null;
                }
            })();
        }

        return refreshPromiseRef.current;
    }, [applySession]);

    /*
     * 보호된 백엔드 API 전용 요청 함수.
     *
     * path: "/dashboard", "/stocks?..." 등의 API 상대 경로
     * body: JSON.stringify(...) 등 재사용 가능한 본문
     *
     * 네트워크 오류 및 5xx 오류는 자동 재시도하지 않는다.
     * 401일 때만 인증을 복원한 뒤 한 번 재요청한다.
     */
    const authFetch = useCallback(async (path, options = {}) => {
        if (
            typeof path !== "string"
            || !path.startsWith("/")
            || path.startsWith("//")
        ) {
            throw new Error("API 경로는 /로 시작하는 상대 경로여야 합니다.");
        }

        const baseUrl = typeof API_BASE_URL === "string"
            ? API_BASE_URL.trim().replace(/\/+$/, "")
            : "";

        if (!baseUrl) {
            throw new Error("VITE_API_BASE_URL 설정을 확인해주세요.");
        }

        if (authActionRef.current) {
            throw sessionChangedError();
        }

        const generation = generationRef.current;
        let token = sessionRef.current?.accessToken;

        if (!token) {
            throw new AuthApiError("로그인이 필요합니다.", 401);
        }

        function checkRequest() {
            options.signal?.throwIfAborted();

            if (
                generation !== generationRef.current
                || authActionRef.current
            ) {
                throw sessionChangedError();
            }
        }

        async function send(accessToken) {
            checkRequest();

            const headers = new Headers(options.headers);
            headers.set("Authorization", `Bearer ${accessToken}`);

            if (!headers.has("Accept")) {
                headers.set("Accept", "application/json");
            }

            const response = await fetch(`${baseUrl}${path}`, {
                ...options,
                cache: "no-store",
                headers
            });

            checkRequest();
            return response;
        }

        let response = await send(token);

        if (response.status !== 401) {
            return response;
        }

        const latestToken = sessionRef.current?.accessToken;

        if (!latestToken) {
            throw new AuthApiError(
                "로그인이 만료되었습니다. 다시 로그인해주세요.",
                401
            );
        }

        // 다른 요청이 이미 재발급했다면 새 토큰을 사용한다.
        if (latestToken === token) {
            token = await refreshAccessToken();
        } else {
            token = latestToken;
        }

        checkRequest();
        response = await send(token);

        if (response.status === 401) {
            if (sessionRef.current?.accessToken === token) {
                applySession(null);
            }

            throw new AuthApiError(
                "로그인이 만료되었습니다. 다시 로그인해주세요.",
                401
            );
        }

        return response;
    }, [applySession, refreshAccessToken]);

    const login = useCallback(async (loginId, password) => {
        if (authLoading || restoreError) {
            throw new Error(
                "로그인 정보 확인이 완료된 후 다시 시도해주세요."
            );
        }

        if (authActionRef.current) {
            throw new Error("인증 요청을 처리하고 있습니다.");
        }

        authActionRef.current = true;
        generationRef.current += 1;

        try {
            // 진행 중인 재발급과 로그인 쿠키 갱신이 겹치지 않게 한다.
            if (refreshPromiseRef.current) {
                try {
                    await refreshPromiseRef.current;
                } catch {
                    // 이전 세션 재발급 실패와 새 로그인은 별개다.
                }
            }

            const data = await loginApi(loginId.trim(), password);
            applySession(data);
            return data;
        } finally {
            authActionRef.current = false;
        }
    }, [applySession, authLoading, restoreError]);

    const logout = useCallback(async () => {
        if (authLoading) {
            throw new Error("로그인 정보를 확인하고 있습니다.");
        }

        if (authActionRef.current) {
            throw new Error("인증 요청을 처리하고 있습니다.");
        }

        authActionRef.current = true;
        generationRef.current += 1;

        try {
            // 재발급이 갱신한 쿠키까지 서버에서 로그아웃 처리한다.
            if (refreshPromiseRef.current) {
                try {
                    await refreshPromiseRef.current;
                } catch {
                    // 재발급 실패 여부와 관계없이 로그아웃을 요청한다.
                }
            }

            const csrfToken = await getCsrfTokenApi();
            await logoutApi(csrfToken);

            applySession(null);
        } finally {
            authActionRef.current = false;
        }
    }, [applySession, authLoading]);

    const loginUser = getLoginUser(session);

    const value = {
        loginUser,
        accessToken: session?.accessToken ?? null,
        authLoading,
        isAuthenticated: Boolean(session?.accessToken && loginUser),
        login,
        logout,
        authFetch
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
        <AuthContext.Provider value={value}>
            {content}
        </AuthContext.Provider>
    );
}