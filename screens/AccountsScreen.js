import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { LightTheme } from "../theme";

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

const formatCurrency = (amountPaise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);

export default function AccountsScreen({ navigation }) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [openingBalance, setOpeningBalance] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={LightTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Accounts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Create account</Text>
        <TextInput
          style={styles.input}
          placeholder="Account name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Account type</Text>
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
                color={type === accountType.value ? "white" : "#555"}
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
          style={styles.input}
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

      <Text style={styles.sectionTitle}>Your accounts</Text>
      {accounts.length === 0 ? (
        <Text style={styles.emptyText}>No accounts created yet.</Text>
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
            <View key={account.id} style={styles.accountRow}>
              <View style={styles.accountIcon}>
                <Ionicons
                  name={accountType?.icon || "wallet-outline"}
                  size={22}
                  color={LightTheme.colors.primary}
                />
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountType}>
                  {accountType?.label || "Account"}
                </Text>
              </View>
              <Text style={styles.accountBalance}>
                {formatCurrency(balancePaise)}
              </Text>
            </View>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
});
