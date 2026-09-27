import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
  deleteField,
} from "firebase/firestore";
import { db, auth } from "../../services/firebaseConfig";
import { LightTheme } from "../../theme/theme";
import styles from "./AddTransactionScreen.styles";
import { useTheme } from "../../theme/ThemeContext";
import { getMonthKeyFromDate } from "../../utils/month";
import {
  getAmountPaise,
  parseMoneyInputToPaise,
} from "../../utils/finance";


const ACCOUNT_TYPE_LABELS = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
  creditCard: "Credit card",
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

  const initialType =
    editingTransaction?.type || route?.params?.initialType || "expense";

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState(() => {
    if (editingTransaction) {
      return (getAmountPaise(editingTransaction) / 100).toFixed(2);
    }

    const routedAmountPaise = route?.params?.amountPaise;

    if (Number.isInteger(routedAmountPaise) && routedAmountPaise >= 0) {
      return (routedAmountPaise / 100).toFixed(2);
    }

    return "";
  });
  const [category, setCategory] = useState(editingTransaction?.category || "");
  const [note, setNote] = useState(
    editingTransaction
      ? editingTransaction.note || ""
      : route?.params?.note || "",
  );
  const [isOther, setIsOther] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (editingTransaction) {
      return getTransactionDate(editingTransaction);
    }

    const routedMonthKey = route?.params?.monthKey;

    if (!routedMonthKey || !/^\d{4}-\d{2}$/.test(routedMonthKey)) {
      return new Date();
    }

    const [year, month] = routedMonthKey.split("-").map(Number);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return new Date();
    }

    const today = new Date();

    const lastDayOfTargetMonth = new Date(year, month, 0).getDate();

    const day = Math.min(today.getDate(), lastDayOfTargetMonth);

    return new Date(year, month - 1, day);
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFixedCommitmentPicker, setShowFixedCommitmentPicker] =
    useState(false);
  const [accounts, setAccounts] = useState([]);
  const [fixedCommitments, setFixedCommitments] = useState([]);
  const [selectedFixedCommitmentId, setSelectedFixedCommitmentId] = useState(
    editingTransaction
      ? editingTransaction.fixedCommitmentId || ""
      : route?.params?.fixedCommitmentId || "",
  );
  const [selectedAccountId, setSelectedAccountId] = useState(
    editingTransaction?.accountId || "",
  );
  const [fromAccountId, setFromAccountId] = useState(
    editingTransaction?.fromAccountId || "",
  );
  const [toAccountId, setToAccountId] = useState(
    editingTransaction?.toAccountId || "",
  );
  const selectedMonthKey = getMonthKeyFromDate(selectedDate);
  const selectedFixedCommitment =
    fixedCommitments.find(
      (commitment) => commitment.id === selectedFixedCommitmentId,
    ) || null;

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setAccounts([]);
      return;
    }

    const accountsRef = collection(
      db,
      "users",
      userId,
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

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setFixedCommitments([]);
      return;
    }

    const planRef = doc(db, "users", userId, "monthlyPlans", selectedMonthKey);

    return onSnapshot(
      planRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setFixedCommitments([]);
          return;
        }

        const planData = snapshot.data();

        setFixedCommitments(
          Array.isArray(planData.fixedCommitments)
            ? planData.fixedCommitments
            : [],
        );
      },
      (error) => {
        console.error("Error loading fixed commitments:", error);

        setFixedCommitments([]);
      },
    );
  }, [selectedMonthKey]);

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

    const amountPaise = parseMoneyInputToPaise(amount);
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (type !== "transfer" && !selectedAccountId) {
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
      ...(type === "expense" && selectedFixedCommitment
        ? {
            fixedCommitmentId: selectedFixedCommitment.id,
          }
        : {}),
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
        const updateData =
          type === "transfer"
            ? {
                ...transactionData,
                accountId: deleteField(),
                fixedCommitmentId: deleteField(),
                paymentKind: paymentKind || deleteField(),
              }
            : {
                ...transactionData,
                fromAccountId: deleteField(),
                toAccountId: deleteField(),
                paymentKind: deleteField(),
                fixedCommitmentId:
                  type === "expense" && selectedFixedCommitment
                    ? selectedFixedCommitment.id
                    : deleteField(),
              };

        await updateDoc(
          doc(
            db,
            "users",
            auth.currentUser.uid,
            "transactions",
            editingTransaction.id,
          ),
          updateData,
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
              {isEditing
                ? "Edit Transaction"
                : type === "expense"
                  ? "Add Expense"
                  : type === "income"
                    ? "Add Income"
                    : "Add Transfer"}
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
                    { color: colors.text },
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
                    { color: colors.text },
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
                    { color: colors.text },
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
              {type === "transfer"
                ? "Transfer Between Accounts"
                : "Select Account"}
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
                <Text style={[styles.accountLabel, { color: colors.text }]}>
                  From account
                </Text>
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
                        fromAccountId === account.id &&
                          styles.selectedAccountCard,
                      ]}
                      onPress={() => setFromAccountId(account.id)}
                    >
                      <Text
                        style={[
                          styles.accountName,
                          fromAccountId === account.id &&
                            styles.selectedAccountText,
                        ]}
                        numberOfLines={1}
                      >
                        {account.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.accountLabel, { color: colors.text }]}>
                  To account
                </Text>
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
                        toAccountId === account.id &&
                          styles.selectedAccountCard,
                      ]}
                      onPress={() => setToAccountId(account.id)}
                    >
                      <Text
                        style={[
                          styles.accountName,
                          toAccountId === account.id &&
                            styles.selectedAccountText,
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
                    <Text
                      style={[styles.dateModalTitle, { color: colors.text }]}
                    >
                      Select transaction date
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      accessibilityLabel="Close date selector"
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[styles.dateModalValue, { color: colors.primary }]}
                  >
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
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="white"
                      />
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
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.categorySelectorText,
                      { color: colors.text },
                    ]}
                  >
                    {category || "Choose a category"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.text} />
                </TouchableOpacity>
              </>
            )}

            {type === "expense" && fixedCommitments.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Fixed Commitment
                </Text>

                <TouchableOpacity
                  style={[
                    styles.categorySelector,
                    {
                      backgroundColor: isDark ? "#252525" : "#F8F9FA",
                      borderColor: isDark ? "#444" : "#E9ECEF",
                    },
                  ]}
                  onPress={() => setShowFixedCommitmentPicker(true)}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={20}
                    color={colors.primary}
                  />

                  <Text
                    style={[
                      styles.categorySelectorText,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {selectedFixedCommitment
                      ? selectedFixedCommitment.name
                      : "Not a fixed commitment"}
                  </Text>

                  <Ionicons name="chevron-down" size={20} color={colors.text} />
                </TouchableOpacity>
              </>
            )}

            <Modal
              visible={showFixedCommitmentPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowFixedCommitmentPicker(false)}
            >
              <View style={styles.categoryModalOverlay}>
                <View
                  style={[
                    styles.categoryModal,
                    {
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <View style={styles.dateModalHeader}>
                    <Text
                      style={[
                        styles.dateModalTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Choose fixed commitment
                    </Text>

                    <TouchableOpacity
                      onPress={() => setShowFixedCommitmentPicker(false)}
                      accessibilityLabel="Close fixed commitment selector"
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[
                        styles.categorySelector,
                        {
                          backgroundColor: isDark ? "#252525" : "#F8F9FA",
                          borderColor: isDark ? "#444" : "#E9ECEF",
                        },
                      ]}
                      onPress={() => {
                        setSelectedFixedCommitmentId("");
                        setShowFixedCommitmentPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.categorySelectorText,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        Not a fixed commitment
                      </Text>
                    </TouchableOpacity>

                    {fixedCommitments.map((commitment) => (
                      <TouchableOpacity
                        key={commitment.id}
                        style={[
                          styles.categorySelector,
                          {
                            backgroundColor:
                              selectedFixedCommitmentId === commitment.id
                                ? isDark
                                  ? "#17365D"
                                  : "#E3F2FD"
                                : isDark
                                  ? "#252525"
                                  : "#F8F9FA",

                            borderColor:
                              selectedFixedCommitmentId === commitment.id
                                ? colors.primary
                                : isDark
                                  ? "#444"
                                  : "#E9ECEF",
                          },
                        ]}
                        onPress={() => {
                          setSelectedFixedCommitmentId(commitment.id);

                          setShowFixedCommitmentPicker(false);
                        }}
                      >
                        <Ionicons
                          name="receipt-outline"
                          size={20}
                          color={colors.primary}
                        />

                        <Text
                          style={[
                            styles.categorySelectorText,
                            {
                              color: colors.text,
                            },
                          ]}
                        >
                          {commitment.name}
                        </Text>

                        {selectedFixedCommitmentId === commitment.id && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

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
                  <View style={styles.dateModalHeader}>
                    <Text
                      style={[styles.dateModalTitle, { color: colors.text }]}
                    >
                      Choose category
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowCategoryPicker(false)}
                      accessibilityLabel="Close category selector"
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
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
                              borderColor: item.color,
                            },
                          ]}
                          onPress={() => {
                            handleCategorySelect(item);
                            setShowCategoryPicker(false);
                          }}
                        >
                          <View
                            style={[
                              styles.categoryIcon,
                              { backgroundColor: item.color },
                            ]}
                          >
                            <Ionicons
                              name={item.icon}
                              size={18}
                              color="white"
                            />
                          </View>
                          <Text
                            style={[
                              styles.categoryName,
                              { color: colors.text },
                            ]}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>

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
                        : type === "expense"
                          ? "Save Expense"
                          : type === "income"
                            ? "Save Income"
                            : "Save Transfer"}
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
