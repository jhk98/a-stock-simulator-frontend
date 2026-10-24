import { useState } from "react";
import { Link } from "react-router-dom";

import Header from "../../components/common/Header.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
    money,
    quoteTime,
    useApiPolling
} from "../../stock/simulationApi.js";

import "../main/MainPage.css";
import "./StocksPage.css";

const MARKETS = [
    ["ALL", "전체"],
    ["KOSPI", "코스피"],
    ["KOSDAQ", "코스닥"]
];

const SORTS = [
    ["NAME_ASC", "가나다순"],
    ["PRICE_DESC", "가격순"],
    ["VOLUME_DESC", "거래량"],
    ["CHANGE_DESC", "급상승"],
    ["CHANGE_ASC", "급하락"]
];

const SORT_DESCRIPTIONS = {
    NAME_ASC: "종목 이름을 가나다순으로 표시합니다.",
    PRICE_DESC: "현재가가 높은 종목부터 표시합니다.",
    VOLUME_DESC: "당일 누적 거래량이 많은 종목부터 표시합니다.",
    CHANGE_DESC: "전일 대비 등락률이 높은 종목부터 표시합니다.",
    CHANGE_ASC: "전일 대비 등락률이 낮은 종목부터 표시합니다."
};

function changeClass(value) {
    if (value == null) return "";
    if (Number(value) > 0) return "stock-rate-up";
    if (Number(value) < 0) return "stock-rate-down";
    return "";
}

function formatChangeRate(value) {
    if (value == null) return "—";

    const rate = Number(value);
    return `${rate > 0 ? "+" : ""}${rate.toFixed(2)}%`;
}

