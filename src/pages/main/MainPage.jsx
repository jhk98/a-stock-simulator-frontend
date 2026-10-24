import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import Header from "../../components/common/Header.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
    apiJson,
    money,
    quoteTime,
    signedMoney,
    useApiPolling
} from "../../stock/simulationApi.js";

import "./MainPage.css";

function amountClass(value) {
    if (Number(value) > 0) return "trade-up";
    if (Number(value) < 0) return "trade-down";
    return "";
}

// 거래대금 상위 종목을 표시한다.
function PopularStocks() {
    const { data, error, loading } = useApiPolling("/market/popular", 30000);

    return (
        <section className="ds-card">
            <div className="ds-section-heading">
                <div>
                    <p className="ds-eyebrow">MARKET ACTIVITY</p>
                    <h2>거래대금 상위</h2>
                </div>
                <Link to="/stocks">전체 종목 보기 →</Link>
            </div>

            <p className="ds-muted">
                키움 KRX 거래대금 순위 · 관리종목 제외 · 등록된 코스피·코스닥 종목
            </p>

            {loading && <p role="status">순위를 확인하고 있습니다.</p>}
            {error && <p className="ds-alert ds-error" role="alert">{error}</p>}
            {data?.warning && <p className="ds-alert">{data.warning}</p>}

            <div className="ds-stock-grid">
                {data?.items.slice(0, 6).map(stock => (
                    <Link
                        className="popular-card"
                        key={stock.stockCode}
                        to={`/trade?code=${encodeURIComponent(stock.stockCode)}`}
                    >
                        <div className="popular-top">
                            <span className="popular-rank">#{stock.rank}</span>
                            <span className="ds-badge">{stock.market}</span>
                        </div>

                        {/* 종목코드는 출력하지 않는다. */}
                        <h3>{stock.stockName}</h3>
                        <strong className="ds-stock-price">
                            {money(stock.currentPrice)}
                        </strong>
                        <span className={amountClass(stock.changeRate)}>
                            {Number(stock.changeRate) > 0 ? "+" : ""}
                            {Number(stock.changeRate).toFixed(2)}%
                        </span>
                        <p className="ds-muted">
                            거래대금{" "}
                            {Number(stock.tradeValueMillion).toLocaleString("ko-KR")}
                            백만원
                        </p>
                    </Link>
                ))}
            </div>

            {data?.fetchedAt && (
                <p className="ds-muted">순위 수집: {quoteTime(data.fetchedAt)}</p>
            )}
        </section>
    );
}

