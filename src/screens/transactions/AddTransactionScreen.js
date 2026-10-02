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

const getAccountIconName = (type) => {
  switch (type) {
    case "bank":
      return "business-outline";
    case "creditCard":
      return "card-outline";
    case "cash":
      return "cash-outline";
    case "wallet":
      return "wallet-outline";
    default:
      return "wallet-outline";
  }
};

const getAccountAccessibilityLabel = (account, roleContext) => {
  const typeLabel = ACCOUNT_TYPE_LABELS[account.type] || "Account";
  const base =
    account.type === "creditCard"
      ? `Select ${account.name} credit card`
      : `Select ${account.name} ${typeLabel} account`;
  return roleContext ? `${base} as ${roleContext}` : base;
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
    const effectiveCategory =
      type === "transfer"
        ? "Transfer"
        : category ||
          (type === "expense" && selectedFixedCommitment
            ? selectedFixedCommitment.name
            : "");

    if (!amount || (type !== "transfer" && !effectiveCategory)) {
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
      category: effectiveCategory,
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.05)",
              },
            ]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
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

        {/* Transaction Type Toggle (Segmented Control) */}
        <View
          style={[
            styles.typeToggleContainer,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.04)"
                : "#F1F5F9",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "#E2E8F0",
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "expense" && [
                styles.typeButtonActive,
                {
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.2)"
                    : "#FEE2E2",
                  borderColor: isDark
                    ? "rgba(239, 68, 68, 0.35)"
                    : "#FECACA",
                },
              ],
            ]}
            onPress={() => setType("expense")}
            accessibilityRole="button"
            accessibilityLabel="Expense"
            accessibilityState={{ selected: type === "expense" }}
          >
            <Ionicons
              name={
                type === "expense"
                  ? "remove-circle"
                  : "remove-circle-outline"
              }
              size={18}
              color={
                type === "expense"
                  ? isDark
                    ? "#F87171"
                    : "#DC2626"
                  : isDark
                    ? "#94A3B8"
                    : "#64748B"
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                {
                  color:
                    type === "expense"
                      ? isDark
                        ? "#F87171"
                        : "#DC2626"
                      : isDark
                        ? "#94A3B8"
                        : "#64748B",
                  fontWeight: type === "expense" ? "700" : "600",
                },
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "income" && [
                styles.typeButtonActive,
                {
                  backgroundColor: isDark
                    ? "rgba(34, 197, 94, 0.2)"
                    : "#DCFCE7",
                  borderColor: isDark
                    ? "rgba(34, 197, 94, 0.35)"
                    : "#BBF7D0",
                },
              ],
            ]}
            onPress={() => setType("income")}
            accessibilityRole="button"
            accessibilityLabel="Income"
            accessibilityState={{ selected: type === "income" }}
          >
            <Ionicons
              name={
                type === "income"
                  ? "add-circle"
                  : "add-circle-outline"
              }
              size={18}
              color={
                type === "income"
                  ? isDark
                    ? "#4ADE80"
                    : "#16A34A"
                  : isDark
                    ? "#94A3B8"
                    : "#64748B"
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                {
                  color:
                    type === "income"
                      ? isDark
                        ? "#4ADE80"
                        : "#16A34A"
                      : isDark
                        ? "#94A3B8"
                        : "#64748B",
                  fontWeight: type === "income" ? "700" : "600",
                },
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "transfer" && [
                styles.typeButtonActive,
                {
                  backgroundColor: isDark
                    ? "rgba(59, 130, 246, 0.2)"
                    : "#DBEAFE",
                  borderColor: isDark
                    ? "rgba(59, 130, 246, 0.35)"
                    : "#BFDBFE",
                },
              ],
            ]}
            onPress={() => setType("transfer")}
            accessibilityRole="button"
            accessibilityLabel="Transfer"
            accessibilityState={{ selected: type === "transfer" }}
          >
            <Ionicons
              name="swap-horizontal"
              size={18}
              color={
                type === "transfer"
                  ? isDark
                    ? "#60A5FA"
                    : "#2563EB"
                  : isDark
                    ? "#94A3B8"
                    : "#64748B"
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                {
                  color:
                    type === "transfer"
                      ? isDark
                        ? "#60A5FA"
                        : "#2563EB"
                      : isDark
                        ? "#94A3B8"
                        : "#64748B",
                  fontWeight: type === "transfer" ? "700" : "600",
                },
              ]}
            >
              Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Hero Section */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "#E2E8F0",
            },
          ]}
        >
          <Text
            style={[
              styles.amountHeroLabel,
              { color: isDark ? "#94A3B8" : "#64748B" },
            ]}
          >
            Amount
          </Text>
          <View
            style={[
              styles.amountHeroContainer,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "#F8FAFC",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#E2E8F0",
              },
            ]}
          >
            <Text style={[styles.amountHeroCurrency, { color: colors.primary }]}>
              ₹
            </Text>
            <TextInput
              style={[styles.amountHeroInput, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={
                isDark ? "rgba(255, 255, 255, 0.28)" : "#94A3B8"
              }
              keyboardType="decimal-pad"
              inputMode="decimal"
              value={amount}
              onChangeText={handleAmountChange}
              adjustsFontSizeToFit
              numberOfLines={1}
            />
          </View>
        </View>

        {/* Account Section Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "#E2E8F0",
            },
          ]}
        >
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
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.04)"
                    : "#F8FAFC",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "#E2E8F0",
                },
              ]}
            >
              <Ionicons
                name="wallet-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.accountHint, { color: colors.text }]}>
                Create an active account before adding a new transaction.
              </Text>
              <TouchableOpacity
                style={[
                  styles.createAccountButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => navigation.navigate("Accounts")}
              >
                <Text style={styles.createAccountButtonText}>
                  Create account
                </Text>
              </TouchableOpacity>
            </View>
          ) : type === "transfer" ? (
            <>
              <View style={styles.transferSectionHeader}>
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={16}
                  color={colors.primary}
                  style={styles.transferHeaderIcon}
                />
                <Text
                  style={[
                    styles.accountLabel,
                    { color: isDark ? "#CBD5E1" : "#475569", marginBottom: 0 },
                  ]}
                >
                  From account
                </Text>
              </View>
              <View style={styles.accountsGrid}>
                {selectableAccounts.map((account) => {
                  const isSelected = fromAccountId === account.id;
                  const accountTypeLabel =
                    ACCOUNT_TYPE_LABELS[account.type] || "Account";

                  return (
                    <TouchableOpacity
                      key={`from-${account.id}`}
                      style={[
                        styles.accountCardCompact,
                        {
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.04)"
                            : "#F8FAFC",
                          borderColor: isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "#E2E8F0",
                        },
                        isSelected && [
                          styles.selectedAccountCard,
                          {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ],
                      ]}
                      onPress={() => setFromAccountId(account.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={getAccountAccessibilityLabel(
                        account,
                        "source account",
                      )}
                    >
                      <View style={styles.accountCardTopRow}>
                        <Ionicons
                          name={getAccountIconName(account.type)}
                          size={16}
                          color={isSelected ? "#FFFFFF" : colors.primary}
                          style={styles.accountCardIcon}
                        />
                        <Text
                          style={[
                            styles.accountNameCompact,
                            { color: isSelected ? "#FFFFFF" : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {account.name}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.accountTypeCompact,
                          {
                            color: isSelected
                              ? "rgba(255, 255, 255, 0.85)"
                              : isDark
                              ? "#94A3B8"
                              : "#64748B",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {accountTypeLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.transferDivider}>
                <View
                  style={[
                    styles.transferDividerLine,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "#E2E8F0",
                    },
                  ]}
                />
                <View
                  style={[
                    styles.transferArrowBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.06)"
                        : "#F1F5F9",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.12)"
                        : "#CBD5E1",
                    },
                  ]}
                >
                  <Ionicons
                    name="arrow-down"
                    size={14}
                    color={colors.primary}
                  />
                </View>
                <View
                  style={[
                    styles.transferDividerLine,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "#E2E8F0",
                    },
                  ]}
                />
              </View>
              <View style={styles.transferSectionHeader}>
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={16}
                  color={colors.primary}
                  style={styles.transferHeaderIcon}
                />
                <Text
                  style={[
                    styles.accountLabel,
                    { color: isDark ? "#CBD5E1" : "#475569", marginBottom: 0 },
                  ]}
                >
                  To account
                </Text>
              </View>
              <View style={[styles.accountsGrid, { marginBottom: 0 }]}>
                {selectableAccounts.map((account) => {
                  const isSelected = toAccountId === account.id;
                  const accountTypeLabel =
                    ACCOUNT_TYPE_LABELS[account.type] || "Account";

                  return (
                    <TouchableOpacity
                      key={`to-${account.id}`}
                      style={[
                        styles.accountCardCompact,
                        {
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.04)"
                            : "#F8FAFC",
                          borderColor: isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "#E2E8F0",
                        },
                        isSelected && [
                          styles.selectedAccountCard,
                          {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ],
                      ]}
                      onPress={() => setToAccountId(account.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={getAccountAccessibilityLabel(
                        account,
                        "destination account",
                      )}
                    >
                      <View style={styles.accountCardTopRow}>
                        <Ionicons
                          name={getAccountIconName(account.type)}
                          size={16}
                          color={isSelected ? "#FFFFFF" : colors.primary}
                          style={styles.accountCardIcon}
                        />
                        <Text
                          style={[
                            styles.accountNameCompact,
                            { color: isSelected ? "#FFFFFF" : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {account.name}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.accountTypeCompact,
                          {
                            color: isSelected
                              ? "rgba(255, 255, 255, 0.85)"
                              : isDark
                              ? "#94A3B8"
                              : "#64748B",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {accountTypeLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={[styles.accountsGrid, { marginBottom: 0 }]}>
              {selectableAccounts.map((account) => {
                const isSelected = selectedAccountId === account.id;
                const accountTypeLabel =
                  ACCOUNT_TYPE_LABELS[account.type] || "Account";

                return (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountCardCompact,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.04)"
                          : "#F8FAFC",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.08)"
                          : "#E2E8F0",
                      },
                      isSelected && [
                        styles.selectedAccountCard,
                        {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ],
                    ]}
                    onPress={() => setSelectedAccountId(account.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={getAccountAccessibilityLabel(account)}
                  >
                    <View style={styles.accountCardTopRow}>
                      <Ionicons
                        name={getAccountIconName(account.type)}
                        size={16}
                        color={isSelected ? "#FFFFFF" : colors.primary}
                        style={styles.accountCardIcon}
                      />
                      <Text
                        style={[
                          styles.accountNameCompact,
                          { color: isSelected ? "#FFFFFF" : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {account.name}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.accountTypeCompact,
                        {
                          color: isSelected
                            ? "rgba(255, 255, 255, 0.85)"
                            : isDark
                            ? "#94A3B8"
                            : "#64748B",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {accountTypeLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Transaction Details Section Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "#E2E8F0",
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Transaction Date
          </Text>

          <TouchableOpacity
            style={[
              styles.dateSelector,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "#F8FAFC",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#E2E8F0",
                marginBottom:
                  type !== "transfer" ||
                  (type === "expense" && fixedCommitments.length > 0)
                    ? 16
                    : 0,
              },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primary}
            />
            <Text
              style={[styles.dateSelectorText, { color: colors.text }]}
            >
              {formatDateForDisplay(selectedDate)}
            </Text>
            <Ionicons
              name="chevron-down-outline"
              size={20}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
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
                    style={[
                      styles.dateAdjustButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => adjustSelectedDate(-1)}
                    accessibilityLabel="Previous day"
                  >
                    <Ionicons name="chevron-back" size={22} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.todayButton,
                      { borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedDate(new Date())}
                  >
                    <Text
                      style={[
                        styles.todayButtonText,
                        { color: colors.primary },
                      ]}
                    >
                      Today
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dateAdjustButton,
                      { backgroundColor: colors.primary },
                    ]}
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
                  style={[
                    styles.dateDoneButton,
                    { backgroundColor: colors.primary },
                  ]}
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
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginTop: 14 },
                ]}
              >
                Select Category
              </Text>
              <TouchableOpacity
                style={[
                  styles.categorySelector,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.04)"
                      : "#F8FAFC",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "#E2E8F0",
                    marginBottom:
                      (type === "expense" && fixedCommitments.length > 0) ||
                      isOther
                        ? 16
                        : 0,
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
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            </>
          )}

          {/* Custom Category Input */}
          {isOther && (
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.04)"
                    : "#F8FAFC",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "#E2E8F0",
                  marginTop: 12,
                  marginBottom:
                    type === "expense" && fixedCommitments.length > 0
                      ? 16
                      : 0,
                },
              ]}
            >
              <Ionicons
                name="create"
                size={20}
                color={colors.primary}
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

          {type === "expense" && fixedCommitments.length > 0 && (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    marginTop: 14,
                  },
                ]}
              >
                Fixed Commitment
              </Text>

              <TouchableOpacity
                style={[
                  styles.categorySelector,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.04)"
                      : "#F8FAFC",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "#E2E8F0",
                    marginBottom: 0,
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

                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
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
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.04)"
                          : "#F8FAFC",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.08)"
                          : "#E2E8F0",
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
                                ? "rgba(59, 130, 246, 0.2)"
                                : "#E3F2FD"
                              : isDark
                                ? "rgba(255, 255, 255, 0.04)"
                                : "#F8FAFC",
                          borderColor:
                            selectedFixedCommitmentId === commitment.id
                              ? colors.primary
                              : isDark
                                ? "rgba(255, 255, 255, 0.08)"
                                : "#E2E8F0",
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
                                  ? "rgba(59, 130, 246, 0.2)"
                                  : "#E3F2FD"
                                : isDark
                                  ? "rgba(255, 255, 255, 0.04)"
                                  : "#F8FAFC",
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
        </View>

        {/* Note Section Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "#E2E8F0",
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Note
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "#F8FAFC",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#E2E8F0",
                marginBottom: 0,
              },
            ]}
          >
            <Ionicons
              name="document-text"
              size={20}
              color={colors.primary}
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
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            isLoading && styles.saveButtonDisabled,
          ]}
          onPress={handleAdd}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={
            isEditing
              ? "Update Transaction"
              : type === "expense"
                ? "Save Expense"
                : type === "income"
                  ? "Save Income"
                  : "Save Transfer"
          }
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
