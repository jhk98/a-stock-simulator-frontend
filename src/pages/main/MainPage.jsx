import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './MainPage.css';
import API_BASE_URL from "../../config/api.js";

function MainPage() {

    const [loginUser, setLoginUser] = useState(() => {
        const savedUser = localStorage.getItem('loginUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [account, setAccount] = useState(null);
    const [accountLoading, setAccountLoading] = useState(false);

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    useEffect(() => {

        // 로그인하지 않았다면 계좌를 조회할 필요가 없다.
        if (!loginUser) {
            setAccount(null);
            return;
        }

        const fetchAccount = async () => {

            setAccountLoading(true);

            try {
                const response = await fetch(
                    `${API_BASE_URL}/accounts?memberId=${loginUser.memberId}`
                );

                // 계좌가 없는 회원
                if (response.status === 404) {
                    setAccount(null);
                    return;
                }

                // 404가 아닌 다른 오류
                if (!response.ok) {
                    throw new Error('계좌 정보를 불러오지 못했습니다.');
                }

                // 계좌가 있는 회원
                const data = await response.json();

                setAccount(data);

            } catch (error) {
                console.error(error);

            } finally {
                setAccountLoading(false);
            }
        };

        fetchAccount();

    }, [loginUser]);

    const handleCreateAccount = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    memberId: loginUser.memberId
                })
            });

            if (!response.ok) {
                throw new Error('계좌 개설에 실패했습니다.');
            }

            // 계좌 생성 결과
            const result = await response.json();

            console.log('생성된 accountId:', result.id);

            // 생성된 계좌 정보 다시 조회
            const accountResponse = await fetch(
                `${API_BASE_URL}/accounts/${result.id}`
            );

            if (!accountResponse.ok) {
                throw new Error('생성된 계좌 정보를 불러오지 못했습니다.');
            }

            const accountData = await accountResponse.json();

            // 화면의 account 상태 갱신
            setAccount(accountData);

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

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
                                <Link to="/stocks">
                                    종목
                                </Link>

                                <Link to="/portfolio">
                                    내 투자
                                </Link>

                                <Link to="/orders">
                                    주문내역
                                </Link>

                                <div className="profile-menu">

                                    <button
                                        className="profile-button"
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    >
                                        {loginUser.name}님
                                        <span className="profile-arrow">
                                            {profileMenuOpen ? '▲' : '▼'}
                                        </span>
                                    </button>

                                    {profileMenuOpen && (
                                        <div className="profile-dropdown">

                                            <button>
                                                회원 정보 수정
                                            </button>

                                            <button>
                                                내 계좌
                                            </button>

                                            <div className="profile-divider" />

                                            <button onClick={handleLogout}>
                                                로그아웃
                                            </button>

                                            <button className="withdraw-button">
                                                회원 탈퇴
                                            </button>

                                        </div>
                                    )}

                                </div>
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
                {loginUser ? (
                    <div className="dashboard">

                        {/* 내 투자 현황 */}
                        <section className="dashboard-section">

                            <h1>{loginUser.name}님의 투자 현황</h1>

                            {accountLoading ? (

                                <div className="account-status">
                                    <p>계좌 정보를 불러오는 중입니다...</p>
                                </div>

                            ) : account ? (

                                <div className="asset-summary">
                                    <div className="total-asset">
                                        <span>총 자산</span>
                                        <strong>10,000,000원</strong>
                                    </div>

                                    <div className="asset-detail">
                                        <div>
                                            <span>예수금</span>
                                            <strong>7,000,000원</strong>
                                        </div>

                                        <div>
                                            <span>주식 평가금액</span>
                                            <strong>3,000,000원</strong>
                                        </div>

                                        <div>
                                            <span>평가손익</span>
                                            <strong>+150,000원</strong>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="account-empty">
                                    <div>
                                        <strong>아직 개설된 계좌가 없습니다.</strong>

                                        <p>
                                            모의투자를 시작하려면 계좌를 개설해주세요.
                                        </p>

                                        <button
                                            className="account-open-button"
                                            onClick={handleCreateAccount}
                                        >
                                            계좌 개설하기
                                        </button>
                                    </div>
                                </div>

                            )}
                        </section>

                        {/* 내 보유 종목 */}
                        <section className="dashboard-section">
                            <div className="section-header">
                                <h2>내 보유 종목</h2>

                                {account && (
                                    <button type="button">
                                        전체보기
                                    </button>
                                )}
                            </div>
                            {account ? (
                                <div className="holding-list">
                                    <div className="holding-item">
                                        <div>
                                            <strong>삼성전자</strong>
                                            <span>005930</span>
                                        </div>

                                        <div>
                                            <span>70,000원</span>
                                            <span>10주</span>
                                            <strong>+30,000원</strong>
                                        </div>
                                    </div>

                                    <div className="holding-item">
                                        <div>
                                            <strong>NAVER</strong>
                                            <span>035420</span>
                                        </div>

                                        <div>
                                            <span>210,000원</span>
                                            <span>3주</span>
                                            <strong>-15,000원</strong>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="holding-empty">
                                    <p>보유 중인 종목이 없습니다.</p>
                                </div>
                            )}
                        </section>

                        {/* 주요 종목 */}
                        <section className="dashboard-section">
                            <div className="section-header">
                                <h2>주요 종목</h2>
                                <button type="button">
                                    전체보기
                                </button>
                            </div>

                            <div className="stock-list">
                                <div className="stock-item">
                                    <strong>삼성전자</strong>

                                    <div>
                                        <span>70,000원</span>
                                        <span>+1.24%</span>
                                    </div>
                                </div>

                                <div className="stock-item">
                                    <strong>SK하이닉스</strong>

                                    <div>
                                        <span>180,000원</span>
                                        <span>+2.15%</span>
                                    </div>
                                </div>

                                <div className="stock-item">
                                    <strong>NAVER</strong>

                                    <div>
                                        <span>210,000원</span>
                                        <span>-0.85%</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <>
                        <section className="main-intro">
                            <div className="main-intro-content">
                                <p className="main-intro-label">
                                    STOCK SIMULATOR
                                </p>

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
                    </>
                )}
            </main>
        </div>
    );
}

export default MainPage;