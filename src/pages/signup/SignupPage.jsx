import { Link } from 'react-router-dom';
import './SignupPage.css';

function SignupPage() {
    return (
        <div className="signup-page">
            <div className="signup-container">

                <Link to="/" className="signup-logo">
                    STOCK SIMULATOR
                </Link>

                <h1>회원가입</h1>

                <p className="signup-description">
                    모의주식 투자를 시작하기 위한 정보를 입력해주세요.
                </p>

                <form className="signup-form">

                    <div className="input-group">
                        <label htmlFor="loginId">아이디</label>

                        <input
                            id="loginId"
                            type="text"
                            placeholder="아이디를 입력해주세요."
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="name">이름</label>

                        <input
                            id="name"
                            type="text"
                            placeholder="이름을 입력해주세요."
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">이메일</label>

                        <input
                            id="email"
                            type="email"
                            placeholder="example@email.com"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="phoneNumber">휴대폰 번호</label>

                        <input
                            id="phoneNumber"
                            type="tel"
                            placeholder="010-1234-5678"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="rgstNumber">주민등록번호</label>

                        <input
                            id="rgstNumber"
                            type="text"
                            placeholder="000000-0000000"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">비밀번호</label>

                        <input
                            id="password"
                            type="password"
                            placeholder="비밀번호를 입력해주세요."
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="passwordConfirm">비밀번호 확인</label>

                        <input
                            id="passwordConfirm"
                            type="password"
                            placeholder="비밀번호를 다시 입력해주세요."
                        />
                    </div>

                    <button
                        type="submit"
                        className="signup-button"
                    >
                        회원가입
                    </button>

                </form>

                <div className="signup-footer">
                    <span>이미 회원이신가요?</span>
                    <Link to="/login">로그인</Link>
                </div>

            </div>
        </div>
    );
}

export default SignupPage;