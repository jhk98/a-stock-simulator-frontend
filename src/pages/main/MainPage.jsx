import { useState } from 'react';
import { Link } from 'react-router-dom';
import './MainPage.css';

function MainPage() {

    const [loginUser, setLoginUser] = useState(() => {
        const savedUser = localStorage.getItem('loginUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const handleLogout = () => {
        localStorage.removeItem('loginUser');
        setLoginUser(null);
    };

    return (
        <div className="main-page">

            <header className="header">
                <div className="header-inner">
                    <div className="logo">
                        STOCK SIMULATOR
                    </div>

                    <nav className="navigation">
                        {loginUser ? (
                            <>
                                <span>
                                    {loginUser.name}님
                                </span>

                                <button
                                    className="logout-button"
                                    onClick={handleLogout}
                                >
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    로그인
                                </Link>

                                <Link to="/signup">
                                    회원가입
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main>
                <section className="main-intro">
                    <div className="main-intro-content">
                        <p className="main-intro-label">STOCK SIMULATOR</p>

                        <h1>
                            투자 경험을 쌓는
                            <br />
                            가장 쉬운 방법
                        </h1>

                        <p className="main-intro-description">
                            실제 주식 시장을 기반으로
                            <br />
                            부담 없이 투자를 시작해보세요.
                        </p>
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