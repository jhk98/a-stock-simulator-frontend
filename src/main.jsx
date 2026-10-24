import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import ThemeSwitch from "./components/common/ThemeSwitch.jsx";

import "./index.css";
import "./theme.css";

let preference = "system";

try {
    const stored = localStorage.getItem("stock-theme");

    if (["light", "dark", "system"].includes(stored)) {
        preference = stored;
    }
} catch {
    // 저장소 접근 실패 시 시스템 설정을 사용한다.
}

const initialTheme = preference === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    : preference;

document.documentElement.dataset.theme = initialTheme;
document.documentElement.style.colorScheme = initialTheme;

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
        <ThemeSwitch />
    </StrictMode>
);