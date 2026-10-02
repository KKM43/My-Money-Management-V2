import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../services/firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import styles from "./ProfileScreen.styles";

const CONFIRMATION_TEXT = "DELETE";
const APP_VERSION = "1.0.0";

const THEME_OPTIONS = [
  { mode: "system", label: "System", icon: "phone-portrait-outline" },
  { mode: "light", label: "Light", icon: "sunny-outline" },
  { mode: "dark", label: "Dark", icon: "moon-outline" },
];

export default function ProfileScreen({ navigation }) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── User identity ──────────────────────────────────────────────────────────
  const user = auth.currentUser;
  const displayName = user?.displayName || null;
  const email = user?.email || null;
  const initial = (displayName?.[0] ?? email?.[0] ?? "U").toUpperCase();
  const headerName = displayName || "My Profile";

  // ── Reset logic (unchanged from original) ──────────────────────────────────
  const deleteAllUserData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("You must be signed in to reset your data.");
    }

    const [accountsSnapshot, transactionsSnapshot, monthlyPlansSnapshot] =
      await Promise.all([
        getDocs(collection(db, "users", userId, "accounts")),
        getDocs(collection(db, "users", userId, "transactions")),
        getDocs(collection(db, "users", userId, "monthlyPlans")),
      ]);
    const references = [
      ...accountsSnapshot.docs.map((item) => item.ref),
      ...transactionsSnapshot.docs.map((item) => item.ref),
      ...monthlyPlansSnapshot.docs.map((item) => item.ref),
      doc(db, "users", userId, "settings", "budget"),
    ];

    for (let index = 0; index < references.length; index += 500) {
      const batch = writeBatch(db);
      references.slice(index, index + 500).forEach((reference) => {
        batch.delete(reference);
      });
      await batch.commit();
    }
  };

  const handleReset = () => {
    if (confirmation !== CONFIRMATION_TEXT) {
      Alert.alert(
        "Confirmation required",
        `Type ${CONFIRMATION_TEXT} to continue.`,
      );
      return;
    }

    Alert.alert(
      "Delete all financial data?",
      "This permanently deletes your accounts, transactions, monthly plans, budgets, and history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAllUserData();
              setConfirmation("");
              Alert.alert(
                "Data deleted",
                "Your financial data has been reset.",
              );
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  // ── Sign out ───────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* ── User identity card ────────────────────────────────────────────── */}
        <View style={[styles.identityCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text
            style={[styles.userName, { color: colors.text }]}
            numberOfLines={1}
          >
            {headerName}
          </Text>
          {email ? (
            <Text
              style={[styles.userEmail, { color: colors.text }]}
              numberOfLines={1}
            >
              {email}
            </Text>
          ) : null}
        </View>

        {/* ── Appearance ───────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Appearance
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(({ mode, label, icon }) => {
              const isSelected = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.background,
                    },
                  ]}
                  onPress={() => setThemeMode(mode)}
                  accessibilityLabel={`Set theme to ${label}`}
                >
                  <Ionicons
                    name={icon}
                    size={18}
                    color={isSelected ? "white" : colors.text}
                  />
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      { color: isSelected ? "white" : colors.text },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Account
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
          >
            <View
              style={[
                styles.settingsRowIconContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
            </View>
            <Text
              style={[styles.settingsRowLabel, { color: colors.error }]}
            >
              Sign Out
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.error}
              style={{ opacity: 0.5 }}
            />
          </TouchableOpacity>
        </View>

        {/* ── About ────────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          About
        </Text>
        <View style={[styles.aboutCard, { backgroundColor: colors.surface }]}>
          <View style={styles.aboutRow}>
            <View style={styles.aboutRowLeft}>
              <Text style={[styles.aboutLabel, { color: colors.text }]}>
                My Money
              </Text>
              <Text style={[styles.aboutSubLabel, { color: colors.text }]}>
                Personal money manager
              </Text>
            </View>
          </View>
          <View style={[styles.aboutDivider, { backgroundColor: colors.text }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.text }]}>
              Version
            </Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>
              {APP_VERSION}
            </Text>
          </View>
        </View>

        {/* ── Data & Privacy ───────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Data & Privacy
        </Text>
        <View style={[styles.dangerCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.dangerTitle, { color: colors.error }]}>
            Reset Financial Data
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>
            Permanently deletes your accounts, transactions, monthly plans,
            budgets, and history. Your sign-in account will remain active.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.error,
                backgroundColor: colors.background,
              },
            ]}
            placeholder={`Type ${CONFIRMATION_TEXT} to confirm`}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            value={confirmation}
            onChangeText={setConfirmation}
          />
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { backgroundColor: colors.error },
              isDeleting && styles.disabledButton,
            ]}
            onPress={handleReset}
            disabled={isDeleting}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? "Deleting..." : "Delete all data"}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
