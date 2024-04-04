import { createContext, useContext, useState, useMemo } from "react";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import { Theme } from "@mui/material/styles/createTheme";
import CssBaseline from "@mui/material/CssBaseline";

interface ThemeContextType {
  theme: Theme;
  changeTheme: (index: number | undefined) => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: createTheme({}),
  changeTheme: () => { },
  isDarkMode: false,
  toggleDarkMode: () => { },
});

const possibleThemes = ["#E24646", "#BD6551", "#7B68B6", "#C46703", "#4169E1", "#4D8136", "#9987f5", "#A64D79"];

interface ThemeContextTypeProp {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeContextTypeProp) => {
  const localThemeIndex = localStorage.getItem("themeIndex");
  const localDarkMode = localStorage.getItem("darkMode") === "true";
  const [themeIndex, setThemeIndex] = useState(
    localThemeIndex ? parseInt(localThemeIndex) % possibleThemes.length : 0
  );
  const [isDarkMode, setIsDarkMode] = useState(localDarkMode);

  const theme = useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily: 'Manrope',
        },
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          background: {
            default: isDarkMode ? '#121212' : '#ffffff',
            paper: isDarkMode ? '#1e1e1e' : '#ffffff',
          },
          premium: {
            light: "#1DAA51",
            main: "#1DAA51",
            dark: "#1DAA51",
          },
          secondary: {
            light: "#38bdf8",
            main: "#007AFF",
            dark: "#0284c7",
          },
          primary: {
            light: possibleThemes[themeIndex],
            main: possibleThemes[themeIndex],
            dark: possibleThemes[themeIndex],
            error: "#FF1744",
            success: "#058F32",
            black: "#000000",
            text: isDarkMode ? "#ffffff" : "#000000",
            secondaryText: isDarkMode ? "#b0b0b0" : "#808080",
            verysad: "#D32F2F", // Deep red
            sad: "#F57C00", // Dark orange
            medium: "#FBC02D", // Gold
            happy: "#8BC34A", // Lime green
            veryhappy: "#388E3C", // Emerald green
            tertiaryText: "#f0edef",
          },
          tertiary: {
            main: "#000000",
            contrastText: "#ffffff", // Optional, if you need specific text colors for better readability
          },
          ios: {
            main: "#007AFF",
          },
          android: {
            main: "#3DDC84",
          },
          info: {
            main: "#9987f5",
            text: "#fff",
          },
        },
        iconSize: {
          small: 16,
          medium: 24,
          large: 32,
          habit: window.innerWidth < 768 ? 60 : 60,
        },
      }),
    [themeIndex, isDarkMode]
  );

  const changeTheme = (index: number | undefined) => {
    if (index === undefined) {
      index = (themeIndex + 1) % possibleThemes.length;
    }
    setThemeIndex(index % possibleThemes.length);
    localStorage.setItem("themeIndex", index.toString());
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("darkMode", (!isDarkMode).toString());
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, isDarkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
