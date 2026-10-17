import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header({ loginUser, onLogout }) {

    // ============================================================
    // 1. 상태 관리
    // ============================================================

    // 프로필 메뉴 열림 여부
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    // 로그아웃 요청 진행 여부
    const [logoutLoading, setLogoutLoading] = useState(false);

    // 페이지 이동
    const navigate = useNavigate();


    // ============================================================
    // 2. 로그아웃 처리
    // ============================================================

    const handleLogout = async () => {

        // 로그아웃 중복 요청 방지
        if (logoutLoading) {
            return;
        }

        setLogoutLoading(true);

        try {

            /*
             * MainPage.jsx에서 전달한 onLogout() 실행
             *
             * MainPage
             *   → AuthContext.logout()
             *   → authApi.logoutApi()
             *   → POST /auth/logout
             *
             * 서버 로그아웃 요청이 완료될 때까지 기다린다.
             */
            await onLogout?.();

            // 프로필 메뉴 닫기
            setProfileMenuOpen(false);

            // 메인페이지 이동
            navigate('/', { replace: true });

        } catch (error) {

            console.error('로그아웃 처리 실패:', error);

        } finally {

            setLogoutLoading(false);
        }
    };


    // ============================================================
    // 3. 화면
    // ============================================================

    return (
        <header className="header">

            <div className="header-inner">

                {/* 사이트 로고 */}
                <Link to="/" className="logo">
                    STOCK SIMULATOR
                </Link>


                {/* 네비게이션 */}
                <nav className="navigation">

                    {loginUser ? (

                        // ========================================
                        // 로그인한 회원
                        // ========================================

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


                            {/* 프로필 메뉴 */}
                            <div className="profile-menu">

                                <button
                                    type="button"
                                    className="profile-button"
                                    onClick={() => {
                                        setProfileMenuOpen(!profileMenuOpen);
                                    }}
                                    aria-expanded={profileMenuOpen}
                                >
                                    {loginUser.name}님

                                    <span className="profile-arrow">
                                        {profileMenuOpen ? '▲' : '▼'}
                                    </span>
                                </button>


                                {/* 프로필 드롭다운 */}
                                {profileMenuOpen && (

                                    <div className="profile-dropdown">

                                        {/* 회원 정보 수정 */}
                                        <button type="button">
                                            회원 정보 수정
                                        </button>

                                        {/* 내 계좌 */}
                                        <button type="button">
                                            내 계좌
                                        </button>

                                        <div className="profile-divider" />


                                        {/* 로그아웃 */}
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            disabled={logoutLoading}
                                        >
                                            {logoutLoading
                                                ? '로그아웃 중...'
                                                : '로그아웃'}
                                        </button>


                                        {/* 회원 탈퇴 */}
                                        <button
                                            type="button"
                                            className="withdraw-button"
                                        >
                                            회원 탈퇴
                                        </button>

                                    </div>
                                )}

                            </div>

                        </>

                    ) : (

                        // ========================================
                        // 로그인하지 않은 방문자
                        // ========================================

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
    );
}

export default Header;