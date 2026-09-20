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
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { LightTheme } from "../theme";
import { useTheme } from "../ThemeContext";

const { width, height } = Dimensions.get("window");
const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Other",
];
const currentMonthKey = `${new Date().getFullYear()}-${String(
  new Date().getMonth() + 1,
).padStart(2, "0")}`;

export default function BudgetSettingsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [budget, setBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(0);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [categoryBudget, setCategoryBudget] = useState("");
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

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
        setCategoryBudgets(userData.categoryBudgets || {});
      }
    } catch (error) {
      console.log("Error loading budget:", error);
    }
  };

  const handleSaveCategoryBudget = async () => {
    if (!categoryBudget || parseFloat(categoryBudget) <= 0) {
      Alert.alert("Error", "Please enter a valid category budget");
      return;
    }

    setIsLoading(true);
    try {
      const nextCategoryBudgets = {
        ...categoryBudgets,
        [`${currentMonthKey}|${category}`]: parseFloat(categoryBudget),
      };

      await setDoc(
        doc(db, "users", auth.currentUser.uid, "settings", "budget"),
        {
          categoryBudgets: nextCategoryBudgets,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      setCategoryBudgets(nextCategoryBudgets);
      setCategoryBudget("");
      Alert.alert("Success", `${category} budget updated successfully!`);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategoryBudget = () => {
    const categoryKey = `${currentMonthKey}|${category}`;
    const hasCurrentBudget = categoryBudgets[categoryKey] != null;
    const hasLegacyBudget = categoryBudgets[category] != null;
    if (!hasCurrentBudget && !hasLegacyBudget) {
      return;
    }

    Alert.alert(
      "Remove category budget?",
      `This will remove the ${category} budget for this month.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const nextCategoryBudgets = { ...categoryBudgets };
              delete nextCategoryBudgets[categoryKey];
              delete nextCategoryBudgets[category];
              await setDoc(
                doc(db, "users", auth.currentUser.uid, "settings", "budget"),
                {
                  categoryBudgets: nextCategoryBudgets,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true },
              );
              setCategoryBudgets(nextCategoryBudgets);
              setCategoryBudget("");
              Alert.alert("Success", `${category} budget removed.`);
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
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
          <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
            {/* Current Budget Display */}
            <View
              style={[
                styles.currentBudgetCard,
                { backgroundColor: isDark ? "#252525" : "#F8F9FA" },
              ]}
            >
              <Text style={[styles.currentBudgetLabel, { color: colors.text }]}>
                Current Monthly Budget
              </Text>
              <Text style={[styles.currentBudgetAmount, { color: colors.primary }]}>
                {formatCurrency(currentBudget)}
              </Text>
            </View>

            {/* Budget Input */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? "#252525" : "#F8F9FA",
                  borderColor: isDark ? "#444" : "#E9ECEF",
                },
              ]}
            >
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

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Category Budget
            </Text>
            <TouchableOpacity
              style={[
                styles.categorySelector,
                {
                  backgroundColor: isDark ? "#252525" : "#F8F9FA",
                  borderColor: isDark ? "#444" : "#E9ECEF",
                },
              ]}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
              <Text style={[styles.categorySelectorText, { color: colors.text }]}>
                {category}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>
            <Modal
              visible={showCategoryPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowCategoryPicker(false)}
            >
              <View style={styles.categoryModalOverlay}>
                <View
                  style={[
                    styles.categoryModal,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View style={styles.categoryModalHeader}>
                    <Text style={[styles.categoryModalTitle, { color: colors.text }]}>
                      Choose budget category
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowCategoryPicker(false)}
                      accessibilityLabel="Close category selector"
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.categoryGrid}>
                    {EXPENSE_CATEGORIES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.categoryButton,
                          {
                            borderColor: isDark ? "#444" : "#E9ECEF",
                            backgroundColor:
                              category === item ? colors.primary : colors.surface,
                          },
                        ]}
                        onPress={() => {
                          setCategory(item);
                          setCategoryBudget(
                            categoryBudgets[`${currentMonthKey}|${item}`]?.toString() ||
                              categoryBudgets[item]?.toString() ||
                              "",
                          );
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            { color: category === item ? "white" : colors.text },
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </Modal>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? "#252525" : "#F8F9FA",
                  borderColor: isDark ? "#444" : "#E9ECEF",
                },
              ]}
            >
              <Ionicons
                name="pricetag-outline"
                size={20}
                color={LightTheme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.budgetInput}
                placeholder="Category budget"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={categoryBudget}
                onChangeText={setCategoryBudget}
              />
              <Text style={styles.currencySymbol}>₹</Text>
            </View>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.primary }]}
              onPress={handleSaveCategoryBudget}
              disabled={isLoading}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                Save {category} Budget
              </Text>
            </TouchableOpacity>
            {!!categoryBudgets[`${currentMonthKey}|${category}`] && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleDeleteCategoryBudget}
                disabled={isLoading}
              >
                <Text style={styles.removeButtonText}>
                  Remove {category} Budget
                </Text>
              </TouchableOpacity>
            )}

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
    paddingVertical: 14,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
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
    padding: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: LightTheme.colors.text,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  categoryButton: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: LightTheme.colors.primary,
    borderColor: LightTheme.colors.primary,
  },
  categoryButtonText: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
  },
  categoryButtonTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  categoryModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  categoryModal: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  categoryModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: LightTheme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 18,
  },
  secondaryButtonText: {
    color: LightTheme.colors.primary,
    fontWeight: "bold",
  },
  removeButton: {
    alignItems: "center",
    marginBottom: 18,
  },
  removeButtonText: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
  currentBudgetCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
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
    marginBottom: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  inputIcon: {
    marginRight: 12,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 12,
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
    marginBottom: 16,
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
