import './LoginPage.css';
import { Link } from "react-router-dom";

function LoginPage() {
    return (
        <div className="login-page">
            <div className="login-container">

                <div className="login-logo">
                    STOCK SIMULATOR
                </div>

                <h1>로그인</h1>

                <p className="login-description">
                    모의주식 투자를 시작해보세요.
                </p>

                <form className="login-form">

                    <div className="input-group">
                        <label htmlFor="loginId">
                            아이디
                        </label>

                        <input
                            id="loginId"
                            type="text"
                            placeholder="아이디를 입력해주세요."
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
                        />
                    </div>

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