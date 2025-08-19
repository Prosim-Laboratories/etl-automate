import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  // Main Colors
  primary: string;
  secondary: string;
  accent: string;
  background: string;

  // Text Colors
  primaryText: string;
  overlayText: string;
  lightText: string;
  darkText: string;
  secondaryText: string;
  selectedText: string;
  placeholderText: string;
  errorText: string;
  warningText: string;
  correctText: string;

  // Action Colors
  error: string;
  warning: string;
  deleteAccent: string;
  activeAccent: string;
  deactiveAccent: string;
  addAccent: string;

  // Box Colors
  borderArea: string;
  liftedArea: string;
  selectArea: string;
  selectedArea: string;
  errorArea: string;
  warningArea: string;
  shadowArea: string;

  // Theme switching functions
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  theme: Theme;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}) => {
  // Initialize theme from localStorage (or use the default)
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  // Track the system's color scheme
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Compute dark mode based on user selection or system preference
  const isDarkMode = theme === "system" ? systemPrefersDark : theme === "dark";

  // Update the root element's class based on the current theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = systemPrefersDark ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, systemPrefersDark]);

  // Merge the color definitions with theme switching functions
  const mergedTheme: ThemeContextType = {
    // Main Colors
    primary: "#007AFF",
    secondary: "#34C759",
    accent: isDarkMode ? "#CF6679" : "#FF5252",
    background: isDarkMode ? "#0a0a0aff" : "#FFFFFF",

    // Text Colors
    primaryText: isDarkMode ? "#EAEAEA" : "#121212",
    overlayText: isDarkMode ? "#121212" : "#EAEAEA",
    lightText: "#EAEAEA",
    darkText: "#121212",
    secondaryText: isDarkMode ? "#EAEAEA" : "#121212",
    selectedText: "#007AFF",
    placeholderText: isDarkMode ? "#525252" : "#CCCCCC",
    errorText: isDarkMode ? "#000000" : "#FFFFFF",
    warningText: isDarkMode ? "#000000" : "#FFFFFF",
    correctText: isDarkMode ? "#000000" : "#FFFFFF",

    // Action Colors
    error: "#FF5252",
    warning: isDarkMode ? "#EAEAEA" : "#121212",
    deleteAccent: "#FF5252",
    activeAccent: "#34C759",
    deactiveAccent: "grey",
    addAccent: "#FF5252",

    // Box Colors
    borderArea: isDarkMode ? "#333" : "#DDD",
    liftedArea: isDarkMode ? "#333" : "#DDD",
    selectArea: isDarkMode ? "#292929" : "#F0F0F0",
    selectedArea: isDarkMode ? "#292929" : "#F0F0F0",
    errorArea: isDarkMode ? "#292929" : "#F0F0F0",
    warningArea: isDarkMode ? "#292929" : "#F0F0F0",
    shadowArea: isDarkMode ? "#292929" : "#F0F0F0",

    theme,
    isDarkMode,
    toggleTheme: () => {
      // Toggle between "dark" and "light" (ignoring "system")
      const newTheme =
        theme === "dark" || (theme === "system" && !systemPrefersDark)
          ? "light"
          : "dark";
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
