import API_BASE_URL from "../config/api.js";

/**
 * HTTP 상태 코드를 함께 보관하는 API 오류
 */
export class AuthApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "AuthApiError";
        this.status = status;
    }
}

/**
 * 서버 오류 응답에서 메시지를 읽는다.
 */
async function createApiError(response, fallbackMessage) {
    let message = fallbackMessage;

    try {
        const data = await response.json();

        if (
            typeof data?.message === "string"
            && data.message.trim()
        ) {
            message = data.message;
        }
    } catch {
        // JSON 응답이 아니면 기본 메시지를 사용한다.
    }

    return new AuthApiError(message, response.status);
}

/**
 * 로그인 및 재발급 응답의 필수 필드를 확인한다.
 */
function validateAuthResponse(data) {
    if (
        typeof data?.accessToken !== "string"
        || !data.accessToken
        || data.memberId == null
        || typeof data.loginId !== "string"
        || typeof data.name !== "string"
        || typeof data.expiresIn !== "number"
        || data.expiresIn <= 0
    ) {
        throw new Error(
            "인증 응답 형식이 올바르지 않습니다. "
            + "백엔드 응답 DTO를 확인해주세요."
        );
    }

    return data;
}

/**
 * 로그인
 * Refresh Token 쿠키를 받기 위해 credentials를 포함한다.
 */
export async function loginApi(loginId, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            loginId,
            password
        })
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new AuthApiError(
                "아이디 또는 비밀번호가 올바르지 않습니다.",
                401
            );
        }

        throw await createApiError(
            response,
            "로그인 처리 중 오류가 발생했습니다."
        );
    }

    return validateAuthResponse(await response.json());
}

/**
 * CSRF 토큰 발급
 * 현재 백엔드는 HTTP 204를 반환하므로 JSON을 읽지 않는다.
 */
export async function getCsrfTokenApi() {
    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
        method: "GET",
        credentials: "include",
        cache: "no-store"
    });

    if (!response.ok) {
        throw await createApiError(
            response,
            "CSRF Token 조회에 실패했습니다."
        );
    }

    const csrfCookie = document.cookie
        .split(";")
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith("XSRF-TOKEN="));

    if (!csrfCookie) {
        throw new Error(
            "XSRF-TOKEN 쿠키를 찾을 수 없습니다. "
            + "접속 주소와 쿠키 설정을 확인해주세요."
        );
    }

    const token = decodeURIComponent(
        csrfCookie.substring("XSRF-TOKEN=".length)
    );

    if (!token) {
        throw new Error("CSRF Token이 비어 있습니다.");
    }

    return token;
}

/**
 * CSRF 토큰을 사용해 Access Token과 Refresh Token을 재발급한다.
 */
export async function refreshTokenApi(csrfToken) {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-XSRF-TOKEN": csrfToken
        }
    });

    if (!response.ok) {
        throw await createApiError(
            response,
            "로그인 정보를 복원하지 못했습니다."
        );
    }

    return validateAuthResponse(await response.json());
}

// 동일한 페이지에서 진행 중인 재발급 요청.
let refreshPromise = null;

/**
 * 동시에 재발급을 요청해도 하나의 요청 결과를 공유한다.
 * CSRF 발급부터 재발급 완료까지 전체 과정을 공유한다.
 */
export function refreshSessionApi() {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const csrfToken = await getCsrfTokenApi();
            return refreshTokenApi(csrfToken);
        })().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

/**
 * 로그아웃
 */
export async function logoutApi(csrfToken) {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-XSRF-TOKEN": csrfToken
        }
    });

    if (!response.ok) {
        throw await createApiError(
            response,
            "로그아웃 처리에 실패했습니다."
        );
    }
}