import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Modal,
  PanResponder,
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
import { auth, db } from "../services/firebaseConfig";
import { LightTheme } from "../theme";
import { useTheme } from "../ThemeContext";

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank", icon: "business-outline" },
  { value: "cash", label: "Cash", icon: "cash-outline" },
  { value: "wallet", label: "Wallet", icon: "wallet-outline" },
  { value: "creditCard", label: "Credit card", icon: "card-outline" },
];

const parseOpeningBalance = (value) => {
  if (!value.trim()) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;

  const [rupees, paise = ""] = value.split(".");
  return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
};

function SwipeableAccountRow({
  account,
  accountType,
  balancePaise,
  colors,
  onOpen,
  onEdit,
  onArchive,
}) {
  const formatCurrency = (paise) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(paise / 100);
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
          { backgroundColor: colors.surface, transform: [{ translateX }] },
          account.isArchived && styles.archivedRow,
        ]}
      >
        <TouchableWithoutFeedback
          onPress={onOpen}
          onLongPress={() => setShowOptions(true)}
        >
          <View style={styles.accountContent}>
            <View
              style={[
                styles.accountIcon,
                { backgroundColor: colors.background },
              ]}
            >
              <Ionicons
                name={accountType?.icon || "wallet-outline"}
                size={22}
                color={LightTheme.colors.primary}
              />
            </View>
            <View style={styles.accountDetails}>
              <Text style={[styles.accountName, { color: colors.text }]}>
                {account.name}
              </Text>
              <Text style={[styles.accountType, { color: colors.text }]}>
                {accountType?.label || "Account"}
                {account.isArchived ? " • Archived" : ""}
              </Text>
            </View>
            <Text style={[styles.accountBalance, { color: colors.text }]}>
              {formatCurrency(balancePaise)}
            </Text>
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
          <View style={[styles.optionsModal, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOptions(false)}
              accessibilityLabel="Close account options"
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
            >
              <Text style={[styles.optionText, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                onArchive();
              }}
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

const formatCurrency = (amountPaise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);

export default function AccountsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [openingBalance, setOpeningBalance] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("bank");

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

  useEffect(() => {
    const transactionsRef = collection(
      db,
      "users",
      auth.currentUser.uid,
      "transactions",
    );

    return onSnapshot(
      transactionsRef,
      (snapshot) => {
        setTransactions(
          snapshot.docs.map((transaction) => transaction.data()),
        );
      },
      (error) => {
        Alert.alert("Error", `Could not load transactions: ${error.message}`);
      },
    );
  }, []);

  const handleCreateAccount = async () => {
    const trimmedName = name.trim();
    const openingBalancePaise = parseOpeningBalance(openingBalance);

    if (!trimmedName) {
      Alert.alert("Error", "Please enter an account name");
      return;
    }

    if (
      !Number.isInteger(openingBalancePaise) ||
      openingBalancePaise < 0
    ) {
      Alert.alert("Error", "Please enter a valid opening balance");
      return;
    }

    setIsSaving(true);

    try {
      await addDoc(
        collection(db, "users", auth.currentUser.uid, "accounts"),
        {
          name: trimmedName,
          type,
          openingBalancePaise,
          isArchived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );

      setName("");
      setOpeningBalance("");
      Alert.alert("Success", "Account created successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (account) => {
    setEditingAccountId(account.id);
    setEditName(account.name);
    setEditType(account.type);
  };

  const cancelEditing = () => {
    setEditingAccountId(null);
    setEditName("");
  };

  const handleUpdateAccount = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Please enter an account name");
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

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Accounts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Create account
      </Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: isDark ? "#444" : "#E0E0E0" }]}
          placeholder="Account name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: colors.text }]}>Account type</Text>
        <View style={styles.typeGrid}>
          {ACCOUNT_TYPES.map((accountType) => (
            <TouchableOpacity
              key={accountType.value}
              style={[
                styles.typeButton,
                type === accountType.value && styles.typeButtonActive,
              ]}
              onPress={() => setType(accountType.value)}
            >
              <Ionicons
                name={accountType.icon}
                size={18}
                color={type === accountType.value ? "white" : colors.text}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === accountType.value && styles.typeButtonTextActive,
                ]}
              >
                {accountType.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, { color: colors.text, borderColor: isDark ? "#444" : "#E0E0E0" }]}
          placeholder="Opening balance (optional)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={openingBalance}
          onChangeText={(value) =>
            setOpeningBalance(value.replace(/[^0-9.]/g, ""))
          }
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleCreateAccount}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Create account</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Your accounts
      </Text>
      {editingAccountId && (
        <View style={[styles.editCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Edit account
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: isDark ? "#444" : "#E0E0E0" }]}
            value={editName}
            onChangeText={setEditName}
            placeholder="Account name"
            placeholderTextColor="#999"
          />
          <View style={styles.typeGrid}>
            {ACCOUNT_TYPES.map((accountType) => (
              <TouchableOpacity
                key={accountType.value}
                style={[
                  styles.typeButton,
                  editType === accountType.value && styles.typeButtonActive,
                ]}
                onPress={() => setEditType(accountType.value)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    editType === accountType.value &&
                      styles.typeButtonTextActive,
                      { color: type === accountType.value ? "white" : colors.text },
                  ]}
                >
                  {accountType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateAccount}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>Save changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {accounts.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No accounts created yet.
        </Text>
      ) : (
        accounts.map((account) => {
          const accountType = ACCOUNT_TYPES.find(
            (item) => item.value === account.type,
          );
          const transactionBalancePaise = transactions.reduce(
            (balance, transaction) => {
              const amountPaise = Number.isInteger(transaction.amountPaise)
                ? transaction.amountPaise
                : Math.round(Number(transaction.amount || 0) * 100);

              if (transaction.type === "transfer") {
                if (transaction.fromAccountId === account.id) {
                  return balance - amountPaise;
                }
                if (transaction.toAccountId === account.id) {
                  return balance + amountPaise;
                }
                return balance;
              }

              if (transaction.accountId !== account.id) return balance;

              return transaction.type === "income"
                ? balance + amountPaise
                : balance - amountPaise;
            },
            0,
          );
          const balancePaise =
            Number(account.openingBalancePaise || 0) +
            transactionBalancePaise;

          return (
            <SwipeableAccountRow
              key={account.id}
              account={account}
              accountType={accountType}
              balancePaise={balancePaise}
              colors={colors}
              onOpen={() => navigation.navigate("AccountActivity", { account })}
              onEdit={() => startEditing(account)}
              onArchive={() => toggleArchive(account)}
            />
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: LightTheme.colors.text,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  editCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: LightTheme.colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: LightTheme.colors.text,
    marginBottom: 14,
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
    gap: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 10,
  },
  typeButtonActive: {
    backgroundColor: LightTheme.colors.primary,
    borderColor: LightTheme.colors.primary,
  },
  typeButtonText: {
    color: "#555",
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: LightTheme.colors.primary,
    borderRadius: 10,
    padding: 14,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 8,
  },
  accountRow: {
    backgroundColor: "white",
    borderRadius: 12,
    zIndex: 1,
  },
  swipeContainer: {
    position: "relative",
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  accountContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
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
    backgroundColor: "#777",
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
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    padding: 24,
  },
  optionsModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    padding: 22,
    paddingTop: 30,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 4,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },
  optionButton: {
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  archivedRow: {
    opacity: 0.65,
  },
  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "bold",
    color: LightTheme.colors.text,
  },
  accountType: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: "bold",
    color: LightTheme.colors.text,
  },
  rowAction: {
    padding: 6,
    marginLeft: 4,
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
    borderColor: "#D0D0D0",
    borderRadius: 10,
    padding: 14,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
});
