import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { LightTheme } from "../theme";

const { width, height } = Dimensions.get("window");

export default function BudgetSettingsScreen({ navigation }) {
  const [budget, setBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(0);

  useEffect(() => {
    loadCurrentBudget();
  }, []);

  const loadCurrentBudget = async () => {
    try {
      const userDoc = await getDoc(
        doc(db, "users", auth.currentUser.uid, "settings", "budget"),
      );
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentBudget(userData.monthlyBudget || 0);
        setBudget(userData.monthlyBudget?.toString() || "");
      }
    } catch (error) {
      console.log("Error loading budget:", error);
    }
  };

  const handleSaveBudget = async () => {
    if (!budget || parseFloat(budget) <= 0) {
      Alert.alert("Error", "Please enter a valid budget amount");
      return;
    }

    setIsLoading(true);
    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid, "settings", "budget"),
        {
          monthlyBudget: parseFloat(budget),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      Alert.alert("Success", "Budget updated successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[LightTheme.colors.primary, LightTheme.colors.secondary]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Budget Settings</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Form Card */}
          <View style={styles.formCard}>
            {/* Current Budget Display */}
            <View style={styles.currentBudgetCard}>
              <Text style={styles.currentBudgetLabel}>
                Current Monthly Budget
              </Text>
              <Text style={styles.currentBudgetAmount}>
                {formatCurrency(currentBudget)}
              </Text>
            </View>

            {/* Budget Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="wallet"
                size={20}
                color={LightTheme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.budgetInput}
                placeholder="Enter new budget"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
              />
              <Text style={styles.currencySymbol}>₹</Text>
            </View>

            {/* Budget Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Budget Tips</Text>
              <Text style={styles.tipText}>
                • Set a realistic budget based on your income
              </Text>
              <Text style={styles.tipText}>
                • Consider your fixed expenses (rent, bills)
              </Text>
              <Text style={styles.tipText}>
                • Leave room for unexpected expenses
              </Text>
              <Text style={styles.tipText}>• Review and adjust monthly</Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveBudget}
              disabled={isLoading}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.saveButtonText}>
                {isLoading ? "Saving..." : "Save Budget"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  currentBudgetCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    alignItems: "center",
  },
  currentBudgetLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  currentBudgetAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: LightTheme.colors.primary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  inputIcon: {
    marginRight: 12,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 18,
    fontWeight: "bold",
    color: LightTheme.colors.text,
    textAlign: "center",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: LightTheme.colors.primary,
    marginLeft: 8,
  },
  tipsContainer: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: LightTheme.colors.primary,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: LightTheme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: LightTheme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#B0BEC5",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
