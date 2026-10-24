import { useState } from "react";
import { Link } from "react-router-dom";

import Header from "../../components/common/Header.jsx";
import { money, useApiPolling } from "../../stock/simulationApi.js";
import "../main/MainPage.css";

export default function OrdersPage() {
    const [beforeId, setBeforeId] = useState(null);

    const path = beforeId == null
        ? "/simulation/orders"
        : `/simulation/orders?beforeId=${beforeId}`;

    const { data, loading, error, refresh } = useApiPolling(path, 10000);

    return (
        <div className="ds-page">
            <Header />

            <main className="ds-container">
                <div className="ds-heading">
                    <h1>내 모의 주문내역</h1>
                    <button
                        className="ds-button ds-secondary"
                        onClick={refresh}
                        disabled={loading}
                    >
                        새로고침
                    </button>
                </div>

                {loading && <p role="status">주문내역을 조회하고 있습니다.</p>}
                {error && <p className="ds-alert ds-error" role="alert">{error}</p>}

                {data && (
                    <section className="ds-card">
                        {data.items.length === 0 ? (
                            <p>표시할 주문내역이 없습니다.</p>
                        ) : (
                            <div className="ds-table-scroll">
                                <table className="ds-table">
                                    <thead>
                                    <tr>
                                        <th>주문번호</th>
                                        <th>종목</th>
                                        <th>종류</th>
                                        <th>체결가</th>
                                        <th>수량</th>
                                        <th>금액</th>
                                        <th>상태</th>
                                        <th>주문 시각</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {data.items.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.id}</td>
                                            <td>
                                                <Link to={`/trade?code=${encodeURIComponent(order.stockCode)}`}>
                                                    {order.stockName}
                                                </Link>
                                            </td>
                                            <td>{order.side === "BUY" ? "매수" : "매도"}</td>
                                            <td>{money(order.price)}</td>
                                            <td>{order.quantity.toLocaleString()}주</td>
                                            <td>{money(order.price * order.quantity)}</td>
                                            <td>
                                                {order.status === "COMPLETE"
                                                    ? "체결 완료"
                                                    : "취소"}
                                            </td>
                                            <td>{order.createdAt.replace("T", " ")}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="ds-actions">
                            <button
                                className="ds-button ds-secondary"
                                disabled={beforeId == null}
                                onClick={() => setBeforeId(null)}
                            >
                                최신 내역
                            </button>
                            <button
                                className="ds-button"
                                disabled={data.nextBefore == null}
                                onClick={() => setBeforeId(data.nextBefore)}
                            >
                                이전 내역 더 보기
                            </button>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}