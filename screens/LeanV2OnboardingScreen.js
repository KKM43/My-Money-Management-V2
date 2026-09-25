import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import { useTheme } from "../ThemeContext";

export default function LeanV2OnboardingScreen() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: colors.text },
        ]}
      >
        Welcome to My Money
      </Text>

      <Text
        style={[
          styles.subtitle,
          { color: colors.text },
        ]}
      >
        Let's understand your money and build your monthly plan.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    opacity: 0.7,
  },
});

