import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

// 동일 회원·주소의 진행 중인 일반 조회 요청을 공유한다.
const inFlightByClient = new WeakMap();

export async function apiJson(authFetch, path, options = {}) {
    const response = await authFetch(path, options);

    if (!response.ok) {
        let message = "요청을 처리하지 못했습니다.";
        let code = "";

        try {
            const body = await response.json();

            if (typeof body?.message === "string") {
                message = body.message;
            }

            if (typeof body?.code === "string") {
                code = body.code;
            }
        } catch {
            // JSON 오류 응답이 아니면 기본 안내를 사용한다.
        }

        const error = new Error(message);
        error.status = response.status;
        error.code = code;
        throw error;
    }

    return response.json();
}

function sharedRead(authFetch, memberId, path, force = false) {
    let requests = inFlightByClient.get(authFetch);

    if (!requests) {
        requests = new Map();
        inFlightByClient.set(authFetch, requests);
    }

    const key = `${memberId}:${path}`;
    const existing = requests.get(key);

    // 수동 새로고침은 이전 요청 대신 새 요청으로 조회한다.
    if (!force && existing) {
        return existing;
    }

    if (!existing && requests.size >= 64) {
        return Promise.reject(
            new Error("조회 요청이 많습니다. 잠시 후 다시 시도해주세요.")
        );
    }

    const promise = apiJson(authFetch, path, {
        signal: AbortSignal.timeout(30000)
    }).finally(() => {
        // 예전 요청의 종료가 새 요청을 목록에서 삭제하지 않게 한다.
        if (requests.get(key) === promise) {
            requests.delete(key);
        }
    });

    requests.set(key, promise);
    return promise;
}

// 인증·잘못된 요청·없는 리소스 오류에서는 이전 데이터를 유지하지 않는다.
function canKeepPreviousData(error) {
    return error.status == null
        || error.status === 429
        || error.status >= 500;
}

function errorMessage(error) {
    if (error.name === "TimeoutError") {
        return "조회 시간이 초과되었습니다. 다시 시도해주세요.";
    }

    return error.message || "조회에 실패했습니다.";
}

export function useApiPolling(path, interval = 10000) {
    const { authFetch, loginUser } = useAuth();
    const memberId = loginUser?.memberId ?? "guest";

    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState(null);

    const resourceKey = `${memberId}:${path}`;

    const refresh = useCallback(() => {
        setRevision(value => value + 1);
    }, []);

    useEffect(() => {
        if (!path) return;

        let cancelled = false;
        let timer;

        async function load(force = false) {
            if (cancelled) return;

            // 같은 리소스의 성공 데이터만 유지하면서 갱신 상태를 설정한다.
            setResult(previous => {
                const sameResource =
                    previous?.resourceKey === resourceKey;

                return {
                    resourceKey,
                    revision,
                    fetching: true,
                    data: sameResource ? previous.data : null,
                    error: sameResource ? previous.error : "",
                    updatedAt: sameResource ? previous.updatedAt : null
                };
            });

            try {
                const data = await sharedRead(
                    authFetch,
                    memberId,
                    path,
                    force
                );

                if (cancelled) return;

                setResult({
                    resourceKey,
                    revision,
                    fetching: false,
                    data,
                    error: "",
                    updatedAt: new Date().toISOString()
                });
            } catch (error) {
                if (cancelled) return;

                setResult(previous => {
                    const keep = previous?.resourceKey === resourceKey
                        && previous.data != null
                        && canKeepPreviousData(error);

                    return {
                        resourceKey,
                        revision,
                        fetching: false,
                        data: keep ? previous.data : null,
                        error: errorMessage(error) + (
                            keep
                                ? " 마지막으로 조회된 데이터를 표시합니다."
                                : ""
                        ),
                        updatedAt: keep ? previous.updatedAt : null
                    };
                });
            } finally {
                if (!cancelled && interval > 0) {
                    timer = window.setTimeout(tick, interval);
                }
            }
        }

        function tick() {
            if (cancelled) return;

            if (document.hidden) {
                timer = window.setTimeout(tick, interval);
                return;
            }

            load();
        }

        // 효과 정리 이후 실행되는 요청은 cancelled 검사로 막는다.
        Promise.resolve().then(() => load(revision > 0));

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [authFetch, memberId, path, interval, resourceKey, revision]);

    const current = result?.resourceKey === resourceKey ? result : null;

    const fetching = Boolean(path) && (
        current === null
        || current.revision !== revision
        || current.fetching
    );

    return {
        data: current?.data ?? null,
        error: current?.error ?? "",

        // 처음 가져오는 중과 기존 데이터를 갱신하는 중을 구분한다.
        loading: fetching && current?.data == null,
        refreshing: fetching,
        updatedAt: current?.updatedAt ?? null,
        refresh
    };
}

export function money(value) {
    if (value == null || !Number.isFinite(Number(value))) {
        return "—";
    }

    return `${Number(value).toLocaleString("ko-KR", {
        maximumFractionDigits: 2
    })}원`;
}

export function signedMoney(value) {
    if (value == null || !Number.isFinite(Number(value))) {
        return "—";
    }

    return `${Number(value) > 0 ? "+" : ""}${money(value)}`;
}

export function quoteTime(value) {
    if (!value) return "수집 전";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "시간 확인 불가";
    }

    return date.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul"
    });
}