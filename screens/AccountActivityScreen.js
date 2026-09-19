import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { LightTheme } from "../theme";
import TransactionItem from "../components/TransactionItem";

export default function AccountActivityScreen({ navigation, route }) {
  const account = route.params.account;
  const [transactions, setTransactions] = useState([]);

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
        const accountTransactions = snapshot.docs
          .map((transaction) => ({ id: transaction.id, ...transaction.data() }))
          .filter(
            (transaction) =>
              transaction.accountId === account.id ||
              transaction.fromAccountId === account.id ||
              transaction.toAccountId === account.id,
          )
          .sort((left, right) =>
            (right.occurredOn || right.date || "").localeCompare(
              left.occurredOn || left.date || "",
            ),
          );

        setTransactions(accountTransactions);
      },
      (error) => {
        Alert.alert("Error", `Could not load account activity: ${error.message}`);
      },
    );
  }, [account.id]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={LightTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{account.name}</Text>
          <Text style={styles.subtitle}>Account activity</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>No activity for this account yet.</Text>
      ) : (
        transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            item={transaction}
            showActions={false}
          />
        ))
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
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: LightTheme.colors.text,
  },
  subtitle: {
    color: "#777",
    marginTop: 2,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 24,
  },
});
