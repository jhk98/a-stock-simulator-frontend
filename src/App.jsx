import {
    BrowserRouter,
    Link,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

import MainPage from "./pages/main/MainPage.jsx";
import LoginPage from "./pages/login/LoginPage.jsx";
import SignupPage from "./pages/signup/SignupPage.jsx";
import MemberPage from "./pages/member/MemberPage.jsx";
import StocksPage from "./pages/stocks/StocksPage.jsx";
import TradePage from "./pages/trade/TradePage.jsx";
import OrdersPage from "./pages/orders/OrdersPage.jsx";

// 로그인한 사용자는 로그인·회원가입 화면 대신 메인으로 이동한다.
function GuestOnly({ children }) {
    const { isAuthenticated } = useAuth();

    return isAuthenticated
        ? <Navigate to="/" replace />
        : children;
}

// 회원 전용 화면은 로그인한 경우에만 표시한다.
function MemberOnly({ children }) {
    const { isAuthenticated } = useAuth();

    return isAuthenticated
        ? children
        : <Navigate to="/login" replace />;
}

function NotFoundPage() {
    return (
        <main className="ds-container">
            <section className="ds-card">
                <h1>페이지를 찾을 수 없습니다</h1>
                <Link to="/" className="ds-button">
                    메인페이지로 이동
                </Link>
            </section>
        </main>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<MainPage />} />

                    <Route
                        path="/login"
                        element={
                            <GuestOnly>
                                <LoginPage />
                            </GuestOnly>
                        }
                    />

                    <Route
                        path="/signup"
                        element={
                            <GuestOnly>
                                <SignupPage />
                            </GuestOnly>
                        }
                    />

                    {/* 새로 추가한 개인정보 수정 화면 */}
                    <Route
                        path="/members/me"
                        element={
                            <MemberOnly>
                                <MemberPage />
                            </MemberOnly>
                        }
                    />

                    <Route path="/stocks" element={<StocksPage />} />

                    <Route
                        path="/trade"
                        element={
                            <MemberOnly>
                                <TradePage />
                            </MemberOnly>
                        }
                    />

                    <Route
                        path="/orders"
                        element={
                            <MemberOnly>
                                <OrdersPage />
                            </MemberOnly>
                        }
                    />

                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}