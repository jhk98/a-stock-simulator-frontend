import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 공통 JWT 인증 관리
import { useAuth } from '../../auth/AuthContext.jsx';

// 로그인 페이지 CSS
import './LoginPage.css';

function LoginPage() {

    const navigate = useNavigate();

    // ============================================================
    // 1. 공통 인증 기능
    // ============================================================

    // AuthContext에서 로그인 함수를 가져온다.
    const { login } = useAuth();

    // ============================================================
    // 2. 로그인 입력값
    // ============================================================

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');

    // 오류 메시지
    const [errorMessage, setErrorMessage] = useState('');

    // 로그인 요청 진행 상태
    const [loading, setLoading] = useState(false);

    // ============================================================
    // 3. 로그인 처리
    // ============================================================

    const handleLogin = async (event) => {

        // form 기본 제출 동작 방지
        event.preventDefault();

        // 중복 로그인 요청 방지
        if (loading) {
            return;
        }

        // 이전 오류 메시지 초기화
        setErrorMessage('');

        // 아이디 및 비밀번호 입력 여부 확인
        if (!loginId.trim() || !password) {
            setErrorMessage('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        setLoading(true);

        try {

            /*
             * AuthContext의 login() 호출
             *
             * 내부 처리:
             * 1. POST /auth/login 요청
             * 2. Spring Boot에서 로그인 검증
             * 3. Access Token 발급
             * 4. Refresh Token을 HttpOnly 쿠키로 저장
             * 5. 사용자 정보와 Access Token을 React 메모리에 저장
             */
            await login(loginId.trim(), password);

            // 로그인 성공 시 메인페이지 이동
            navigate('/', { replace: true });

        } catch (error) {

            console.error('로그인 요청 실패:', error);

            // authApi.js에서 전달한 오류 메시지 표시
            setErrorMessage(
                error.message || '로그인 처리 중 오류가 발생했습니다.'
            );

        } finally {

            // 로그인 요청 종료
            setLoading(false);
        }
    };

    // ============================================================
    // 4. 로그인 화면
    // ============================================================

    return (
        <div className="login-page">
            <div className="login-container">

                {/* 로고 */}
                <Link to="/" className="login-logo">
                    STOCK SIMULATOR
                </Link>

                {/* 제목 */}
                <h1>로그인</h1>

                <p className="login-description">
                    모의주식 투자를 시작해보세요.
                </p>

                {/* 로그인 입력 폼 */}
                <form
                    className="login-form"
                    onSubmit={handleLogin}
                >

                    {/* 아이디 */}
                    <div className="input-group">
                        <label htmlFor="loginId">
                            아이디
                        </label>

                        <input
                            id="loginId"
                            type="text"
                            placeholder="아이디를 입력해주세요."
                            value={loginId}
                            onChange={(event) =>
                                setLoginId(event.target.value)
                            }
                            autoComplete="username"
                            disabled={loading}
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div className="input-group">
                        <label htmlFor="password">
                            비밀번호
                        </label>

                        <input
                            id="password"
                            type="password"
                            placeholder="비밀번호를 입력해주세요."
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    {/* 로그인 오류 메시지 */}
                    {errorMessage && (
                        <p className="login-error" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    {/* 로그인 버튼 */}
                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>

                </form>

                {/* 회원가입 이동 */}
                <div className="login-footer">
                    <span>아직 회원이 아니신가요?</span>
                    <Link to="/signup">회원가입</Link>
                </div>

            </div>
        </div>
    );
}

export default LoginPage;