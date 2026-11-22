import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import {
  calculateAccountBalancePaise,
  formatPaise,
  getAccountDisplayAmountPaise,
  getAmountPaise,
  getTransactionDateKey,
} from "../../utils/finance";

const ACCOUNT_TYPES = {
  bank: { label: "Bank", icon: "business-outline" },
  cash: { label: "Cash", icon: "cash-outline" },
  wallet: { label: "Wallet", icon: "wallet-outline" },
  creditCard: { label: "Credit card", icon: "card-outline" },
};

const CATEGORY_CONFIG = {
  "Food & Dining": { icon: "restaurant", color: "#FF6B6B" },
  Transportation: { icon: "car", color: "#4ECDC4" },
  Shopping: { icon: "bag", color: "#45B7D1" },
  Entertainment: { icon: "game-controller", color: "#96CEB4" },
  "Bills & Utilities": { icon: "receipt", color: "#F5A623" },
  Healthcare: { icon: "medical", color: "#DDA0DD" },
  Education: { icon: "school", color: "#98D8C8" },
  Salary: { icon: "briefcase", color: "#4ECDC4" },
  Freelance: { icon: "laptop", color: "#45B7D1" },
  Investment: { icon: "trending-up", color: "#96CEB4" },
  Gift: { icon: "gift", color: "#F5A623" },
  Bonus: { icon: "trophy", color: "#DDA0DD" },
  Other: { icon: "ellipsis-horizontal", color: "#A0A0A0" },
};

const formatDate = (transaction) => {
  const dateKey = getTransactionDateKey(transaction);
  if (!dateKey) {
    return transaction.occurredOn || transaction.date || "";
  }

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(
    yesterday.getDate(),
  ).padStart(2, "0")}`;

  if (dateKey === todayKey) {
    return "Today";
  }
  if (dateKey === yesterdayKey) {
    return "Yesterday";
  }

  const parts = dateKey.split("-");
  if (parts.length === 3) {
    const parsedDate = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2]),
    );
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  return dateKey;
};

function AccountLedgerRow({ transaction, accountId, colors, isDark }) {
  const isTransfer = transaction.type === "transfer";
  const isCardPayment = transaction.paymentKind === "cardPayment";

  let isIncoming = false;
  if (isTransfer) {
    isIncoming = transaction.toAccountId === accountId;
  } else if (transaction.type === "income") {
    isIncoming = true;
  } else {
    isIncoming = false;
  }

  let title = transaction.category;
  let iconName = CATEGORY_CONFIG[transaction.category]?.icon || "ellipsis-horizontal";
  let iconBgColor = CATEGORY_CONFIG[transaction.category]?.color || colors.primary;

  if (isCardPayment) {
    title = "Card payment";
    iconName = "card-outline";
    iconBgColor = colors.primary;
  } else if (isTransfer) {
    title = transaction.category || "Transfer";
    iconName = "swap-horizontal";
    iconBgColor = colors.primary;
  } else if (!title) {
    title = isIncoming ? "Income" : "Expense";
  }

  const amountPaise = getAmountPaise(transaction);
  const sign = isIncoming ? "+" : "-";
  const formattedAmount = `${sign}${formatPaise(amountPaise)}`;
  const amountColor = isIncoming
    ? isDark
      ? "#4ADE80"
      : "#16A34A"
    : isDark
      ? "#FF6B6B"
      : "#DC2626";

  const formattedDate = formatDate(transaction);
  const isFixed = Boolean(transaction.fixedCommitmentId);
  const note = transaction.note ? String(transaction.note).trim() : "";

  return (
    <View
      style={[
        styles.rowContainer,
        {
          backgroundColor: colors.surface,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(0, 0, 0, 0.05)",
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={iconName} size={18} color="#FFFFFF" />
      </View>

      <View style={styles.detailsContainer}>
        <Text
          style={[styles.rowTitle, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        {Boolean(note) && (
          <Text
            style={[
              styles.rowNote,
              { color: isDark ? "#A0A0A0" : "#666666" },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {note}
          </Text>
        )}

        <View style={styles.metaRow}>
          <Text
            style={[
              styles.rowDate,
              { color: isDark ? "#8E8E93" : "#767676" },
            ]}
          >
            {formattedDate}
          </Text>
          {isFixed && (
            <View
              style={[
                styles.fixedBadge,
                {
                  backgroundColor: isDark
                    ? "rgba(77, 150, 255, 0.15)"
                    : "rgba(77, 150, 255, 0.08)",
                  borderColor: isDark
                    ? "rgba(77, 150, 255, 0.35)"
                    : "rgba(77, 150, 255, 0.25)",
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={9}
                color={colors.primary}
                style={{ marginRight: 3 }}
              />
              <Text
                style={[styles.fixedBadgeText, { color: colors.primary }]}
              >
                Fixed
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[styles.rowAmount, { color: amountColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formattedAmount}
        </Text>
      </View>
    </View>
  );
}

export default function AccountActivityScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const account = route.params?.account || {};
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId || !account.id) {
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

  const accountTypeConfig =
    ACCOUNT_TYPES[account.type] || { label: "Account", icon: "wallet-outline" };
  const isCreditCard = account.type === "creditCard";
  const signedBalancePaise = calculateAccountBalancePaise(account, transactions);
  const balancePaise = getAccountDisplayAmountPaise(account, signedBalancePaise);
  const balanceLabel = isCreditCard ? "Outstanding" : "Current balance";

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>
            Account Activity
          </Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
            },
          ]}
        >
          <View style={styles.accountHeaderRow}>
            <View
              style={[
                styles.accountIconContainer,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(77, 150, 255, 0.12)",
                },
              ]}
            >
              <Ionicons
                name={accountTypeConfig.icon}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.accountInfoContainer}>
              <Text
                style={[styles.accountName, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {account.name || "Account"}
              </Text>
              <Text
                style={[
                  styles.accountType,
                  { color: isDark ? "#A0A0A0" : "#666666" },
                ]}
                numberOfLines={1}
              >
                {accountTypeConfig.label}
                {account.isArchived ? " • Archived" : ""}
              </Text>
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text
              style={[styles.balanceAmount, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPaise(balancePaise)}
            </Text>
            <Text
              style={[
                styles.balanceLabel,
                { color: isDark ? "#A0A0A0" : "#666666" },
              ]}
            >
              {balanceLabel}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Activity
          </Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No account activity yet
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: isDark ? "#A0A0A0" : "#666666" },
              ]}
            >
              Transactions involving this account will appear here.
            </Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <AccountLedgerRow
              key={transaction.id}
              transaction={transaction}
              accountId={account.id}
              colors={colors}
              isDark={isDark}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    paddingBottom: 40,
  },
  topBar: {
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
  topBarTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  topBarSpacer: {
    width: 44,
  },
  summaryCard: {
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
  accountHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  accountIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  accountInfoContainer: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: "700",
  },
  accountType: {
    fontSize: 13,
    marginTop: 1,
  },
  balanceContainer: {
    paddingTop: 2,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  balanceLabel: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowNote: {
    fontSize: 13,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  rowDate: {
    fontSize: 12,
    fontWeight: "400",
  },
  fixedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  fixedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  amountContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 4,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
