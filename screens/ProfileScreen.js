import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { useTheme } from "../ThemeContext";

const CONFIRMATION_TEXT = "DELETE";

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAllUserData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("You must be signed in to reset your data.");
    }

    const [accountsSnapshot, transactionsSnapshot] = await Promise.all([
      getDocs(collection(db, "users", userId, "accounts")),
      getDocs(collection(db, "users", userId, "transactions")),
    ]);
    const references = [
      ...accountsSnapshot.docs.map((item) => item.ref),
      ...transactionsSnapshot.docs.map((item) => item.ref),
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
      Alert.alert("Confirmation required", `Type ${CONFIRMATION_TEXT} to continue.`);
      return;
    }

    Alert.alert(
      "Delete all financial data?",
      "This permanently deletes your accounts, transactions, budgets, and history.",
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
              Alert.alert("Data deleted", "Your financial data has been reset.");
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reset financial data
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>
            Permanently delete all accounts, transactions, budgets, and history.
            Your sign-in account will remain active.
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: "#888" }]}
            placeholder={`Type ${CONFIRMATION_TEXT} to confirm`}
            placeholderTextColor={colors.text}
            autoCapitalize="characters"
            value={confirmation}
            onChangeText={setConfirmation}
          />
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.disabledButton]}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  headerSpacer: { width: 24 },
  card: { borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    padding: 15,
  },
  disabledButton: { opacity: 0.6 },
  deleteButtonText: { color: "white", fontWeight: "bold" },
});
