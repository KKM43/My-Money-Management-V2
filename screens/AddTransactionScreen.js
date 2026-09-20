import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { LightTheme } from "../theme";
import { useTheme } from "../ThemeContext";

const { width, height } = Dimensions.get("window");

const ACCOUNT_TYPE_LABELS = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
  creditCard: "Credit card",
};

const getTransactionAmountPaise = (transaction) => {
  if (!transaction) return 0;

  return Number.isInteger(transaction.amountPaise)
    ? transaction.amountPaise
    : Math.round(Number(transaction.amount || 0) * 100);
};

const getTransactionDate = (transaction) => {
  if (!transaction) return new Date();

  if (transaction.occurredOn) {
    return new Date(`${transaction.occurredOn}T12:00:00`);
  }

  return new Date(transaction.date);
};

export default function AddTransactionScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const editingTransaction = route?.params?.transaction;
  const isEditing = Boolean(editingTransaction);

  const [type, setType] = useState(editingTransaction?.type || "expense");
  const [amount, setAmount] = useState(() => {
    if (!editingTransaction) return "";
    return (getTransactionAmountPaise(editingTransaction) / 100).toFixed(2);
  });
  const [category, setCategory] = useState(editingTransaction?.category || "");
  const [note, setNote] = useState(editingTransaction?.note || "");
  const [isOther, setIsOther] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() =>
    getTransactionDate(editingTransaction),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(
    editingTransaction?.accountId || "",
  );
  const [fromAccountId, setFromAccountId] = useState(
    editingTransaction?.fromAccountId || "",
  );
  const [toAccountId, setToAccountId] = useState(
    editingTransaction?.toAccountId || "",
  );

  useEffect(() => {
    const accountsRef = collection(
      db,
      "users",
      auth.currentUser.uid,
      "accounts",
    );

    return onSnapshot(
      accountsRef,
      (snapshot) => {
        setAccounts(
          snapshot.docs.map((account) => ({
            id: account.id,
            ...account.data(),
          })),
        );
      },
      (error) => {
        Alert.alert("Error", `Could not load accounts: ${error.message}`);
      },
    );
  }, []);

  const selectableAccounts = accounts.filter(
    (account) =>
      !account.isArchived ||
      account.id === selectedAccountId ||
      account.id === fromAccountId ||
      account.id === toAccountId,
  );

  const expenseCategories = [
    { name: "Food & Dining", icon: "restaurant", color: "#FF6B6B" },
    { name: "Transportation", icon: "car", color: "#4ECDC4" },
    { name: "Shopping", icon: "bag", color: "#45B7D1" },
    { name: "Entertainment", icon: "game-controller", color: "#96CEB4" },
    { name: "Bills & Utilities", icon: "receipt", color: "#FFEAA7" },
    { name: "Healthcare", icon: "medical", color: "#DDA0DD" },
    { name: "Education", icon: "school", color: "#98D8C8" },
    { name: "Other", icon: "ellipsis-horizontal", color: "#A0A0A0" },
  ];

  const incomeCategories = [
    { name: "Salary", icon: "briefcase", color: "#4ECDC4" },
    { name: "Freelance", icon: "laptop", color: "#45B7D1" },
    { name: "Investment", icon: "trending-up", color: "#96CEB4" },
    { name: "Gift", icon: "gift", color: "#FFEAA7" },
    { name: "Bonus", icon: "trophy", color: "#DDA0DD" },
    { name: "Other", icon: "ellipsis-horizontal", color: "#A0A0A0" },
  ];

  const currentCategories =
    type === "expense" ? expenseCategories : incomeCategories;

  const parseAmountToPaise = (value) => {
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      return null;
    }

    const [rupees, paise = ""] = value.split(".");
    return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  };

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const adjustSelectedDate = (days) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(nextDate);
  };

  const handleCategorySelect = (item) => {
    if (item.name === "Other") {
      setIsOther(true);
      setCategory("");
    } else {
      setIsOther(false);
      setCategory(item.name);
    }
  };

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const [rupees, paise = ""] = cleaned.split(".");

    setAmount(
      cleaned.includes(".") ? `${rupees || "0"}.${paise.slice(0, 2)}` : rupees,
    );
  };

  const handleAdd = async () => {
    if (!amount || (type !== "transfer" && !category)) {
      Alert.alert("Error", "Please enter an amount and complete the details");
      return;
    }

    const amountPaise = parseAmountToPaise(amount);
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (type !== "transfer" && !isEditing && !selectedAccountId) {
      Alert.alert(
        "Account required",
        selectableAccounts.length === 0
          ? "Create an active account before adding a transaction."
          : "Please select an account.",
      );
      return;
    }

    if (type === "transfer" && (!fromAccountId || !toAccountId)) {
      Alert.alert("Error", "Please select both accounts");
      return;
    }

    if (type === "transfer" && fromAccountId === toAccountId) {
      Alert.alert("Error", "Source and destination accounts must be different");
      return;
    }

    const toAccount = accounts.find((account) => account.id === toAccountId);
    const paymentKind =
      type === "transfer" && toAccount?.type === "creditCard"
        ? "cardPayment"
        : undefined;

    const transactionData = {
      type,
      amountPaise,
      category: type === "transfer" ? "Transfer" : category,
      note: note.trim(),
      occurredOn: formatLocalDate(selectedDate),
      updatedAt: serverTimestamp(),
      ...(type === "transfer"
        ? {
            fromAccountId,
            toAccountId,
            ...(paymentKind ? { paymentKind } : {}),
          }
        : selectedAccountId
          ? { accountId: selectedAccountId }
          : {}),
    };

    setIsLoading(true);

    try {
      if (isEditing) {
        await updateDoc(
          doc(
            db,
            "users",
            auth.currentUser.uid,
            "transactions",
            editingTransaction.id,
          ),
          transactionData,
        );

        Alert.alert("Success", "Transaction updated successfully!");
      } else {
        await addDoc(
          collection(db, "users", auth.currentUser.uid, "transactions"),
          {
            ...transactionData,
            createdAt: serverTimestamp(),
          },
        );

        Alert.alert(
          "Success",
          `${type === "expense" ? "Expense" : type === "income" ? "Income" : paymentKind === "cardPayment" ? "Card payment" : "Transfer"} added successfully!`,
        );
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
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
            <Text style={styles.title}>
              {isEditing ? "Edit Transaction" : "Add Transaction"}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Form Card */}
          <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
            {/* Transaction Type Toggle */}
            <View
              style={[
                styles.typeToggleContainer,
                { backgroundColor: isDark ? "#252525" : "#F8F9FA" },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: isDark ? "#252525" : "transparent" },
                  type === "expense" && styles.typeButtonActive,
                  type === "expense" && styles.expenseButton,
                ]}
                onPress={() => setType("expense")}
              >
                <Ionicons
                  name="remove-circle"
                  size={20}
                  color={type === "expense" ? "white" : "#FF6B6B"}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === "expense" && styles.typeButtonTextActive,
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: isDark ? "#252525" : "transparent" },
                  type === "income" && styles.typeButtonActive,
                  type === "income" && styles.incomeButton,
                ]}
                onPress={() => setType("income")}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={type === "income" ? "white" : "#4ECDC4"}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === "income" && styles.typeButtonTextActive,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: isDark ? "#252525" : "transparent" },
                  type === "transfer" && styles.typeButtonActive,
                  type === "transfer" && styles.transferButton,
                ]}
                onPress={() => setType("transfer")}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={20}
                  color={type === "transfer" ? "white" : "#4D96FF"}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === "transfer" && styles.typeButtonTextActive,
                  ]}
                >
                  Transfer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: isDark ? "#252525" : "#F8F9FA" },
              ]}
            >
              <Ionicons
                name="cash"
                size={20}
                color={LightTheme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={amount}
                onChangeText={handleAmountChange}
              />
              <Text style={styles.currencySymbol}>₹</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {type === "transfer" ? "Transfer Between Accounts" : "Select Account"}
            </Text>
            {selectableAccounts.length === 0 ? (
              <View
                style={[
                  styles.noAccountCard,
                  {
                    backgroundColor: isDark ? "#252525" : "#F8F9FA",
                    borderColor: isDark ? "#444" : "#E9ECEF",
                  },
                ]}
              >
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={LightTheme.colors.primary}
                />
                <Text style={[styles.accountHint, { color: colors.text }]}>
                  Create an active account before adding a new transaction.
                </Text>
                <TouchableOpacity
                  style={styles.createAccountButton}
                  onPress={() => navigation.navigate("Accounts")}
                >
                  <Text style={styles.createAccountButtonText}>
                    Create account
                  </Text>
                </TouchableOpacity>
              </View>
            ) : type === "transfer" ? (
              <>
                <Text style={[styles.accountLabel, { color: colors.text }]}>From account</Text>
                <View style={styles.accountsGrid}>
                  {selectableAccounts.map((account) => (
                    <TouchableOpacity
                      key={`from-${account.id}`}
                      style={[
                        styles.accountCard,
                        {
                          backgroundColor: isDark ? "#252525" : "#F8F9FA",
                          borderColor: isDark ? "#444" : "#E9ECEF",
                        },
                        fromAccountId === account.id && styles.selectedAccountCard,
                      ]}
                      onPress={() => setFromAccountId(account.id)}
                    >
                      <Text
                        style={[
                          styles.accountName,
                          fromAccountId === account.id && styles.selectedAccountText,
                        ]}
                        numberOfLines={1}
                      >
                        {account.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.accountLabel, { color: colors.text }]}>To account</Text>
                <View style={styles.accountsGrid}>
                  {selectableAccounts.map((account) => (
                    <TouchableOpacity
                      key={`to-${account.id}`}
                      style={[
                        styles.accountCard,
                        {
                          backgroundColor: isDark ? "#252525" : "#F8F9FA",
                          borderColor: isDark ? "#444" : "#E9ECEF",
                        },
                        toAccountId === account.id && styles.selectedAccountCard,
                      ]}
                      onPress={() => setToAccountId(account.id)}
                    >
                      <Text
                        style={[
                          styles.accountName,
                          toAccountId === account.id && styles.selectedAccountText,
                        ]}
                        numberOfLines={1}
                      >
                        {account.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.accountsGrid}>
                {selectableAccounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountCard,
                      {
                        backgroundColor: isDark ? "#252525" : "#F8F9FA",
                        borderColor: isDark ? "#444" : "#E9ECEF",
                      },
                      selectedAccountId === account.id &&
                        styles.selectedAccountCard,
                    ]}
                    onPress={() => setSelectedAccountId(account.id)}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={18}
                      color={
                        selectedAccountId === account.id
                          ? "white"
                          : LightTheme.colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.accountName,
                        selectedAccountId === account.id &&
                          styles.selectedAccountText,
                      ]}
                      numberOfLines={1}
                    >
                      {account.name}
                    </Text>
                    <Text
                      style={[
                        styles.accountType,
                        selectedAccountId === account.id &&
                          styles.selectedAccountText,
                      ]}
                    >
                      {ACCOUNT_TYPE_LABELS[account.type] || "Account"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Transaction Date
            </Text>

            <TouchableOpacity
              style={[
                styles.dateSelector,
                {
                  backgroundColor: isDark ? "#252525" : "#F8F9FA",
                  borderColor: isDark ? "#444" : "#E9ECEF",
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={LightTheme.colors.primary}
              />
              <Text style={[styles.dateSelectorText, { color: colors.text }]}>
                {formatDateForDisplay(selectedDate)}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#666" />
            </TouchableOpacity>

            <Modal
              visible={showDatePicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.dateModalOverlay}>
                <View
                  style={[
                    styles.dateModal,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View style={styles.dateModalHeader}>
                    <Text style={[styles.dateModalTitle, { color: colors.text }]}>
                      Select transaction date
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      accessibilityLabel="Close date selector"
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.dateModalValue, { color: colors.primary }]}>
                    {formatDateForDisplay(selectedDate)}
                  </Text>
                  <View style={styles.dateAdjustRow}>
                    <TouchableOpacity
                      style={styles.dateAdjustButton}
                      onPress={() => adjustSelectedDate(-1)}
                      accessibilityLabel="Previous day"
                    >
                      <Ionicons name="chevron-back" size={22} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.todayButton}
                      onPress={() => setSelectedDate(new Date())}
                    >
                      <Text style={styles.todayButtonText}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dateAdjustButton}
                      onPress={() => adjustSelectedDate(1)}
                      accessibilityLabel="Next day"
                    >
                      <Ionicons name="chevron-forward" size={22} color="white" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.dateDoneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.dateDoneButtonText}>Use this date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {type !== "transfer" && (
              <>
                {/* Category Selection */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Select Category
                </Text>
                <View style={styles.categoriesGrid}>
                  {currentCategories.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.categoryCard,
                        {
                          backgroundColor:
                            category === item.name
                              ? isDark
                                ? "#17365D"
                                : "#E3F2FD"
                              : isDark
                                ? "#252525"
                                : "#F8F9FA",
                          borderColor: isDark ? "#444" : item.color,
                        },
                        category === item.name && styles.selectedCategoryCard,
                        { borderColor: item.color },
                      ]}
                      onPress={() => handleCategorySelect(item)}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: item.color },
                        ]}
                      >
                        <Ionicons name={item.icon} size={18} color="white" />
                      </View>
                      <Text
                        style={[
                          styles.categoryName,
                          category === item.name && styles.selectedCategoryName,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Custom Category Input */}
            {isOther && (
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: isDark ? "#252525" : "#F8F9FA" },
                ]}
              >
                <Ionicons
                  name="create"
                  size={20}
                  color={LightTheme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter custom category"
                  placeholderTextColor="#999"
                  value={category}
                  onChangeText={setCategory}
                />
              </View>
            )}

            {/* Note Input */}
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: isDark ? "#252525" : "#F8F9FA" },
              ]}
            >
              <Ionicons
                name="document-text"
                size={20}
                color={LightTheme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.noteInput, { color: colors.text }]}
                placeholder="Add a note (optional)"
                placeholderTextColor="#999"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.saveButtonText}>
                    {isLoading
                      ? "Saving..."
                      : isEditing
                        ? "Update Transaction"
                        : "Save Transaction"}
                  </Text>
                </>
              )}
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
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  typeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseButton: {
    backgroundColor: "#FF6B6B",
  },
  incomeButton: {
    backgroundColor: "#4ECDC4",
  },
  transferButton: {
    backgroundColor: LightTheme.colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#666",
  },
  typeButtonTextActive: {
    color: "white",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: LightTheme.colors.text,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 24,
    fontWeight: "bold",
    color: LightTheme.colors.text,
    textAlign: "center",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: LightTheme.colors.primary,
    marginLeft: 8,
  },
  accountHint: {
    color: "#777",
    flex: 1,
    marginLeft: 10,
    marginBottom: 0,
    lineHeight: 20,
  },
  noAccountCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  createAccountButton: {
    backgroundColor: LightTheme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createAccountButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  accountLabel: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  accountsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  accountCard: {
    width: "48%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    padding: 12,
    marginBottom: 10,
  },
  selectedAccountCard: {
    backgroundColor: LightTheme.colors.primary,
    borderColor: LightTheme.colors.primary,
  },
  accountName: {
    color: LightTheme.colors.text,
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 6,
  },
  accountType: {
    color: "#777",
    fontSize: 12,
    marginTop: 2,
  },
  selectedAccountText: {
    color: "white",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: LightTheme.colors.text,
    marginBottom: 15,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  categoryCard: {
    width: (width - 100) / 2,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  selectedCategoryCard: {
    backgroundColor: "#E3F2FD",
    borderColor: LightTheme.colors.primary,
    shadowColor: LightTheme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    lineHeight: 14,
  },
  selectedCategoryName: {
    color: LightTheme.colors.primary,
    fontWeight: "bold",
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: LightTheme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
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

  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 16,
    color: LightTheme.colors.text,
    marginLeft: 12,
  },
  dateModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 24,
  },
  dateModal: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 18,
    padding: 22,
  },
  dateModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dateModalValue: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 26,
  },
  dateAdjustRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateAdjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LightTheme.colors.primary,
  },
  todayButton: {
    borderWidth: 1,
    borderColor: LightTheme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  todayButtonText: {
    color: LightTheme.colors.primary,
    fontWeight: "bold",
  },
  dateDoneButton: {
    alignItems: "center",
    backgroundColor: LightTheme.colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 24,
  },
  dateDoneButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
