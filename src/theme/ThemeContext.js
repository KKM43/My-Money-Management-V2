import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, LightTheme } from "./theme";

const THEME_MODE_KEY = "@my-money/theme-mode";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState("system");
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_MODE_KEY).then((storedMode) => {
      if (
        isMounted &&
        (storedMode === "system" ||
          storedMode === "light" ||
          storedMode === "dark")
      ) {
        setThemeMode(storedMode);
      }
    });

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const changeThemeMode = (nextMode) => {
    setThemeMode(nextMode);
    return AsyncStorage.setItem(THEME_MODE_KEY, nextMode);
  };

  const cycleThemeMode = () => {
    const nextMode =
      themeMode === "system"
        ? "light"
        : themeMode === "light"
          ? "dark"
          : "system";
    return changeThemeMode(nextMode);
  };

  const isDark = themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");
  const value = useMemo(
    () => ({
      colors: isDark ? DarkTheme.colors : LightTheme.colors,
      isDark,
      themeMode,
      cycleThemeMode,
    }),
    [isDark, themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
