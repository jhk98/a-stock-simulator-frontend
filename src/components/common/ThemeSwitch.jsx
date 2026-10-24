import { useEffect, useState } from "react";

function readPreference() {
    try {
        const value = localStorage.getItem("stock-theme");
        return ["light", "dark", "system"].includes(value) ? value : "system";
    } catch {
        return "system";
    }
}

export default function ThemeSwitch() {
    const [preference, setPreference] = useState(readPreference);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");

        function apply() {
            const resolved = preference === "system"
                ? media.matches ? "dark" : "light"
                : preference;

            document.documentElement.dataset.theme = resolved;
            document.documentElement.style.colorScheme = resolved;
        }

        apply();
        media.addEventListener("change", apply);

        try {
            localStorage.setItem("stock-theme", preference);
        } catch {
            // 저장소를 사용할 수 없어도 현재 탭의 테마는 적용한다.
        }

        return () => media.removeEventListener("change", apply);
    }, [preference]);

    return (
        <div className="theme-switch">
            <label htmlFor="theme-choice">화면</label>
            <select
                id="theme-choice"
                value={preference}
                onChange={event => setPreference(event.target.value)}
            >
                <option value="system">시스템 설정</option>
                <option value="light">라이트</option>
                <option value="dark">다크</option>
            </select>
        </div>
    );
}