import { useEffect, useState } from 'react';

import './MainPage.css';

import API_BASE_URL from '../../config/api.js';
import Header from '../../components/common/Header';

// 공통 JWT 인증 상태 관리
import { useAuth } from '../../auth/AuthContext.jsx';

function MainPage() {

    // ============================================================
    // 1. 로그인 상태 및 계좌 상태
    // ============================================================

    /*
     * 기존에는 localStorage에서 loginUser를 가져왔지만,
     * 이제 AuthContext에서 공통 로그인 상태를 가져온다.
     *
     * loginUser   : 로그인한 회원 정보
     * accessToken : JWT Access Token
     * authLoading : 새로고침 후 로그인 복원 진행 여부
     * logout      : 서버 로그아웃 및 인증 상태 초기화
     */
    const {
        loginUser,
        accessToken,
        authLoading,
        logout
    } = useAuth();

    // 계좌 정보
    const [account, setAccount] = useState(null);

    // 계좌 조회 진행 상태
    const [accountLoading, setAccountLoading] = useState(false);

    // 계좌 개설 진행 상태
    const [accountCreating, setAccountCreating] = useState(false);


    // ============================================================
    // 2. 로그인한 회원의 계좌 조회
    // ============================================================

    useEffect(() => {

        // 로그인 상태 복원 중에는 계좌 조회를 진행하지 않는다.
        if (authLoading) {
            return;
        }

        // 로그인하지 않았거나 회원 ID가 없는 경우 계좌 조회 중단
        if (!loginUser || !accessToken || loginUser.memberId == null) {
            setAccount(null);
            setAccountLoading(false);

            if (loginUser && accessToken && loginUser.memberId == null) {
                console.error(
                    "로그인 사용자 정보에 memberId가 없습니다.",
                    loginUser
                );
            }

            return;
        }

        // 이전 API 요청을 취소하기 위한 컨트롤러
        const controller = new AbortController();

        const fetchAccount = async () => {

            setAccountLoading(true);

            try {

                /*
                 * Spring Boot 계좌 조회 API
                 *
                 * JWT Access Token을 Authorization 헤더로 전달한다.
                 */
                const response = await fetch(
                    `${API_BASE_URL}/accounts?memberId=${loginUser.memberId}`,
                    {
                        method: 'GET',

                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        },

                        signal: controller.signal
                    }
                );

                // 계좌가 없는 회원
                if (response.status === 404) {
                    setAccount(null);
                    return;
                }

                // JWT 인증 오류
                if (response.status === 401) {
                    throw new Error('로그인 인증이 만료되었습니다.');
                }

                // 그 외 서버 오류
                if (!response.ok) {
                    throw new Error('계좌 정보를 불러오지 못했습니다.');
                }

                // 계좌 조회 성공
                const data = await response.json();

                if (!controller.signal.aborted) {
                    setAccount(data);
                }

            } catch (error) {

                // 요청이 취소된 경우 오류로 처리하지 않는다.
                if (error.name === 'AbortError') {
                    return;
                }

                console.error('계좌 조회 실패:', error);

            } finally {

                if (!controller.signal.aborted) {
                    setAccountLoading(false);
                }
            }
        };

        fetchAccount();

        /*
         * 컴포넌트가 사라지거나 인증 상태가 변경되면
         * 이전에 진행 중이던 계좌 조회 요청을 취소한다.
         */
        return () => {
            controller.abort();
        };

    }, [loginUser, accessToken, authLoading]);


    // ============================================================
    // 3. 계좌 개설
    // ============================================================

    const handleCreateAccount = async () => {

        // 로그인 여부 확인
        if (!loginUser || !accessToken) {
            alert('로그인이 필요합니다.');
            return;
        }

        // 중복 요청 방지
        if (accountCreating) {
            return;
        }

        setAccountCreating(true);

        try {

            // ----------------------------------------------------
            // 3-1. 계좌 생성 API
            // ----------------------------------------------------

            const response = await fetch(`${API_BASE_URL}/accounts`, {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`
                },

                body: JSON.stringify({
                    memberId: loginUser.memberId
                })
            });

            if (response.status === 401) {
                throw new Error('로그인 인증이 만료되었습니다.');
            }

            if (!response.ok) {
                throw new Error('계좌 개설에 실패했습니다.');
            }

            // 계좌 생성 결과
            const result = await response.json();

            console.log('생성된 accountId:', result.id);


            // ----------------------------------------------------
            // 3-2. 생성된 계좌 정보 다시 조회
            // ----------------------------------------------------

            const accountResponse = await fetch(
                `${API_BASE_URL}/accounts/${result.id}`,
                {
                    method: 'GET',

                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            if (!accountResponse.ok) {
                throw new Error('생성된 계좌 정보를 불러오지 못했습니다.');
            }

            const accountData = await accountResponse.json();


            // ----------------------------------------------------
            // 3-3. 화면의 계좌 상태 갱신
            // ----------------------------------------------------

            setAccount(accountData);

        } catch (error) {

            console.error('계좌 개설 실패:', error);
            alert(error.message);

        } finally {

            setAccountCreating(false);
        }
    };


    // ============================================================
    // 4. 로그아웃
    // ============================================================

    const handleLogout = async () => {

        try {

            /*
             * AuthContext의 logout() 호출
             *
             * 1. CSRF Token 조회
             * 2. POST /auth/logout 요청
             * 3. 서버 Refresh Token 무효화
             * 4. React 로그인 상태 초기화
             */
            await logout();

        } catch (error) {

            console.error('서버 로그아웃 실패:', error);

            alert(
                '서버 로그아웃 처리에 실패했습니다. 다시 시도해주세요.'
            );
        }
    };


    // ============================================================
    // 5. 로그인 상태 복원 중 화면
    // ============================================================

    /*
     * 페이지를 새로고침하면 AuthContext에서
     * Refresh Token으로 로그인 상태 복원을 시도한다.
     *
     * 복원이 끝나기 전에는 비로그인 메인화면을 표시하지 않는다.
     */
    if (authLoading) {
        return (
            <div className="main-page">
                <main>
                    <div className="account-status">
                        <p>로그인 상태를 확인하는 중입니다...</p>
                    </div>
                </main>
            </div>
        );
    }


    // ============================================================
    // 6. 메인페이지 화면
    // ============================================================

    return (
        <div className="main-page">

            {/* ====================================================
                Header
                ==================================================== */}

            <Header
                loginUser={loginUser}
                onLogout={handleLogout}
            />


            {/* ====================================================
                Main Content
                ==================================================== */}

            <main>

                {loginUser ? (

                    // ============================================
                    // 로그인한 회원의 메인페이지
                    // ============================================

                    <div className="dashboard">

                        {/* ========================================
                            내 투자 현황
                            ======================================== */}

                        <section className="dashboard-section">

                            <h1>{loginUser.name}님의 투자 현황</h1>

                            {accountLoading ? (

                                // 계좌 조회 중
                                <div className="account-status">
                                    <p>계좌 정보를 불러오는 중입니다...</p>
                                </div>

                            ) : account ? (

                                // 계좌가 있는 경우
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

                                // 계좌가 없는 경우
                                <div className="account-empty">

                                    <div>
                                        <strong>
                                            아직 개설된 계좌가 없습니다.
                                        </strong>

                                        <p>
                                            모의투자를 시작하려면 계좌를 개설해주세요.
                                        </p>

                                        <button
                                            type="button"
                                            className="account-open-button"
                                            onClick={handleCreateAccount}
                                            disabled={accountCreating}
                                        >
                                            {accountCreating
                                                ? '계좌 개설 중...'
                                                : '계좌 개설하기'}
                                        </button>
                                    </div>

                                </div>

                            )}

                        </section>


                        {/* ========================================
                            내 보유 종목
                            ======================================== */}

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


                        {/* ========================================
                            주요 종목
                            ======================================== */}

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

                    // ============================================
                    // 로그인하지 않은 방문자의 메인페이지
                    // ============================================

                    <>

                        {/* 서비스 소개 */}
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


                        {/* 서비스 기능 소개 */}
                        <section className="features">

                            <h2>모의투자 서비스</h2>

                            <div className="feature-list">

                                <div>
                                    <h3>실시간 시세</h3>
                                    <p>
                                        주식 종목의 가격과 변동을 확인합니다.
                                    </p>
                                </div>

                                <div>
                                    <h3>가상 투자</h3>
                                    <p>
                                        가상 자산으로 주식을 사고팔 수 있습니다.
                                    </p>
                                </div>

                                <div>
                                    <h3>투자 현황</h3>
                                    <p>
                                        보유 종목과 투자 결과를 확인합니다.
                                    </p>
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