// 계좌 잔액과 보유종목을 보여주는 투자현황 영역.
function InvestmentOverview() {
    const { authFetch, loginUser } = useAuth();
    const { data, error, loading, refresh } =
        useApiPolling("/simulation/overview");

    const [opening, setOpening] = useState(false);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState("");
    const busy = useRef(false);

    async function createAccount() {
        if (busy.current) return;

        busy.current = true;
        setCreating(true);
        setMessage("");

        try {
            // 현재 백엔드의 계좌 개설 API를 유지한다.
            await apiJson(authFetch, "/dashboard/account", { method: "POST" });
            setOpening(false);
            setMessage("모의계좌가 준비되었습니다.");
            refresh();
        } catch (requestError) {
            setMessage(requestError.message);
        } finally {
            busy.current = false;
            setCreating(false);
        }
    }

    return (
        <main className="ds-container">
            <div className="ds-heading">
                <div>
                    <p className="ds-eyebrow">MY INVESTMENT</p>
                    <h1>{loginUser.name}님의 투자 현황</h1>
                    <p className="ds-muted">
                        실제 시장 가격으로 경험하는 가상 투자.
                    </p>
                </div>
                <button
                    type="button"
                    className="ds-button ds-secondary"
                    onClick={refresh}
                >
                    화면 갱신
                </button>
            </div>

            {error && <p className="ds-alert ds-error" role="alert">{error}</p>}
            {message && <p className="ds-alert" role="status">{message}</p>}
            {loading && <p role="status">투자 정보를 조회하고 있습니다.</p>}

            {data && !data.account && (
                <section className="ds-card account-intro">
                    <p className="ds-eyebrow">START YOUR PORTFOLIO</p>
                    <h2>가상 자금 {money(data.initialBalance)}으로 시작하세요</h2>
                    <p className="ds-muted">
                        실제 계좌 연결 없이 회원당 하나의 모의계좌를 개설합니다.
                    </p>

                    {opening ? (
                        <div className="ds-actions">
                            <button
                                type="button"
                                className="ds-button"
                                disabled={creating}
                                onClick={createAccount}
                            >
                                {creating ? "개설 중..." : "모의계좌 생성하기"}
                            </button>
                            <button
                                type="button"
                                className="ds-button ds-secondary"
                                disabled={creating}
                                onClick={() => setOpening(false)}
                            >
                                돌아가기
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="ds-button"
                            onClick={() => setOpening(true)}
                        >
                            계좌 개설하기 →
                        </button>
                    )}
                </section>
            )}

            {data?.account && (
                <section className="ds-card">
                    <div className="ds-section-heading">
                        <h2>내 모의계좌</h2>
                        <span className="ds-badge">가상 자금</span>
                    </div>
                    <p className="ds-account-number">{data.account.accountNum}</p>
                    <div className="ds-summary">
                        <div>
                            <span>예수금</span>
                            <strong>{money(data.account.deposit)}</strong>
                        </div>
                        <div>
                            <span>총 평가자산</span>
                            <strong>{money(data.totalAssets)}</strong>
                        </div>
                        <div>
                            <span>초기자금 대비 손익</span>
                            <strong className={amountClass(data.totalProfit)}>
                                {signedMoney(data.totalProfit)}
                            </strong>
                        </div>
                        <div>
                            <span>초기자금</span>
                            <strong>{money(data.initialBalance)}</strong>
                        </div>
                    </div>

                    {!data.valuationComplete && (
                        <p className="ds-muted">
                            시세가 없거나 수집 후 2분이 지난 보유 종목이 있어
                            전체 평가금액을 표시하지 않습니다.
                        </p>
                    )}
                </section>
            )}

            {data && (
                <section className="ds-card">
                    <div className="ds-section-heading">
                        <h2>내 보유 종목</h2>
                        <Link to="/orders">주문내역 →</Link>
                    </div>

                    {data.holdings.length === 0 ? (
                        <div className="ds-empty">
                            <p>아직 보유 중인 종목이 없습니다.</p>
                            <Link to="/stocks" className="ds-button ds-secondary">
                                종목 둘러보기
                            </Link>
                        </div>
                    ) : (
                        <div className="ds-table-scroll">
                            <table className="ds-table">
                                <thead>
                                <tr>
                                    <th>종목</th>
                                    <th>수량</th>
                                    <th>평균 매입가</th>
                                    <th>저장 시세</th>
                                    <th>평가손익</th>
                                    <th>수집 시각</th>
                                </tr>
                                </thead>
                                <tbody>
                                {data.holdings.map(item => (
                                    <tr key={item.stockCode}>
                                        <td>
                                            {/* 식별자는 링크에만 사용한다. */}
                                            <Link
                                                to={`/trade?code=${encodeURIComponent(item.stockCode)}`}
                                            >
                                                <strong>{item.stockName}</strong>
                                            </Link>
                                        </td>
                                        <td>{item.quantity.toLocaleString()}주</td>
                                        <td>{money(item.avgPrice)}</td>
                                        <td>
                                            {money(item.quote?.currentPrice)}
                                            {!item.fresh && <small>갱신 필요</small>}
                                        </td>
                                        <td className={amountClass(item.unrealizedProfit)}>
                                            {signedMoney(item.unrealizedProfit)}
                                        </td>
                                        <td>{quoteTime(item.quote?.fetchedAt)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            <PopularStocks />

            <p className="ds-muted">
                시세는 주기적으로 수집됩니다.
                모의투자 손익에는 수수료와 세금이 포함되지 않습니다.
            </p>
        </main>
    );
}

export default function MainPage() {
    const { isAuthenticated, loginUser } = useAuth();

    return (
        <div className="ds-page">
            <Header />

            {isAuthenticated ? (
                <InvestmentOverview key={loginUser.memberId} />
            ) : (
                <main className="ds-container">
                    <section className="ds-card ds-intro account-intro">
                        <p className="ds-eyebrow">YOUR FIRST INVESTMENT</p>
                        <h1>실제 시장에서 배우는<br />나만의 모의투자</h1>
                        <p className="ds-muted">
                            가상 자금 1억 원으로 코스피·코스닥 투자를 경험하세요.
                        </p>
                        <div className="ds-actions">
                            <Link to="/login" className="ds-button">시작하기 →</Link>
                            <Link to="/signup" className="ds-button ds-secondary">
                                회원가입
                            </Link>
                        </div>
                    </section>
                </main>
            )}
        </div>
    );
}