import { useState } from "react";

import {
    money,
    quoteTime,
    useApiPolling
} from "../../stock/simulationApi.js";

import "./StockChart.css";

const WIDTH = 1000;
const HEIGHT = 420;

const LEFT = 24;
const RIGHT = 900;
const TOP = 24;
const BOTTOM = 290;

const VOLUME_TOP = 325;
const VOLUME_BOTTOM = 385;

const number = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0
});

function CandleCanvas({ candles, mode }) {
    const [hovered, setHovered] = useState(null);

    const minimum = Math.min(...candles.map(item => item.low));
    const maximum = Math.max(...candles.map(item => item.high));

    const padding = Math.max((maximum - minimum) * 0.08, 1);
    const minPrice = minimum - padding;
    const maxPrice = maximum + padding;

    const step = (RIGHT - LEFT) / candles.length;
    const candleWidth = Math.max(1, Math.min(step * 0.65, 16));

    const maxVolume = Math.max(
        1,
        ...candles.map(item => item.volume)
    );

    const selectedIndex = hovered == null
        ? candles.length - 1
        : Math.min(hovered, candles.length - 1);

    const selected = candles[selectedIndex];

    const x = index => LEFT + step * (index + 0.5);

    const y = price => (
        TOP
        + (maxPrice - price) / (maxPrice - minPrice)
        * (BOTTOM - TOP)
    );

    const linePath = candles.map((item, index) => (
        `${index === 0 ? "M" : "L"} ${x(index)} ${y(item.close)}`
    )).join(" ");

    const dateIndexes = [...new Set([
        0,
        Math.floor((candles.length - 1) / 2),
        candles.length - 1
    ])];

    function selectAtPointer(event) {
        const rect = event.currentTarget.getBoundingClientRect();

        const logicalX = (
            (event.clientX - rect.left) / rect.width
        ) * WIDTH;

        const index = Math.floor((logicalX - LEFT) / step);

        setHovered(
            Math.max(0, Math.min(candles.length - 1, index))
        );
    }

    function handleKeyDown(event) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            return;
        }

        event.preventDefault();

        if (event.key === "Home") {
            setHovered(0);
        } else if (event.key === "End") {
            setHovered(candles.length - 1);
        } else {
            const direction = event.key === "ArrowLeft" ? -1 : 1;
            setHovered(
                Math.max(
                    0,
                    Math.min(candles.length - 1, selectedIndex + direction)
                )
            );
        }
    }

    return (
        <>
            <div className="sc-details" aria-live="polite">
                <strong>{selected.date}</strong>
                <span>시가 <b>{money(selected.open)}</b></span>
                <span>고가 <b>{money(selected.high)}</b></span>
                <span>저가 <b>{money(selected.low)}</b></span>
                <span>종가·장중가 <b>{money(selected.close)}</b></span>
                <span>거래량 <b>{number.format(selected.volume)}주</b></span>
            </div>

            <div className="sc-scroll">
                <svg
                    className="sc-canvas"
                    width={WIDTH}
                    height={HEIGHT}
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    role="img"
                    aria-label="주가 차트. 마우스를 움직이거나 좌우 방향키로 날짜를 선택하세요."
                    tabIndex={0}
                    onPointerMove={selectAtPointer}
                    onPointerDown={selectAtPointer}
                    onPointerLeave={() => setHovered(null)}
                    onKeyDown={handleKeyDown}
                >
                    <title>일봉 가격 및 거래량 차트</title>

                    <rect
                        width={WIDTH}
                        height={HEIGHT}
                        fill="#ffffff"
                    />

                    {Array.from({ length: 5 }, (_, index) => {
                        const price = maxPrice
                            - (maxPrice - minPrice) * index / 4;

                        const position = y(price);

                        return (
                            <g key={index}>
                                <line
                                    x1={LEFT}
                                    x2={RIGHT}
                                    y1={position}
                                    y2={position}
                                    stroke="#e8edf4"
                                />
                                <text
                                    x={RIGHT + 12}
                                    y={position + 4}
                                    className="sc-axis"
                                >
                                    {number.format(price)}
                                </text>
                            </g>
                        );
                    })}

                    <line
                        x1={RIGHT}
                        x2={RIGHT}
                        y1={TOP}
                        y2={VOLUME_BOTTOM}
                        stroke="#dfe6ef"
                    />

                    {mode === "line" ? (
                        <path
                            d={linePath}
                            fill="none"
                            stroke="#2759cc"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                        />
                    ) : (
                        candles.map((item, index) => {
                            const color = item.close >= item.open
                                ? "#d53d45"
                                : "#2865ce";

                            const top = Math.min(y(item.open), y(item.close));
                            const height = Math.max(
                                1,
                                Math.abs(y(item.open) - y(item.close))
                            );

                            return (
                                <g key={item.date}>
                                    <line
                                        x1={x(index)}
                                        x2={x(index)}
                                        y1={y(item.high)}
                                        y2={y(item.low)}
                                        stroke={color}
                                        strokeWidth="1.2"
                                    />
                                    <rect
                                        x={x(index) - candleWidth / 2}
                                        y={top}
                                        width={candleWidth}
                                        height={height}
                                        fill={color}
                                    />
                                </g>
                            );
                        })
                    )}

                    <text
                        x={LEFT}
                        y={VOLUME_TOP - 10}
                        className="sc-axis"
                    >
                        거래량
                    </text>

                    {candles.map((item, index) => {
                        const height = item.volume / maxVolume
                            * (VOLUME_BOTTOM - VOLUME_TOP);

                        return (
                            <rect
                                key={item.date}
                                x={x(index) - candleWidth / 2}
                                y={VOLUME_BOTTOM - height}
                                width={candleWidth}
                                height={height}
                                fill={
                                    item.close >= item.open
                                        ? "#e99a9e"
                                        : "#9bb7e7"
                                }
                            />
                        );
                    })}

                    {dateIndexes.map(index => (
                        <text
                            key={index}
                            x={x(index)}
                            y={HEIGHT - 12}
                            textAnchor={
                                index === 0
                                    ? "start"
                                    : index === candles.length - 1
                                        ? "end"
                                        : "middle"
                            }
                            className="sc-axis"
                        >
                            {candles[index].date}
                        </text>
                    ))}

                    <line
                        x1={x(selectedIndex)}
                        x2={x(selectedIndex)}
                        y1={TOP}
                        y2={VOLUME_BOTTOM}
                        stroke="#63748e"
                        strokeDasharray="4 4"
                    />

                    <line
                        x1={LEFT}
                        x2={RIGHT}
                        y1={y(selected.close)}
                        y2={y(selected.close)}
                        stroke="#63748e"
                        strokeDasharray="4 4"
                    />

                    <circle
                        cx={x(selectedIndex)}
                        cy={y(selected.close)}
                        r="4"
                        fill="#172033"
                        stroke="#ffffff"
                        strokeWidth="2"
                    />

                    <rect
                        x={RIGHT + 2}
                        y={y(selected.close) - 12}
                        width="96"
                        height="24"
                        rx="4"
                        fill="#172033"
                    />

                    <text
                        x={RIGHT + 9}
                        y={y(selected.close) + 4}
                        fill="#ffffff"
                        fontSize="12"
                    >
                        {number.format(selected.close)}
                    </text>
                </svg>
            </div>
        </>
    );
}

