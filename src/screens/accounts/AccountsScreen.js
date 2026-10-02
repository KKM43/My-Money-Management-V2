import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import {
  calculateAccountBalancePaise,
  formatPaise,
  getAccountDisplayAmountPaise,
} from "../../utils/finance";

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank", icon: "business-outline" },
  { value: "cash", label: "Cash", icon: "cash-outline" },
  { value: "wallet", label: "Wallet", icon: "wallet-outline" },
  { value: "creditCard", label: "Credit card", icon: "card-outline" },
];

const parseOpeningBalance = (value, accountType) => {
  if (!value.trim()) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;

  const [rupees, paise = ""] = value.split(".");
  const amountPaise = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));

  return accountType === "creditCard" ? -amountPaise : amountPaise;
};

function SwipeableAccountRow({
  account,
  accountType,
  balancePaise,
  colors,
  isDark,
  onOpen,
  onEdit,
  onArchive,
}) {
  const [showOptions, setShowOptions] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const resetPosition = () =>
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) =>
        translateX.setValue(Math.max(-140, Math.min(140, gestureState.dx))),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= -80) {
          onArchive();
        } else if (gestureState.dx >= 80) {
          onEdit();
        }
        resetPosition();
      },
      onPanResponderTerminate: resetPosition,
    }),
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeActions}>
        <View style={styles.editAction}>
          <Text style={styles.actionText}>Edit</Text>
        </View>
        <View style={styles.archiveAction}>
          <Text style={styles.actionText}>
            {account.isArchived ? "Unarchive" : "Archive"}
          </Text>
        </View>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.accountRow,
          {
            backgroundColor: colors.surface,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
            transform: [{ translateX }],
          },
          account.isArchived && styles.archivedRow,
        ]}
      >
        <TouchableWithoutFeedback
          onPress={onOpen}
          onLongPress={() => setShowOptions(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${account.name}, ${
            account.type === "creditCard"
              ? "Credit card, outstanding"
              : accountType?.label || "Account"
          }, balance ${formatPaise(balancePaise)}${
            account.isArchived ? ", archived" : ""
          }`}
        >
          <View style={styles.accountContent}>
            <View
              style={[
                styles.accountIcon,
                {
                  backgroundColor: isDark
                    ? "rgba(77, 150, 255, 0.15)"
                    : "rgba(77, 150, 255, 0.1)",
                },
              ]}
            >
              <Ionicons
                name={accountType?.icon || "wallet-outline"}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.accountDetails}>
              <Text
                style={[styles.accountName, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {account.name}
              </Text>
              <View style={styles.accountTypeRow}>
                <Text
                  style={[
                    styles.accountType,
                    { color: isDark ? "#A0A0A0" : "#666666" },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {account.type === "creditCard"
                    ? "Credit card • Outstanding"
                    : accountType?.label || "Account"}
                </Text>
                {account.isArchived && (
                  <View
                    style={[
                      styles.archivedBadge,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.06)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.15)"
                          : "rgba(0, 0, 0, 0.1)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.archivedBadgeText,
                        { color: isDark ? "#A0A0A0" : "#666666" },
                      ]}
                    >
                      Archived
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.balanceContainer}>
              <Text
                style={[styles.accountBalance, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatPaise(balancePaise)}
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.optionsModal,
              {
                backgroundColor: colors.surface,
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.08)",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOptions(false)}
              accessibilityRole="button"
              accessibilityLabel="Close account options"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.optionsTitle, { color: colors.text }]}>
              Account options
            </Text>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                onEdit();
              }}
              accessibilityRole="button"
              accessibilityLabel="Edit account"
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                onArchive();
              }}
              accessibilityRole="button"
              accessibilityLabel={account.isArchived ? "Unarchive account" : "Archive account"}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                {account.isArchived ? "Unarchive" : "Archive"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function AccountsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [openingBalance, setOpeningBalance] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [hasAttemptedCreate, setHasAttemptedCreate] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("bank");
  const [hasAttemptedEdit, setHasAttemptedEdit] = useState(false);

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
      setTransactions([]);
      return;
    }

    const transactionsRef = collection(
      db,
      "users",
      userId,
      "transactions",
    );

    return onSnapshot(
      transactionsRef,
      (snapshot) => {
        setTransactions(snapshot.docs.map((transaction) => transaction.data()));
      },
      (error) => {
        Alert.alert("Error", `Could not load transactions: ${error.message}`);
      },
    );
  }, []);

  const handleCreateAccount = async () => {
    Keyboard.dismiss();
    setHasAttemptedCreate(true);

    const trimmedName = name.trim();
    const openingBalancePaise = parseOpeningBalance(openingBalance, type);

    if (!trimmedName) {
      Alert.alert("Error", "Please enter an account name");
      return;
    }

    if (!Number.isInteger(openingBalancePaise)) {
      Alert.alert("Error", "Please enter a valid opening balance");
      return;
    }

    setIsSaving(true);

    try {
      await addDoc(collection(db, "users", auth.currentUser.uid, "accounts"), {
        name: trimmedName,
        type,
        openingBalancePaise,
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setName("");
      setOpeningBalance("");
      setHasAttemptedCreate(false);
      setIsCreateFormVisible(false);
      Alert.alert("Success", "Account created successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const accountHasTransactions = (accountId) =>
    transactions.some(
      (transaction) =>
        transaction.accountId === accountId ||
        transaction.fromAccountId === accountId ||
        transaction.toAccountId === accountId,
    );

  const startEditing = (account) => {
    setEditingAccountId(account.id);
    setEditName(account.name);
    setEditType(account.type);
    setHasAttemptedEdit(false);
  };

  const cancelEditing = () => {
    setEditingAccountId(null);
    setEditName("");
    setHasAttemptedEdit(false);
  };

  const handleUpdateAccount = async () => {
    Keyboard.dismiss();
    setHasAttemptedEdit(true);

    const trimmedName = editName.trim();

    if (!trimmedName) {
      Alert.alert("Error", "Please enter an account name");
      return;
    }

    const editingAccount = accounts.find(
      (account) => account.id === editingAccountId,
    );

    if (!editingAccount) {
      Alert.alert("Error", "Account could not be found");
      return;
    }

    const hasTransactions = accountHasTransactions(editingAccountId);

    if (hasTransactions && editType !== editingAccount.type) {
      Alert.alert(
        "Account type locked",
        "This account already has transactions, so its type cannot be changed.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(
        doc(db, "users", auth.currentUser.uid, "accounts", editingAccountId),
        {
          name: trimmedName,
          type: editType,
          updatedAt: serverTimestamp(),
        },
      );
      cancelEditing();
      Alert.alert("Success", "Account updated successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArchive = (account) => {
    const action = account.isArchived ? "unarchive" : "archive";
    Alert.alert(
      `${account.isArchived ? "Unarchive" : "Archive"} account`,
      `Are you sure you want to ${action} ${account.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: account.isArchived ? "Unarchive" : "Archive",
          onPress: async () => {
            try {
              await updateDoc(
                doc(db, "users", auth.currentUser.uid, "accounts", account.id),
                {
                  isArchived: !account.isArchived,
                  updatedAt: serverTimestamp(),
                },
              );
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  const isEditingAccountTypeLocked =
    editingAccountId && accountHasTransactions(editingAccountId);
  const showCreateForm = accounts.length === 0 || isCreateFormVisible;

  const isNameInvalid = hasAttemptedCreate && !name.trim();
  const isOpeningBalanceInvalid =
    hasAttemptedCreate &&
    Boolean(openingBalance.trim()) &&
    parseOpeningBalance(openingBalance, type) === null;
  const isEditNameInvalid = hasAttemptedEdit && !editName.trim();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Accounts</Text>
            {accounts.length > 0 ? (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => {
                  setHasAttemptedCreate(false);
                  setIsCreateFormVisible((prev) => !prev);
                }}
                accessibilityRole="button"
                accessibilityLabel={showCreateForm ? "Cancel add account" : "Add account"}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showCreateForm ? (
                  <Text style={[styles.headerCancelText, { color: colors.primary }]}>
                    Cancel
                  </Text>
                ) : (
                  <View style={styles.addAccountButtonContent}>
                    <Ionicons name="add" size={18} color={colors.primary} />
                    <Text style={[styles.headerAddText, { color: colors.primary }]}>
                      Add
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>

          {editingAccountId && (
            <View
              style={[
                styles.editCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Edit account
              </Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: isEditNameInvalid
                        ? colors.error
                        : isDark
                          ? "rgba(255, 255, 255, 0.12)"
                          : "#E0E0E0",
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Account name"
                  placeholderTextColor="#999"
                  editable={!isSaving}
                  accessibilityLabel="Account name"
                />
                {isEditNameInvalid && (
                  <Text style={[styles.inlineErrorText, { color: colors.error }]}>
                    Please enter an account name
                  </Text>
                )}
              </View>

              <View style={styles.typeGrid}>
                {ACCOUNT_TYPES.map((accountType) => (
                  <TouchableOpacity
                    key={accountType.value}
                    style={[
                      styles.typeButton,
                      {
                        borderColor:
                          editType === accountType.value
                            ? colors.primary
                            : isDark
                              ? "rgba(255, 255, 255, 0.12)"
                              : "#E0E0E0",
                        backgroundColor:
                          editType === accountType.value
                            ? colors.primary
                            : isDark
                              ? "rgba(255, 255, 255, 0.04)"
                              : "transparent",
                      },
                      editType === accountType.value && styles.typeButtonActive,
                      isEditingAccountTypeLocked && styles.typeButtonDisabled,
                    ]}
                    onPress={() => setEditType(accountType.value)}
                    disabled={Boolean(isEditingAccountTypeLocked) || isSaving}
                    accessibilityRole="button"
                    accessibilityLabel={accountType.label}
                    accessibilityState={{ selected: editType === accountType.value }}
                  >
                    <Ionicons
                      name={accountType.icon}
                      size={18}
                      color={
                        editType === accountType.value
                          ? "white"
                          : isDark
                            ? "#D0D0D0"
                            : colors.text
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        {
                          color:
                            editType === accountType.value
                              ? "white"
                              : isDark
                                ? "#D0D0D0"
                                : "#555",
                        },
                        editType === accountType.value &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      {accountType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {isEditingAccountTypeLocked && (
                <Text
                  style={[
                    styles.typeLockedText,
                    { color: isDark ? "#A0A0A0" : "#666666" },
                  ]}
                >
                  Account type cannot be changed because this account already has
                  transactions.
                </Text>
              )}

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.15)"
                        : "#D0D0D0",
                    },
                  ]}
                  onPress={cancelEditing}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel edit"
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: isDark ? "#D0D0D0" : "#666666" },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { flex: 1, backgroundColor: colors.primary }]}
                  onPress={handleUpdateAccount}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Save changes"
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {accounts.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your accounts
              </Text>
              {accounts.map((account) => {
                const accountType = ACCOUNT_TYPES.find(
                  (item) => item.value === account.type,
                );
                const signedBalancePaise = calculateAccountBalancePaise(
                  account,
                  transactions,
                );
                const balancePaise = getAccountDisplayAmountPaise(
                  account,
                  signedBalancePaise,
                );

                return (
                  <SwipeableAccountRow
                    key={account.id}
                    account={account}
                    accountType={accountType}
                    balancePaise={balancePaise}
                    colors={colors}
                    isDark={isDark}
                    onOpen={() =>
                      navigation.navigate("AccountActivity", { account })
                    }
                    onEdit={() => startEditing(account)}
                    onArchive={() => toggleArchive(account)}
                  />
                );
              })}
            </>
          )}

          {accounts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No accounts yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isDark ? "#A0A0A0" : "#666666" },
                ]}
              >
                Create your first account to start tracking balances.
              </Text>
            </View>
          )}

          {showCreateForm && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                },
              ]}
            >
              <View style={styles.formCardHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, marginBottom: 0 },
                  ]}
                >
                  Create account
                </Text>
                {accounts.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setHasAttemptedCreate(false);
                      setIsCreateFormVisible(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Close create account form"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={isDark ? "#A0A0A0" : "#666666"}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: isNameInvalid
                        ? colors.error
                        : isDark
                          ? "rgba(255, 255, 255, 0.12)"
                          : "#E0E0E0",
                    },
                  ]}
                  placeholder="Account name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  editable={!isSaving}
                  accessibilityLabel="Account name"
                />
                {isNameInvalid && (
                  <Text style={[styles.inlineErrorText, { color: colors.error }]}>
                    Please enter an account name
                  </Text>
                )}
              </View>

              <Text
                style={[
                  styles.label,
                  { color: isDark ? "#A0A0A0" : "#666666" },
                ]}
              >
                Account type
              </Text>

              <View style={styles.typeGrid}>
                {ACCOUNT_TYPES.map((accountType) => (
                  <TouchableOpacity
                    key={accountType.value}
                    style={[
                      styles.typeButton,
                      {
                        borderColor:
                          type === accountType.value
                            ? colors.primary
                            : isDark
                              ? "rgba(255, 255, 255, 0.12)"
                              : "#E0E0E0",
                        backgroundColor:
                          type === accountType.value
                            ? colors.primary
                            : isDark
                              ? "rgba(255, 255, 255, 0.04)"
                              : "transparent",
                      },
                      type === accountType.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setType(accountType.value)}
                    disabled={isSaving}
                    accessibilityRole="button"
                    accessibilityLabel={accountType.label}
                    accessibilityState={{ selected: type === accountType.value }}
                  >
                    <Ionicons
                      name={accountType.icon}
                      size={18}
                      color={
                        type === accountType.value
                          ? "white"
                          : isDark
                            ? "#D0D0D0"
                            : colors.text
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        {
                          color:
                            type === accountType.value
                              ? "white"
                              : isDark
                                ? "#D0D0D0"
                                : "#555",
                        },
                        type === accountType.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {accountType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#A0A0A0" : "#666666", marginBottom: 0 },
                    ]}
                  >
                    {type === "creditCard"
                      ? "Current outstanding"
                      : "Opening balance"}
                  </Text>
                  <Text
                    style={[
                      styles.optionalLabel,
                      { color: isDark ? "#888888" : "#888888" },
                    ]}
                  >
                    Optional
                  </Text>
                </View>
                <Text
                  style={[
                    styles.helperText,
                    { color: isDark ? "#808080" : "#777777" },
                  ]}
                >
                  {type === "creditCard"
                    ? "Amount currently owed on this card"
                    : "Starting amount already in this account"}
                </Text>
                <View
                  style={[
                    styles.moneyInputContainer,
                    {
                      borderColor: isOpeningBalanceInvalid
                        ? colors.error
                        : isDark
                          ? "rgba(255, 255, 255, 0.12)"
                          : "#E0E0E0",
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "transparent",
                    },
                  ]}
                >
                  <Text style={[styles.currencyPrefix, { color: colors.primary }]}>
                    ₹
                  </Text>
                  <TextInput
                    style={[styles.moneyInput, { color: colors.text }]}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    value={openingBalance}
                    onChangeText={(value) =>
                      setOpeningBalance(value.replace(/[^0-9.]/g, ""))
                    }
                    editable={!isSaving}
                    accessibilityLabel={
                      type === "creditCard"
                        ? "Current credit card outstanding in rupees"
                        : "Opening account balance in rupees"
                    }
                  />
                </View>
                {isOpeningBalanceInvalid && (
                  <Text style={[styles.inlineErrorText, { color: colors.error }]}>
                    Enter a valid amount
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateAccount}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Create account"
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Create account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingTop: Platform.OS === "android" ? 8 : 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  headerActionButton: {
    minWidth: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  addAccountButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  headerAddText: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerCancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  editCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  moneyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
  moneyInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  inlineErrorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
    fontWeight: "500",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  typeButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeButtonActive: {},
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  typeButtonTextActive: {
    fontWeight: "700",
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  accountRow: {
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  swipeContainer: {
    position: "relative",
    marginBottom: 10,
    borderRadius: 14,
    overflow: "hidden",
  },
  accountContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  swipeActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editAction: {
    width: "50%",
    backgroundColor: "#4D96FF",
    justifyContent: "center",
    paddingLeft: 18,
  },
  archiveAction: {
    width: "50%",
    backgroundColor: "#64748B",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 18,
  },
  actionText: {
    color: "white",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 24,
  },
  optionsModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: 4,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  archivedRow: {
    opacity: 0.7,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
  },
  accountName: {
    fontSize: 16,
    fontWeight: "700",
  },
  accountTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 6,
  },
  accountType: {
    fontSize: 13,
  },
  archivedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  archivedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  balanceContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 4,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  typeButtonDisabled: {
    opacity: 0.4,
  },
  typeLockedText: {
    fontSize: 13,
    marginTop: -4,
    marginBottom: 14,
    lineHeight: 18,
  },
});
