import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../services/firebaseConfig";
import { useTheme } from "../ThemeContext";

export default function LeanV2OnboardingScreen() {
  const { colors, isDark } = useTheme();

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleGetStarted = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert(
        "Name required",
        "Please enter your name before continuing.",
      );
      return;
    }

    const userId = auth.currentUser?.uid;

    if (!userId) {
      Alert.alert(
        "Sign in required",
        "Please sign in again and continue.",
      );
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(
        doc(db, "users", userId),
        {
          displayName: trimmedName,
          leanV2OnboardingComplete: false,
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      /*
       * Temporary for this step.
       *
       * Next we will replace this with:
       * setStep("income")
       */
      Alert.alert(
        "Saved",
        `Welcome, ${trimmedName}! Your name has been saved.`,
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Could not save your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark
                ? "#1E293B"
                : "#EFF6FF",
            },
          ]}
        >
          <Text style={styles.icon}>👋</Text>
        </View>

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
          Let's make your money easier to understand, control, and save.
        </Text>

        <View style={styles.form}>
          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            What should we call you?
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark
                  ? "#1F2937"
                  : "#F8FAFC",
                borderColor: isDark
                  ? "#374151"
                  : "#E2E8F0",
              },
            ]}
            placeholder="Enter your name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={50}
            returnKeyType="done"
            onSubmitEditing={handleGetStarted}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
              },
              isSaving && styles.disabledButton,
            ]}
            onPress={handleGetStarted}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator
                size="small"
                color="white"
              />
            ) : (
              <Text style={styles.primaryButtonText}>
                Get Started
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.footerText,
            { color: colors.text },
          ]}
        >
          We'll use your real numbers to build a monthly plan that works for you.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  icon: {
    fontSize: 34,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.72,
    marginBottom: 36,
  },

  form: {
    width: "100%",
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 17,
    marginBottom: 16,
  },

  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  footerText: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.55,
    marginTop: 24,
  },
});

