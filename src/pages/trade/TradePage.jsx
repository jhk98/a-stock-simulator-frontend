import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Header from "../../components/common/Header.jsx";
import StockChart from "../../components/stock/StockChart.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
    apiJson,
    money,
    quoteTime,
    useApiPolling
} from "../../stock/simulationApi.js";

import "../main/MainPage.css";
import "../../components/stock/StockChart.css";

const REQUEST_ID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 저장소 데이터도 유효한 주문인지 검사한다.
function validRequest(request) {
    return request != null
        && typeof request.requestId === "string"
        && REQUEST_ID_PATTERN.test(request.requestId)
        && typeof request.stockCode === "string"
        && request.stockCode.trim().length > 0
        && request.stockCode.length <= 20
        && ["BUY", "SELL"].includes(request.side)
        && Number.isInteger(request.quantity)
        && request.quantity >= 1
        && request.quantity <= 1000000;
}

function readPending(key) {
    try {
        const raw = sessionStorage.getItem(key);

        if (!raw) {
            return { pending: null, error: "" };
        }

        const stored = JSON.parse(raw);

        // 이전 버전은 주문 자체를 저장했고, 새 버전은 종목명도 함께 저장한다.
        const request = stored?.request ?? stored;

        if (!validRequest(request)) {
            return {
                pending: null,
                error:
                    "이전 주문 복구 정보가 올바르지 않습니다. "
                    + "새 주문을 진행하지 말고 주문내역을 먼저 확인해주세요."
            };
        }

        return {
            pending: {
                request: {
                    requestId: request.requestId,
                    stockCode: request.stockCode,
                    side: request.side,
                    quantity: request.quantity
                },
                stockName: typeof stored.stockName === "string"
                    ? stored.stockName
                    : ""
            },
            error: ""
        };
    } catch {
        // 읽기 실패를 '미확정 주문 없음'으로 간주하지 않는다.
        return {
            pending: null,
            error:
                "주문 복구 정보를 읽지 못했습니다. "
                + "브라우저 저장소 상태와 주문내역을 확인한 뒤 다시 접속해주세요."
        };
    }
}

// 현재 서버가 명시적으로 거절한 응답만 복구 대상에서 제외한다.
function isDefiniteRejection(error) {
    if (error.status === 400) {
        return [
            "INVALID_REQUEST",
            "INVALID_SIMULATION_REQUEST",
            "SIMULATION_REQUEST_FAILED"
        ].includes(error.code);
    }

    return error.status === 404
        && error.code === "SIMULATION_REQUEST_FAILED";
}

function changeClass(value) {
    const amount = Number(value);

    if (amount > 0) return "trade-up";
    if (amount < 0) return "trade-down";

    return "trade-flat";
}

function changeText(value) {
    const amount = Number(value);

    if (amount > 0) return `▲ +${money(amount)}`;
    if (amount < 0) return `▼ -${money(Math.abs(amount))}`;

    return "보합 0원";
}

function rateText(value) {
    const amount = Number(value);
    return `${amount > 0 ? "+" : ""}${amount.toFixed(2)}%`;
}

