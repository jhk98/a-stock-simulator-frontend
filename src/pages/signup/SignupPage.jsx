import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignupPage.css';

function SignupPage() {

    const navigate = useNavigate();

    // 회원가입 입력값
    const [loginId, setLoginId] = useState('');
    const [name, setName] = useState('');
    const [emailId, setEmailId] = useState('');
    const [emailDomain, setEmailDomain] = useState('');
    const [emailDomainSelect, setEmailDomainSelect] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [rgstNumberFront, setRgstNumberFront] = useState('');
    const [rgstNumberBack, setRgstNumberBack] = useState('');
    const [passwd, setPasswd] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loginIdMessage, setLoginIdMessage] = useState('');

    // 오류 메시지
    const [errorMessage, setErrorMessage] = useState('');

    // 회원가입
    const handleSignup = async (event) => {

        event.preventDefault();

        // 이전 오류 메시지 초기화
        setErrorMessage('');

        // 빈 값 확인
        if (
            !loginId ||
            !name ||
            !emailId ||
            !emailDomain ||
            !phoneNumber ||
            !rgstNumberFront ||
            !rgstNumberBack ||
            !passwd ||
            !passwordConfirm
        ) {
            setErrorMessage('모든 항목을 입력해주세요.');
            return;
        }

        // 휴대폰 번호 확인
        if (phoneNumber.length !== 11) {
            setErrorMessage('휴대폰 번호 11자리를 입력해주세요.');
            return;
        }

        // 주민등록번호 확인
        if (
            rgstNumberFront.length !== 6 ||
            rgstNumberBack.length !== 7
        ) {
            setErrorMessage('주민등록번호를 정확하게 입력해주세요.');
            return;
        }

        // 비밀번호 확인
        if (passwd !== passwordConfirm) {
            setErrorMessage('비밀번호가 일치하지 않습니다. 다시 입력해주세요.');
            return;
        }

        try {

            const response = await fetch('http://localhost:8080/members', {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    loginId: loginId,
                    name: name,
                    email: `${emailId}@${emailDomain}`,
                    phoneNumber: phoneNumber,
                    rgstNumber: `${rgstNumberFront}-${rgstNumberBack}`,
                    passwd: passwd
                })
            });

            // 회원가입 실패
            if (!response.ok) {
                setErrorMessage('회원가입에 실패했습니다.');
                return;
            }

            // 회원가입 성공
            const data = await response.json();

            console.log('회원가입 성공:', data);

            alert('회원가입이 완료되었습니다.');

            // 로그인 페이지 이동
            navigate('/login');

        } catch (error) {

            console.error('회원가입 요청 실패:', error);

            setErrorMessage('서버와 통신할 수 없습니다.');
        }
    };

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

                <form
                    className="signup-form"
                    onSubmit={handleSignup}
                >

                    <div className="input-group">
                        <label htmlFor="name">
                            이름
                        </label>

                        <input
                            id="name"
                            type="text"
                            placeholder="이름을 입력해주세요."
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            onFocus={() => setErrorMessage('')}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="loginId">
                            아이디
                        </label>

                        <input
                            id="loginId"
                            type="text"
                            placeholder="아이디를 입력해주세요."
                            value={loginId}
                            onChange={(event) => {
                                const value = event.target.value;

                                if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value)) {
                                    setLoginIdMessage("아이디는 영문과 숫자로 작성해주세요.");
                                } else {
                                    setLoginIdMessage('');
                                }

                                const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');

                                setLoginId(filteredValue);
                            }}
                            onFocus={() => setErrorMessage('')}
                        />

                        {loginIdMessage && (
                            <p className="input-error">
                                {loginIdMessage}
                            </p>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="emailId">
                            이메일
                        </label>

                        <div className="email-input-group">
                            <input
                                id="emailId"
                                type="text"
                                placeholder="이메일"
                                value={emailId}
                                onChange={(event) =>
                                    setEmailId(event.target.value)
                                }
                                onFocus={() => setErrorMessage('')}
                            />

                            <span className="email-at">@</span>

                            <input
                                type="text"
                                placeholder="도메인"
                                value={emailDomain}
                                disabled={emailDomainSelect !== ''}
                                onChange={(event) =>
                                    setEmailDomain(event.target.value)
                                }
                                onFocus={() => setErrorMessage('')}
                            />

                            <select
                                value={emailDomainSelect}
                                onChange={(event) => {
                                    const domain = event.target.value;

                                    setEmailDomainSelect(domain);
                                    setErrorMessage('');

                                    if (domain === '') {
                                        setEmailDomain('');
                                    } else {
                                        setEmailDomain(domain);
                                    }
                                }}
                            >
                                <option value="">직접입력</option>
                                <option value="naver.com">naver.com</option>
                                <option value="gmail.com">gmail.com</option>
                                <option value="daum.net">daum.net</option>
                                <option value="kakao.com">kakao.com</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="phoneNumber">
                            휴대폰 번호
                        </label>

                        <input
                            id="phoneNumber"
                            type="text"
                            inputMode="numeric"
                            maxLength={11}
                            placeholder="01012345678"
                            value={phoneNumber}
                            onChange={(event) => {
                                const value = event.target.value.replace(/\D/g, '');
                                setPhoneNumber(value);
                            }}
                            onFocus={() => setErrorMessage('')}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="rgstNumber">
                            주민등록번호
                        </label>

                        <div className="rgst-number-group">
                            <input
                                id="rgstNumber"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="앞 6자리"
                                value={rgstNumberFront}
                                onChange={(event) => {
                                    const value = event.target.value.replace(/\D/g, '');
                                    setRgstNumberFront(value);
                                }}
                                onFocus={() => setErrorMessage('')}
                            />

                            <span>-</span>

                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={7}
                                placeholder="뒤 7자리"
                                value={rgstNumberBack}
                                onChange={(event) => {
                                    const value = event.target.value.replace(/\D/g, '');
                                    setRgstNumberBack(value);
                                }}
                                onFocus={() => setErrorMessage('')}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="passwd">
                            비밀번호
                        </label>

                        <input
                            id="passwd"
                            type="password"
                            placeholder="비밀번호를 입력해주세요."
                            value={passwd}
                            onChange={(event) =>
                                setPasswd(event.target.value)
                            }
                            onFocus={() => setErrorMessage('')}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="passwordConfirm">
                            비밀번호 확인
                        </label>

                        <input
                            id="passwordConfirm"
                            type="password"
                            placeholder="비밀번호를 다시 입력해주세요."
                            value={passwordConfirm}
                            onChange={(event) =>
                                setPasswordConfirm(event.target.value)
                            }
                            onFocus={() => setErrorMessage('')}
                        />

                        {passwordConfirm && (
                            passwd === passwordConfirm ? (
                                <p className="password-match">
                                    비밀번호가 일치합니다.
                                </p>
                            ) : (
                                <p className="password-mismatch">
                                    비밀번호가 일치하지 않습니다.
                                </p>
                            )
                        )}
                    </div>

                    {errorMessage && (
                        <p className="signup-error">
                            {errorMessage}
                        </p>
                    )}

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