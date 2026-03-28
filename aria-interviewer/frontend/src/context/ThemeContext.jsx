import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("aria-theme") || "system"
  );

  useEffect(() => {
    let actualTheme = theme;

    if (theme === "system") {
      // Use system preference
      actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e) => {
        if (theme === "system") {
          document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
          document.documentElement.classList.toggle("dark", e.matches);
        }
      };

      mediaQuery.addEventListener("change", handleChange);

      // Cleanup listener on theme change or unmount
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    document.documentElement.setAttribute("data-theme", actualTheme);
    document.documentElement.classList.toggle("dark", actualTheme === "dark");
    localStorage.setItem("aria-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  const setThemeMode = (newTheme) => setTheme(newTheme);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