function TradeForm({ code }) {
    const { authFetch, loginUser } = useAuth();
    const storageKey = `simulation-pending-${loginUser.memberId}`;

    const [initialRecovery] = useState(() => readPending(storageKey));
    const [pending, setPending] = useState(initialRecovery.pending);
    const [storageError, setStorageError] = useState(initialRecovery.error);

    const [side, setSide] = useState("BUY");
    const [quantity, setQuantity] = useState("1");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    const busyRef = useRef(false);

    const quote = useApiPolling(
        code ? `/simulation/quotes/${encodeURIComponent(code)}` : null
    );

    const portfolio = useApiPolling(
        code ? "/simulation/overview" : null
    );

    const held = portfolio.data?.holdings.find(
        item => item.stockCode === code
    );

    const locked = busy || Boolean(pending) || Boolean(storageError);

    // 오래된 데이터를 표시하더라도 조회 오류 중에는 새 주문을 막는다.
    const canOrder = !locked
        && Boolean(quote.data)
        && Boolean(portfolio.data?.account)
        && !quote.error
        && !portfolio.error;

    const count = Number(quantity);
    const validQuantity = Number.isInteger(count)
        && count >= 1
        && count <= 1000000;

    const estimatedTotal = validQuantity && quote.data
        ? quote.data.currentPrice * count
        : null;

    /*
     * 미확정 주문의 이름을 현재 선택 종목 이름으로 대체하지 않는다.
     * 이전 저장 형식에 이름이 없다면 같은 종목일 때만 현재 이름을 사용한다.
     */
    const pendingName = pending?.stockName || (
        pending?.request.stockCode === code
            ? quote.data?.stockName
            : ""
    ) || "이전 주문 종목";

    function clearRecovery(requestId) {
        setPending(null);

        try {
            const raw = sessionStorage.getItem(storageKey);

            if (raw) {
                const stored = JSON.parse(raw);
                const storedId = stored?.request?.requestId
                    ?? stored?.requestId;

                // 다른 요청의 복구 정보를 실수로 삭제하지 않는다.
                if (storedId !== requestId) {
                    throw new Error("RECOVERY_CHANGED");
                }

                sessionStorage.removeItem(storageKey);
            }

            setStorageError("");
        } catch {
            /*
             * 서버에서 확인한 주문 결과는 바꾸지 않는다.
             * 저장소 정리 실패는 별도 안내하고 새 주문을 제한한다.
             */
            setStorageError(
                "주문 결과는 확인했지만 브라우저 복구 정보 정리에 실패했습니다. "
                + "저장소 문제를 해결한 뒤 화면을 새로고침해주세요."
            );
        }
    }

    async function sendOrder(recovery) {
        if (busyRef.current) return;

        const request = recovery?.request;

        if (!validRequest(request)) {
            setStorageError("주문 복구 정보가 올바르지 않습니다.");
            return;
        }

        busyRef.current = true;
        setBusy(true);
        setMessage("");

        try {
            // 화면 이동·통신 지연 후에도 기존 요청번호를 그대로 사용한다.
            const order = await apiJson(authFetch, "/simulation/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
                signal: AbortSignal.timeout(30000)
            });

            setMessage(
                `주문 #${order.id}: ${order.stockName} `
                + `${order.quantity}주 `
                + `${order.side === "BUY" ? "매수" : "매도"} 완료. `
                + `체결가 ${money(order.price)}`
            );

            // 저장소 오류가 주문 성공을 실패로 바꾸지 않도록 분리한다.
            clearRecovery(request.requestId);

            portfolio.refresh();
            quote.refresh();
        } catch (error) {
            if (isDefiniteRejection(error)) {
                clearRecovery(request.requestId);
                setMessage(error.message);
            } else {
                /*
                 * 시간 초과·네트워크 오류·서버 오류·409는
                 * 임의로 실패 확정하거나 새 요청번호를 발급하지 않는다.
                 */
                const description = error.name === "TimeoutError"
                    ? "주문 응답을 기다리는 시간이 초과되었습니다."
                    : error.message || "주문 결과를 확인하지 못했습니다.";

                setMessage(
                    `${description} 주문내역을 확인하거나 `
                    + "아래에서 같은 주문으로 확인·재시도해주세요."
                );
            }
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    }

    function submit(event) {
        event.preventDefault();

        if (locked || busyRef.current) return;

        if (!validQuantity) {
            setMessage("수량은 1~1,000,000 사이의 정수로 입력해주세요.");
            return;
        }

        if (!canOrder) {
            setMessage("계좌와 시세를 정상적으로 조회한 뒤 주문해주세요.");
            return;
        }

        /*
         * 다른 화면에서 복구 정보가 저장되었을 가능성을 다시 확인한다.
         * 기존 미확정 주문을 새 주문으로 덮어쓰지 않는다.
         */
        const existing = readPending(storageKey);

        if (existing.error) {
            setStorageError(existing.error);
            return;
        }

        if (existing.pending) {
            setPending(existing.pending);
            setMessage("이전 주문 결과를 먼저 확인해주세요.");
            return;
        }

        const recovery = {
            request: {
                requestId: crypto.randomUUID(),
                stockCode: code,
                side,
                quantity: count
            },
            stockName: quote.data.stockName
        };

        try {
            sessionStorage.setItem(storageKey, JSON.stringify(recovery));
        } catch {
            setStorageError(
                "주문 복구 정보를 저장하지 못해 주문을 전송하지 않았습니다. "
                + "브라우저 저장소 상태를 확인한 뒤 다시 접속해주세요."
            );
            return;
        }

        setPending(recovery);
        sendOrder(recovery);
    }

    return (
        <main className="ds-container">
            <div className="ds-heading">
                <div>
                    <p className="ds-eyebrow">KOSPI · KOSDAQ</p>
                    <h1>종목 시세 · 모의거래</h1>
                </div>
                <Link to="/orders" className="ds-button ds-secondary">
                    주문내역
                </Link>
            </div>

            {!code && (
                <section className="ds-card">
                    <h2>거래할 종목을 선택해주세요</h2>
                    <p className="ds-muted">
                        헤더의 종목 메뉴에서 원하는 종목을 선택해주세요.
                    </p>
                </section>
            )}

            {storageError && (
                <p className="ds-alert ds-error" role="alert">
                    {storageError}
                </p>
            )}

            {message && (
                <p className="ds-alert" role="status">
                    {message}
                </p>
            )}

            {pending && (
                <section className="ds-card">
                    <h2>결과 확인이 필요한 주문</h2>
                    <p>
                        {pendingName} /{" "}
                        {pending.request.side === "BUY" ? "매수" : "매도"} /{" "}
                        {pending.request.quantity.toLocaleString()}주
                    </p>
                    <p className="ds-muted">
                        이전 주문이 확인되기 전에는 새 주문을 제한합니다.
                        아래 버튼은 기존 요청번호로 다시 전송합니다.
                        아직 체결되지 않았다면 재시도 시 체결될 수 있습니다.
                    </p>
                    <button
                        type="button"
                        className="ds-button"
                        disabled={busy || Boolean(storageError)}
                        onClick={() => sendOrder(pending)}
                    >
                        {busy ? "처리 중..." : "같은 주문 결과 확인·재시도"}
                    </button>
                </section>
            )}

            {quote.loading && (
                <p role="status">시세를 조회하고 있습니다.</p>
            )}

            {quote.error && (
                <p className="ds-alert ds-error" role="alert">
                    {quote.error}
                </p>
            )}

            {portfolio.error && (
                <p className="ds-alert ds-error" role="alert">
                    {portfolio.error}
                </p>
            )}

            {quote.data && (
                <section className="ds-card">
                    <span className="ds-badge">{quote.data.market}</span>
                    <h2>{quote.data.stockName}</h2>

                    <strong
                        className={`trade-price ${changeClass(quote.data.changePrice)}`}
                    >
                        {money(quote.data.currentPrice)}
                    </strong>

                    <p
                        className={`trade-change ${changeClass(quote.data.changePrice)}`}
                    >
                        전일 대비 {changeText(quote.data.changePrice)}
                        {" · "}
                        {rateText(quote.data.changeRate)}
                    </p>

                    <div className="trade-quote-meta">
                        <span>
                            거래량 {quote.data.volume.toLocaleString("ko-KR")}주
                        </span>
                        <span>
                            수집 시각 {quoteTime(quote.data.fetchedAt)}
                        </span>
                    </div>

                    <p className="ds-muted">
                        {quote.refreshing
                            ? "시세를 갱신하고 있습니다."
                            : "시세 조회 완료 후 약 10초 간격으로 다시 조회합니다."}
                        {" "}차트와 시세의 조회 시점은 다를 수 있습니다.
                    </p>
                </section>
            )}

            {code && <StockChart key={code} code={code} />}

            {portfolio.data && !portfolio.data.account && (
                <p className="ds-alert">
                    먼저 <Link to="/">내 투자에서 모의계좌를 개설</Link>
                    해주세요.
                </p>
            )}

            {code && (
                <section className="ds-card">
                    <h2>모의 주문</h2>
                    <p>예수금: {money(portfolio.data?.account?.deposit)}</p>
                    <p>
                        선택 종목 보유수량:{" "}
                        {portfolio.data
                            ? `${held?.quantity ?? 0}주`
                            : "확인 중"}
                    </p>

                    <form onSubmit={submit}>
                        <div className="trade-order-fields">
                            <label htmlFor="trade-side">거래 종류</label>
                            <select
                                id="trade-side"
                                value={side}
                                disabled={locked}
                                onChange={event => setSide(event.target.value)}
                            >
                                <option value="BUY">매수</option>
                                <option value="SELL">매도</option>
                            </select>

                            <label htmlFor="trade-quantity">수량</label>
                            <input
                                id="trade-quantity"
                                type="number"
                                min="1"
                                max="1000000"
                                step="1"
                                required
                                value={quantity}
                                disabled={locked}
                                onChange={event => setQuantity(event.target.value)}
                            />
                        </div>

                        <p>
                            화면 시세 기준 예상금액: {money(estimatedTotal)}
                        </p>

                        <p className="ds-muted">
                            체결가는 서버에서 새로 조회한 가격입니다.
                            예상금액과 달라질 수 있으며,
                            차트에서 선택한 과거 가격으로 체결하지 않습니다.
                        </p>

                        <button
                            type="submit"
                            className="ds-button"
                            disabled={!canOrder || !validQuantity}
                        >
                            {busy
                                ? "처리 중..."
                                : `모의 ${side === "BUY" ? "매수" : "매도"}`}
                        </button>
                    </form>
                </section>
            )}

            <p className="ds-muted">
                실제 돈이나 증권계좌 주문은 발생하지 않습니다.
                조회된 가격으로 즉시 체결하는 연습 모드이며,
                장 운영 여부·호가 잔량·부분 체결·수수료·세금은 반영하지 않습니다.
            </p>
        </main>
    );
}

export default function TradePage() {
    const { loginUser } = useAuth();
    const [params] = useSearchParams();

    // 선택한 종목은 미확정 주문의 종목과 관계없이 유지한다.
    const code = params.get("code") || "";

    return (
        <div className="ds-page">
            <Header />
            <TradeForm
                key={`${loginUser.memberId}:${code}`}
                code={code}
            />
        </div>
    );
}