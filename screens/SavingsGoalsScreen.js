import React, { useEffect, useState } from "react";
import SavingsGoalItem from "../components/SavingsGoalItem";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";


import { db, auth } from "../services/firebaseConfig";
import { useTheme } from "../ThemeContext";

export default function SavingsGoalsScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [editingGoalId, setEditingGoalId] = useState(null);

  useEffect(() => {
    const goalsRef = collection(
      db,
      "users",
      auth.currentUser.uid,
      "savingsGoals",
    );

    return onSnapshot(
      goalsRef,
      (snapshot) => {
        setGoals(
          snapshot.docs.map((goal) => ({
            id: goal.id,
            ...goal.data(),
          })),
        );

        setIsLoading(false);
      },
      (error) => {
        console.error("Error loading savings goals:", error);
        setIsLoading(false);

        Alert.alert("Error", "Could not load savings goals.");
      },
    );
  }, []);

  const parseAmountToPaise = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      return null;
    }

    const [rupees, paise = ""] = trimmed.split(".");

    return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  };

  const handleAmountChange = (text, setter) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");

    if (parts.length > 2) {
      return;
    }

    const [rupees, paise = ""] = parts;

    setter(
      cleaned.includes(".") ? `${rupees || "0"}.${paise.slice(0, 2)}` : rupees,
    );
  };

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setSavedAmount("");
    setEditingGoalId(null);
  };

  const startEditingGoal = (goal) => {
    setEditingGoalId(goal.id);
    setName(goal.name || "");

    setTargetAmount(
      Number.isInteger(goal.targetAmountPaise)
        ? (goal.targetAmountPaise / 100).toFixed(2)
        : "",
    );

    setSavedAmount(
      Number.isInteger(goal.savedAmountPaise)
        ? (goal.savedAmountPaise / 100).toFixed(2)
        : "",
    );
  };

  const handleCreateGoal = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert(
        "Goal name required",
        "Please enter a name for your savings goal.",
      );
      return;
    }

    const targetAmountPaise = parseAmountToPaise(targetAmount);

    if (!Number.isInteger(targetAmountPaise) || targetAmountPaise <= 0) {
      Alert.alert(
        "Invalid target",
        "Please enter a valid target amount greater than ₹0.",
      );
      return;
    }

    const savedAmountPaise = savedAmount.trim()
      ? parseAmountToPaise(savedAmount)
      : 0;

    if (!Number.isInteger(savedAmountPaise) || savedAmountPaise < 0) {
      Alert.alert(
        "Invalid saved amount",
        "Please enter a valid current saved amount.",
      );
      return;
    }

    setIsSaving(true);

    try {
      if (editingGoalId) {
        await updateDoc(
          doc(db, "users", auth.currentUser.uid, "savingsGoals", editingGoalId),
          {
            name: trimmedName,
            targetAmountPaise,
            savedAmountPaise,
            updatedAt: serverTimestamp(),
          },
        );
      } else {
        await addDoc(
          collection(db, "users", auth.currentUser.uid, "savingsGoals"),
          {
            name: trimmedName,
            targetAmountPaise,
            savedAmountPaise,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        );
      }

      const wasEditing = Boolean(editingGoalId);

      resetForm();

      Alert.alert(
        "Success",
        wasEditing
          ? "Savings goal updated successfully."
          : "Savings goal created successfully.",
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async (goal) => {
    try {
      await deleteDoc(
        doc(db, "users", auth.currentUser.uid, "savingsGoals", goal.id),
      );

      if (editingGoalId === goal.id) {
        resetForm();
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>
          Savings Goals
        </Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {editingGoalId ? "Edit Goal" : "Create Goal"}
          </Text>

          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Goal name
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? "#252525" : "#F8F9FA",
                borderColor: isDark ? "#444" : "#E9ECEF",
              },
            ]}
            placeholder="Emergency fund"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Target amount
          </Text>

          <View
            style={[
              styles.amountInputContainer,
              {
                backgroundColor: isDark ? "#252525" : "#F8F9FA",
                borderColor: isDark ? "#444" : "#E9ECEF",
              },
            ]}
          >
            <Text style={styles.currencySymbol}>₹</Text>

            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="100000"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={(text) => handleAmountChange(text, setTargetAmount)}
            />
          </View>

          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Already saved
          </Text>

          <View
            style={[
              styles.amountInputContainer,
              {
                backgroundColor: isDark ? "#252525" : "#F8F9FA",
                borderColor: isDark ? "#444" : "#E9ECEF",
              },
            ]}
          >
            <Text style={styles.currencySymbol}>₹</Text>

            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={savedAmount}
              onChangeText={(text) => handleAmountChange(text, setSavedAmount)}
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, isSaving && styles.disabledButton]}
            onPress={handleCreateGoal}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="white" />

                <Text style={styles.createButtonText}>
                  {editingGoalId ? "Update Goal" : "Create Goal"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {editingGoalId && (
            <TouchableOpacity
              style={[styles.cancelEditButton, { borderColor: colors.primary }]}
              onPress={resetForm}
              disabled={isSaving}
            >
              <Text style={[styles.cancelEditText, { color: colors.primary }]}>
                Cancel Editing
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text
          style={[
            styles.sectionTitle,
            styles.goalsTitle,
            { color: colors.text },
          ]}
        >
          Your Goals
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : goals.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="flag-outline" size={36} color={colors.primary} />

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No savings goals yet
            </Text>

            <Text style={[styles.emptyText, { color: colors.text }]}>
              Create your first goal above.
            </Text>
          </View>
        ) : (
          goals.map((goal) => (
  <SavingsGoalItem
    key={goal.id}
    goal={goal}
    onEdit={() => startEditingGoal(goal)}
    onDelete={() => handleDeleteGoal(goal)}
  />
))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  placeholder: {
    width: 40,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  formCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },

  goalsTitle: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 16,
  },

  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  currencySymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",
    marginRight: 8,
  },

  amountInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
  },

  createButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.6,
  },

  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  emptyCard: {
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 12,
  },

  emptyText: {
    fontSize: 14,
    opacity: 0.65,
    marginTop: 5,
  },

  goalCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  goalName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "bold",
  },

  goalPercentage: {
    fontSize: 16,
    fontWeight: "bold",
  },

  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },

  goalAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  amountRight: {
    alignItems: "flex-end",
  },

  amountLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 3,
  },

  amountValue: {
    fontSize: 15,
    fontWeight: "600",
  },

  remainingText: {
    marginTop: 14,
    fontSize: 13,
    opacity: 0.7,
  },
  cancelEditButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },

  cancelEditText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
