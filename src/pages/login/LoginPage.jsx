import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {

    const navigate = useNavigate();

    // 입력값
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');

    // 오류 메시지
    const [errorMessage, setErrorMessage] = useState('');

    // 로그인
    const handleLogin = async (event) => {

        // form 기본 submit 동작 방지
        event.preventDefault();

        // 입력값 검증
        if (!loginId || !password) {
            setErrorMessage('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        try {

            const response = await fetch('http://localhost:8080/login', {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    loginId: loginId,
                    password: password
                })
            });

            // 로그인 실패
            if (!response.ok) {
                setErrorMessage('아이디 또는 비밀번호가 올바르지 않습니다.');
                return;
            }

            // 로그인 성공
            const data = await response.json();

            console.log('로그인 성공:', data);

            // 로그인한 회원 정보 저장
            localStorage.setItem('loginUser', JSON.stringify(data));

            // 메인페이지 이동
            navigate('/');

        } catch (error) {

            console.error('로그인 요청 실패:', error);

            setErrorMessage(
                '서버와 통신할 수 없습니다.'
            );
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">

                <Link to="/" className="login-logo">
                    STOCK SIMULATOR
                </Link>

                <h1>로그인</h1>

                <p className="login-description">
                    모의주식 투자를 시작해보세요.
                </p>

                <form
                    className="login-form"
                    onSubmit={handleLogin}
                >

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
                        />
                    </div>

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
                        />
                    </div>

                    {errorMessage && (
                        <p className="login-error">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                    >
                        로그인
                    </button>

                </form>

                <div className="login-footer">
                    <span>아직 회원이 아니신가요?</span>
                    <Link to="/signup">회원가입</Link>
                </div>

            </div>
        </div>
    );
}

export default LoginPage;