function StockBrowser() {
    const [input, setInput] = useState("");
    const [query, setQuery] = useState({
        market: "ALL",
        keyword: "",
        sort: "PRICE_DESC",
        page: 0,
        size: 20
    });

    const params = new URLSearchParams(
        Object.entries(query).map(([key, value]) => [key, String(value)])
    );

    const {
        data,
        error,
        loading,
        refreshing,
        refresh
    } = useApiPolling(`/market/stocks?${params.toString()}`, 30000);

    // 조회 조건이 바뀌면 첫 페이지부터 조회한다.
    function change(field, value) {
        setQuery(previous => ({
            ...previous,
            [field]: value,
            page: 0
        }));
    }

    function search(event) {
        event.preventDefault();
        const keyword = input.trim();

        if (query.keyword === keyword && query.page === 0) {
            if (!refreshing) refresh();
            return;
        }

        change("keyword", keyword);
    }

    function movePage(page) {
        setQuery(previous => ({ ...previous, page }));
    }

    return (
        <>
            <section
                className="ds-card stock-toolbar"
                aria-label="종목 검색 및 정렬"
            >
                <div
                    className="stock-market-tabs"
                    role="group"
                    aria-label="시장 선택"
                >
                    {MARKETS.map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            className="stock-market-button"
                            aria-pressed={query.market === value}
                            onClick={() => change("market", value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="stock-toolbar-row">
                    <form
                        className="stock-search-form"
                        role="search"
                        aria-label="종목명 검색"
                        onSubmit={search}
                    >
                        <input
                            aria-label="종목명"
                            type="search"
                            maxLength={100}
                            value={input}
                            placeholder="종목명 검색"
                            onChange={event => setInput(event.target.value)}
                        />

                        <button type="submit" className="ds-button">
                            검색
                        </button>

                        {/* 현재 적용된 검색 조건을 다시 조회한다. */}
                        <button
                            type="button"
                            className="ds-button ds-secondary"
                            onClick={refresh}
                            disabled={refreshing}
                            aria-busy={refreshing}
                        >
                            {refreshing ? "갱신 중…" : "새로고침"}
                        </button>
                    </form>

                    <div className="stock-list-options">
                        <label className="stock-option">
                            <span>정렬</span>
                            <select
                                value={query.sort}
                                onChange={event =>
                                    change("sort", event.target.value)
                                }
                            >
                                {SORTS.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="stock-option">
                            <span>표시 개수</span>
                            <select
                                value={query.size}
                                onChange={event =>
                                    change("size", Number(event.target.value))
                                }
                            >
                                {[20, 50, 100].map(value => (
                                    <option key={value} value={value}>
                                        {value}개
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <p className="ds-muted stock-sort-description">
                    {SORT_DESCRIPTIONS[query.sort]}
                </p>
            </section>

            {loading && (
                <div className="stock-loading" role="status">
                    종목 조회 중…
                </div>
            )}

            {error && (
                <p className="ds-alert ds-error" role="alert">
                    {error}
                </p>
            )}

            {data && (
                <section className="ds-card" aria-busy={refreshing}>
                    <div className="ds-section-heading">
                        <h2>종목 목록</h2>
                        <span className="ds-muted">
                            {data.totalElements.toLocaleString()}개
                        </span>
                    </div>

                    <p className="ds-muted">
                        시세 수집 {data.pricedElements.toLocaleString()} /{" "}
                        {data.totalElements.toLocaleString()}종목.
                        가격·거래량·등락률 정렬에서 미수집 종목은
                        마지막에 표시합니다.
                    </p>

                    <div className="ds-table-scroll">
                        <table className="ds-table stock-list-table">
                            <thead>
                            <tr>
                                <th scope="col">종목</th>
                                <th scope="col">시장</th>
                                <th scope="col">현재가</th>
                                <th scope="col">등락률</th>
                                <th scope="col">거래량</th>
                                <th scope="col">시세 수집 시각</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.items.map(stock => (
                                <tr key={stock.id}>
                                    <td>
                                        {/* 코드는 내부 이동에만 사용한다. */}
                                        <Link
                                            to={`/trade?code=${encodeURIComponent(stock.stockCode)}`}
                                        >
                                            <strong>{stock.stockName}</strong>
                                        </Link>
                                    </td>
                                    <td>
                                            <span className="ds-badge">
                                                {stock.stockType}
                                            </span>
                                    </td>
                                    <td>
                                        {stock.currentPrice == null
                                            ? "미수집"
                                            : money(stock.currentPrice)}
                                    </td>
                                    <td className={changeClass(stock.changeRate)}>
                                        {formatChangeRate(stock.changeRate)}
                                    </td>
                                    <td>
                                        {stock.volume?.toLocaleString() ?? "—"}
                                    </td>
                                    <td>
                                        {quoteTime(stock.priceUpdatedAt)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {data.items.length === 0 && (
                        <p className="ds-empty">
                            조건에 맞는 종목이 없습니다.
                        </p>
                    )}

                    <nav
                        className="stock-pagination"
                        aria-label="종목 목록 페이지"
                    >
                        <button
                            type="button"
                            className="ds-button ds-secondary"
                            disabled={query.page === 0}
                            onClick={() => movePage(0)}
                        >
                            처음
                        </button>
                        <button
                            type="button"
                            className="ds-button ds-secondary"
                            disabled={query.page === 0}
                            onClick={() => movePage(query.page - 1)}
                        >
                            이전
                        </button>
                        <span>
                            {data.totalPages === 0 ? 0 : query.page + 1}
                            {" / "}{data.totalPages}
                        </span>
                        <button
                            type="button"
                            className="ds-button"
                            disabled={!data.hasNext}
                            onClick={() => movePage(query.page + 1)}
                        >
                            다음
                        </button>
                    </nav>
                </section>
            )}
        </>
    );
}

export default function StocksPage() {
    const { loginUser, isAuthenticated } = useAuth();

    return (
        <div className="ds-page stock-browser-page">
            <Header />
            <main className="ds-container">
                <div className="ds-heading">
                    <div>
                        <p className="ds-eyebrow">MARKET EXPLORER</p>
                        <h1>국내 주식 둘러보기</h1>
                        <p className="ds-muted">
                            종목을 선택하면 차트와 가격을 확인하고
                            매수·매도할 수 있습니다.
                        </p>
                    </div>
                </div>

                {isAuthenticated ? (
                    <StockBrowser key={loginUser.memberId} />
                ) : (
                    <section className="ds-card">
                        <p>로그인 후 종목을 조회할 수 있습니다.</p>
                        <Link to="/login" className="ds-button">
                            로그인
                        </Link>
                    </section>
                )}
            </main>
        </div>
    );
}