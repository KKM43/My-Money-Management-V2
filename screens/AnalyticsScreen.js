import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot } from "firebase/firestore";

import { db, auth } from "../services/firebaseConfig";
import { useTheme } from "../ThemeContext";
import {
  getAmountPaise,
  isTransactionInMonth,
} from "../utils/finance";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AnalyticsScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(
    new Date().getMonth(),
  );

  const [currentYear, setCurrentYear] = useState(
    new Date().getFullYear(),
  );

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
          snapshot.docs.map((transaction) => ({
            id: transaction.id,
            ...transaction.data(),
          })),
        );

        setIsLoading(false);
      },
      (error) => {
        console.error("Error loading analytics:", error);
        setIsLoading(false);
      },
    );
  }, []);

  const selectedMonthTransactions = transactions.filter((transaction) =>
    isTransactionInMonth(
      transaction,
      currentYear,
      currentMonth,
    ),
  );

  let incomePaise = 0;
  let expensePaise = 0;

  const categorySpendingPaise = {};

  selectedMonthTransactions.forEach((transaction) => {
    if (transaction.type === "transfer") {
      return;
    }

    const amountPaise = getAmountPaise(transaction);

    if (transaction.type === "income") {
      incomePaise += amountPaise;
      return;
    }

    if (transaction.type === "expense") {
      expensePaise += amountPaise;

      if (transaction.category) {
        categorySpendingPaise[transaction.category] =
          (categorySpendingPaise[transaction.category] || 0) +
          amountPaise;
      }
    }
  });

  const savingsPaise = incomePaise - expensePaise;

  const savingsRate =
    incomePaise > 0
      ? Math.round((savingsPaise / incomePaise) * 100)
      : 0;

  const spendingCategories = Object.entries(categorySpendingPaise)
    .sort(([, firstAmount], [, secondAmount]) => secondAmount - firstAmount)
    .slice(0, 5);

  const largestCategoryAmount =
    spendingCategories[0]?.[1] || 0;

  const navigateMonth = (direction) => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }

      return;
    }

    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatCurrency = (amountPaise) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountPaise / 100);

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          Analytics
        </Text>

        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.monthCard,
            { backgroundColor: colors.surface },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigateMonth("prev")}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.monthText,
              { color: colors.text },
            ]}
          >
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>

          <TouchableOpacity
            onPress={() => navigateMonth("next")}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: colors.text },
              ]}
            >
              Income
            </Text>

            <Text style={[styles.summaryValue, styles.income]}>
              {formatCurrency(incomePaise)}
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: colors.text },
              ]}
            >
              Expenses
            </Text>

            <Text style={[styles.summaryValue, styles.expense]}>
              {formatCurrency(expensePaise)}
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: colors.text },
              ]}
            >
              Savings
            </Text>

            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    savingsPaise >= 0
                      ? "#4ECDC4"
                      : "#FF6B6B",
                },
              ]}
            >
              {formatCurrency(savingsPaise)}
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: colors.text },
              ]}
            >
              Savings Rate
            </Text>

            <Text
              style={[
                styles.summaryValue,
                { color: colors.primary },
              ]}
            >
              {savingsRate}%
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.categoryCard,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Top Spending Categories
          </Text>

          {spendingCategories.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { color: colors.text },
              ]}
            >
              No spending recorded for this month.
            </Text>
          ) : (
            spendingCategories.map(([category, amountPaise]) => {
              const percentage =
                expensePaise > 0
                  ? Math.round(
                      (amountPaise / expensePaise) * 100,
                    )
                  : 0;

              const barWidth =
                largestCategoryAmount > 0
                  ? Math.max(
                      (amountPaise / largestCategoryAmount) * 100,
                      4,
                    )
                  : 0;

              return (
                <View
                  key={category}
                  style={styles.categoryRow}
                >
                  <View style={styles.categoryHeader}>
                    <Text
                      style={[
                        styles.categoryName,
                        { color: colors.text },
                      ]}
                    >
                      {category}
                    </Text>

                    <Text
                      style={[
                        styles.categoryAmount,
                        { color: colors.text },
                      ]}
                    >
                      {formatCurrency(amountPaise)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.barTrack,
                      {
                        backgroundColor: isDark
                          ? "#333"
                          : "#E9ECEF",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${barWidth}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.percentageText,
                      { color: colors.text },
                    ]}
                  >
                    {percentage}% of monthly expenses
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },

  headerPlaceholder: {
    width: 40,
  },

  content: {
    padding: 20,
  },

  monthCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  monthText: {
    fontSize: 17,
    fontWeight: "bold",
  },

  summaryGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
  },

  summaryLabel: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 8,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
  },

  income: {
    color: "#4ECDC4",
  },

  expense: {
    color: "#FF6B6B",
  },

  categoryCard: {
    marginTop: 6,
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },

  categoryRow: {
    marginBottom: 18,
  },

  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },

  categoryAmount: {
    fontSize: 13,
    fontWeight: "600",
  },

  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 4,
  },

  percentageText: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 5,
  },

  emptyText: {
    opacity: 0.65,
  },
});