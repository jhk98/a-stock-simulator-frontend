/**
 * 회원정보 관련 API
 * authFetch를 사용하여 Access Token과 인증 갱신 처리를 공유한다.
 */
async function request(authFetch, path, options = {}) {
    const response = await authFetch(path, options);
    const text = await response.text();

    let data = text;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            // 이메일 발송처럼 일반 문자열 응답인 경우 그대로 사용한다.
        }
    }

    if (!response.ok) {
        const message =
            typeof data?.message === "string"
                ? data.message
                : `요청을 처리하지 못했습니다. (${response.status})`;

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return data;
}

// 수정 화면에 표시할 본인 정보를 조회한다.
export function getMyProfile(authFetch, signal) {
    return request(authFetch, "/members/me", { signal });
}

// 변경된 항목과 현재 비밀번호만 전달한다.
export function updateMyProfile(authFetch, payload) {
    return request(authFetch, "/members/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

// 새 이메일로 인증번호를 발송한다.
// 회원정보 수정에서는 /emails/verify를 별도로 호출하지 않는다.
export function sendProfileEmailCode(authFetch, email) {
    return request(authFetch, "/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
}