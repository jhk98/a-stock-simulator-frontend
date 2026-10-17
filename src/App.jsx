import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 페이지 컴포넌트
import MainPage from './pages/main/MainPage';
import LoginPage from './pages/login/LoginPage';
import SignupPage from './pages/signup/SignupPage';
import KoreanStocksPage from './pages/stocks/KoreanStocksPage.jsx';

// JWT 인증 상태 관리
import { AuthProvider } from './auth/AuthContext.jsx';

function App() {
    return (
        <BrowserRouter>

            {/* 모든 페이지에서 로그인 상태를 공유하도록 설정 */}
            <AuthProvider>

                <Routes>
                    {/* 메인페이지 */}
                    <Route path="/" element={<MainPage />} />

                    {/* 로그인 */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* 회원가입 */}
                    <Route path="/signup" element={<SignupPage />} />

                    {/* 국내 주식 종목 */}
                    <Route path="/stocks" element={<KoreanStocksPage />} />
                </Routes>

            </AuthProvider>

        </BrowserRouter>
    );
}

export default App;