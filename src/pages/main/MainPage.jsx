import { Link } from 'react-router-dom';
import './MainPage.css';

function MainPage() {
    return (
        <div className="main-page">

            <header className="header">
                <div className="header-inner">
                    <div className="logo">
                        STOCK SIMULATOR
                    </div>

                    <nav className="navigation">
                        <a href="#">주식</a>
                        <a href="#">투자내역</a>
                        <Link to="/login">로그인</Link>
                    </nav>
                </div>
            </header>

            <main>
                <section className="hero">
                    <h1>실전처럼 시작하는 모의 주식 투자</h1>

                    <p>
                        실제 주식 데이터를 기반으로
                        부담 없이 투자 경험을 쌓아보세요.
                    </p>

                    <button type="button">
                        모의투자 시작하기
                    </button>
                </section>

                <section className="stocks">
                    <h2>주요 종목</h2>

                    <div className="stock-list">
                        <div className="stock-card">
                            <h3>삼성전자</h3>
                            <strong>71,200원</strong>
                            <span>+1.24%</span>
                        </div>

                        <div className="stock-card">
                            <h3>SK하이닉스</h3>
                            <strong>184,500원</strong>
                            <span>-0.32%</span>
                        </div>

                        <div className="stock-card">
                            <h3>NAVER</h3>
                            <strong>215,000원</strong>
                            <span>+2.10%</span>
                        </div>

                        <div className="stock-card">
                            <h3>카카오</h3>
                            <strong>42,300원</strong>
                            <span>+0.54%</span>
                        </div>
                    </div>
                </section>

                <section className="features">
                    <h2>모의투자 서비스</h2>

                    <div className="feature-list">
                        <div>
                            <h3>실시간 시세</h3>
                            <p>주식 종목의 가격과 변동을 확인합니다.</p>
                        </div>

                        <div>
                            <h3>가상 투자</h3>
                            <p>가상 자산으로 주식을 사고팔 수 있습니다.</p>
                        </div>

                        <div>
                            <h3>투자 현황</h3>
                            <p>보유 종목과 투자 결과를 확인합니다.</p>
                        </div>
                    </div>
                </section>
            </main>

        </div>
    );
}

export default MainPage;