export default function StockChart({ code }) {
    const [count, setCount] = useState(90);
    const [mode, setMode] = useState("candle");

    const { data, loading, error, refresh } = useApiPolling(
        code ? `/simulation/charts/${encodeURIComponent(code)}` : null,
        60000
    );

    const candles = data?.candles?.slice(-count) ?? [];

    return (
        <section className="ds-card stock-chart">
            <div className="sc-heading">
                <div>
                    <h2>주가 차트</h2>
                    <p>일봉 · 가격 단위: 원</p>
                </div>

                <button
                    type="button"
                    className="sc-button"
                    disabled={loading}
                    onClick={refresh}
                >
                    {loading ? "조회 중..." : "차트 갱신"}
                </button>
            </div>

            <div className="sc-toolbar">
                <div role="group" aria-label="차트 표시 기간">
                    {[30, 90, 180].map(value => (
                        <button
                            key={value}
                            type="button"
                            className="sc-button"
                            aria-pressed={count === value}
                            onClick={() => setCount(value)}
                        >
                            최근 {value}봉
                        </button>
                    ))}
                </div>

                <div role="group" aria-label="차트 종류">
                    <button
                        type="button"
                        className="sc-button"
                        aria-pressed={mode === "candle"}
                        onClick={() => setMode("candle")}
                    >
                        캔들
                    </button>
                    <button
                        type="button"
                        className="sc-button"
                        aria-pressed={mode === "line"}
                        onClick={() => setMode("line")}
                    >
                        종가선
                    </button>
                </div>
            </div>

            {loading && (
                <p className="sc-state" role="status">
                    키움 일봉 데이터를 불러오고 있습니다.
                </p>
            )}

            {error && (
                <p className="sc-state sc-error" role="alert">
                    {error}
                </p>
            )}

            {data && candles.length === 0 && (
                <p className="sc-state">
                    표시할 유효한 일봉 데이터가 없습니다.
                </p>
            )}

            {candles.length > 0 && (
                <CandleCanvas
                    key={`${code}:${count}:${mode}`}
                    candles={candles}
                    mode={mode}
                />
            )}

            <p className="sc-note">
                차트에 마우스를 올리면 해당 날짜의 가격을 확인할 수 있습니다.
                터치하거나 차트에 초점을 둔 뒤 좌우 방향키로도 선택할 수 있습니다.
            </p>

            <p className="sc-note">
                빨강은 시가 대비 상승·보합, 파랑은 시가 대비 하락입니다.
                마지막 일봉은 장중 변동할 수 있습니다.
                수정주가 미적용으로 기업행사에 따른 가격 차이가 나타날 수 있습니다.
            </p>

            {data && (
                <p className="sc-note">
                    표시 {candles.length}봉 · 수집 시각 {quoteTime(data.fetchedAt)}
                    {" · "}휴장일이나 유효한 가격이 없는 날짜는 채워 넣지 않습니다.
                </p>
            )}
        </section>
    );
}