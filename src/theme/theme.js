import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#4D96FF",
    secondary: "#6BCB77",
    background: "#F7F9FC",
    surface: "#FFFFFF",
    error: "#FF6B6B",
    text: "#222",
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#4D96FF",
    secondary: "#6BCB77",
    background: "#121212",
    surface: "#1E1E1E",
    error: "#FF6B6B",
    text: "#F5F5F5",
  },
};
