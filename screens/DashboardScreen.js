import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { signOut } from "firebase/auth";

import TransactionItem from "../components/TransactionItem";
import { LightTheme } from "../theme";
import { useTheme } from "../ThemeContext";
import {
  calculateFixedCommitmentsPaise,
  calculateMoneyAfterFixedPaise,
  calculatePlannedIncomePaise,
  calculatePlannedSpendablePaise,
  calculateRemainingSpendablePaise,
  calculateSafeToSpendPerDayPaise,
  calculateVariableSpentPaise,
  getAmountPaise,
  getDaysRemainingInMonth,
  isTransactionInMonth,
  isVariableExpenseTransaction,
} from "../utils/finance";

import {
  formatMonthKey,
  getMonthKeyFromDate,
  shiftMonthKey,
} from "../utils/month";

export default function DashboardScreen({ navigation, route }) {
  const { colors, isDark, themeMode, cycleThemeMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [monthlyPlan, setMonthlyPlan] = useState(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const selectedMonthKey = getMonthKeyFromDate(
    new Date(currentYear, currentMonth, 1),
  );

  const selectedMonthLabel = formatMonthKey(selectedMonthKey);

  useEffect(() => {
    const routedMonthKey = route?.params?.monthKey;

    if (!routedMonthKey || !/^\d{4}-\d{2}$/.test(routedMonthKey)) {
      return;
    }

    const [year, month] = routedMonthKey.split("-").map(Number);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return;
    }

    setCurrentYear(year);
    setCurrentMonth(month - 1);
  }, [route?.params?.monthKey]);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, income, expense
  const [searchQuery, setSearchQuery] = useState("");

  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setMonthlyPlan(null);
      setIsPlanLoading(false);
      return;
    }

    setIsPlanLoading(true);

    const planRef = doc(db, "users", userId, "monthlyPlans", selectedMonthKey);

    return onSnapshot(
      planRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setMonthlyPlan({
            id: snapshot.id,
            ...snapshot.data(),
          });
        } else {
          setMonthlyPlan(null);
        }

        setIsPlanLoading(false);
      },
      (error) => {
        console.error("Error loading monthly plan:", error);

        setMonthlyPlan(null);
        setIsPlanLoading(false);
      },
    );
  }, [selectedMonthKey]);

  useEffect(() => {
    const q = collection(db, "users", auth.currentUser.uid, "transactions");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      const selectedMonthData = data.filter((item) =>
        isTransactionInMonth(item, currentYear, currentMonth),
      );

      setTransactions(selectedMonthData);
    });

    return unsubscribe;
  }, [currentMonth, currentYear]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(
        doc(db, "users", auth.currentUser.uid, "transactions", id),
      );
      Alert.alert("Deleted", "Transaction removed!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          // navigation.replace("Login");
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // The useEffect will handle the refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const clearSearchAndFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType =
      selectedFilter === "all" || transaction.type === selectedFilter;

    const searchText = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !searchText ||
      transaction.category?.toLowerCase().includes(searchText) ||
      transaction.note?.toLowerCase().includes(searchText);

    return matchesType && matchesSearch;
  });

  const incomeSources = Array.isArray(monthlyPlan?.incomeSources)
    ? monthlyPlan.incomeSources
    : [];

  const fixedCommitments = Array.isArray(monthlyPlan?.fixedCommitments)
    ? monthlyPlan.fixedCommitments
    : [];

  const plannedIncomePaise = calculatePlannedIncomePaise(incomeSources);

  const plannedFixedPaise = calculateFixedCommitmentsPaise(fixedCommitments);

  const moneyAfterFixedPaise = calculateMoneyAfterFixedPaise(
    plannedIncomePaise,
    plannedFixedPaise,
  );

  const savingsTargetPaise = Number.isInteger(monthlyPlan?.savingsTargetPaise)
    ? monthlyPlan.savingsTargetPaise
    : 0;

  const plannedSpendablePaise = calculatePlannedSpendablePaise(
    moneyAfterFixedPaise,
    savingsTargetPaise,
  );

  const now = new Date();

  const isCurrentMonthSelected =
    currentMonth === now.getMonth() && currentYear === now.getFullYear();

  const variableSpentPaise = calculateVariableSpentPaise(
    transactions,
    currentYear,
    currentMonth,
    now,
    fixedCommitments,
  );

  const remainingSpendablePaise = calculateRemainingSpendablePaise(
    plannedSpendablePaise,
    variableSpentPaise,
  );

  const daysRemaining = isCurrentMonthSelected
    ? getDaysRemainingInMonth(now)
    : 0;

  const safeToSpendPerDayPaise = isCurrentMonthSelected
    ? calculateSafeToSpendPerDayPaise(remainingSpendablePaise, now)
    : null;

  const categorySpending = transactions.reduce((totals, transaction) => {
    const shouldCount = isVariableExpenseTransaction(
      transaction,
      currentYear,
      currentMonth,
      now,
      fixedCommitments,
    );
    if (!shouldCount || !transaction.category) {
      return totals;
    }

    const amountPaise = getAmountPaise(transaction);

    totals[transaction.category] =
      (totals[transaction.category] || 0) + amountPaise / 100;

    return totals;
  }, {});

  const spendingCategories = Object.entries(categorySpending)
    .sort(([, firstAmount], [, secondAmount]) => secondAmount - firstAmount)
    .slice(0, 5);
  const largestCategorySpending = spendingCategories[0]?.[1] || 0;

  const navigateMonth = (direction) => {
  const offset = direction === "prev" ? -1 : 1;
  const nextMonthKey = shiftMonthKey(selectedMonthKey, offset);
  const [year, month] = nextMonthKey.split("-").map(Number);

  setCurrentYear(year);
  setCurrentMonth(month - 1);
};

  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.headerGradient}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Welcome back!</Text>
              <Text style={styles.monthTitle}>{selectedMonthLabel}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowDrawer(true)}
                accessibilityLabel="Open navigation menu"
              >
                <Ionicons name="menu-outline" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigationContainer}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => navigateMonth("prev")}
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthDisplay}
              onPress={goToCurrentMonth}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color="rgba(255, 255, 255, 0.8)"
              />
              <Text style={styles.monthDisplayText}>{selectedMonthLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => navigateMonth("next")}
            >
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Lean V2 Money Status */}
          {isPlanLoading ? (
            <View
              style={[styles.leanHeroCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.leanLoadingText, { color: colors.text }]}>
                Loading your monthly plan...
              </Text>
            </View>
          ) : monthlyPlan ? (
            <View
              style={[styles.leanHeroCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.leanHeroLabel, { color: colors.text }]}>
                Remaining to Spend
              </Text>

              <Text
                style={[
                  styles.leanHeroAmount,
                  {
                    color:
                      remainingSpendablePaise >= 0 ? colors.primary : "#D32F2F",
                  },
                ]}
              >
                {formatCurrency(remainingSpendablePaise / 100)}
              </Text>

              <View style={styles.leanHeroDivider} />

              <View style={styles.leanSafeRow}>
                <View style={styles.leanSafeValueContainer}>
                  <Text style={[styles.leanSafeLabel, { color: colors.text }]}>
                    {isCurrentMonthSelected
                      ? "Safe to Spend / Day"
                      : "Planned Spendable"}
                  </Text>

                  <Text
                    style={[
                      styles.leanSafeAmount,
                      {
                        color:
                          isCurrentMonthSelected && safeToSpendPerDayPaise < 0
                            ? "#D32F2F"
                            : colors.text,
                      },
                    ]}
                  >
                    {isCurrentMonthSelected
                      ? formatCurrency(safeToSpendPerDayPaise / 100)
                      : formatCurrency(plannedSpendablePaise / 100)}
                  </Text>
                </View>

                {isCurrentMonthSelected && (
                  <View style={styles.daysBadge}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.primary}
                    />

                    <Text
                      style={[styles.daysBadgeText, { color: colors.text }]}
                    >
                      {daysRemaining}{" "}
                      {daysRemaining === 1 ? "day left" : "days left"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View
              style={[styles.leanHeroCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.noPlanTitle, { color: colors.text }]}>
                No monthly plan
              </Text>

              <Text style={[styles.noPlanText, { color: colors.text }]}>
                No Lean V2 plan exists for {selectedMonthLabel}.
              </Text>
              <TouchableOpacity
                style={[
                  styles.noPlanButton,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("MonthlyPlan", {
                    monthKey: selectedMonthKey,
                  })
                }
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />

                <Text style={styles.noPlanButtonText}>Set Up This Month</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Lean V2 Plan Summary */}
        {!isPlanLoading && monthlyPlan && (
          <View
            style={[
              styles.planSummaryCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.planSummaryHeader}>
              <View>
                <Text style={[styles.planSummaryTitle, { color: colors.text }]}>
                  Your Plan
                </Text>

                <Text
                  style={[styles.planSummarySubtitle, { color: colors.text }]}
                >
                  {selectedMonthLabel}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.planEditButton}
                onPress={() =>
                  navigation.navigate("MonthlyPlan", {
                    monthKey: selectedMonthKey,
                  })
                }
                accessibilityLabel="Open monthly plan"
              >
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Income
              </Text>

              <Text style={[styles.planValue, { color: colors.text }]}>
                {formatCurrency(plannedIncomePaise / 100)}
              </Text>
            </View>

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Fixed commitments
              </Text>

              <Text style={[styles.planValue, { color: colors.text }]}>
                {formatCurrency(plannedFixedPaise / 100)}
              </Text>
            </View>

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Savings target
              </Text>

              <Text style={[styles.planValue, { color: colors.text }]}>
                {formatCurrency(savingsTargetPaise / 100)}
              </Text>
            </View>

            <View style={styles.planDivider} />

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Planned spendable
              </Text>

              <Text
                style={[
                  styles.planValueStrong,
                  {
                    color:
                      plannedSpendablePaise >= 0 ? colors.primary : "#D32F2F",
                  },
                ]}
              >
                {formatCurrency(plannedSpendablePaise / 100)}
              </Text>
            </View>

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Spent so far
              </Text>

              <Text style={[styles.planValue, { color: colors.text }]}>
                {formatCurrency(variableSpentPaise / 100)}
              </Text>
            </View>

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Remaining
              </Text>

              <Text
                style={[
                  styles.planValueStrong,
                  {
                    color:
                      remainingSpendablePaise >= 0 ? colors.primary : "#D32F2F",
                  },
                ]}
              >
                {formatCurrency(remainingSpendablePaise / 100)}
              </Text>
            </View>

            {isCurrentMonthSelected && (
              <View style={styles.planRow}>
                <Text style={[styles.planLabel, { color: colors.text }]}>
                  Days remaining
                </Text>

                <Text style={[styles.planValue, { color: colors.text }]}>
                  {daysRemaining}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Spending Summary */}
        <View
          style={[styles.spendingCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.spendingHeader}>
            <View>
              <Text style={[styles.spendingTitle, { color: colors.text }]}>
                Spending Summary
              </Text>
              <Text style={[styles.spendingSubtitle, { color: colors.text }]}>
                Top categories this month
              </Text>
            </View>
            <Ionicons
              name="pie-chart-outline"
              size={22}
              color={colors.primary}
            />
          </View>
          {spendingCategories.length === 0 ? (
            <View style={styles.spendingEmptyState}>
              <Text style={[styles.spendingEmptyText, { color: colors.text }]}>
                No category spending yet
              </Text>
            </View>
          ) : (
            spendingCategories.map(([category, amount]) => (
              <View key={category} style={styles.spendingRow}>
                <View style={styles.spendingRowHeader}>
                  <Text
                    style={[styles.spendingCategory, { color: colors.text }]}
                  >
                    {category}
                  </Text>
                  <Text style={[styles.spendingAmount, { color: colors.text }]}>
                    {formatCurrency(amount)}
                  </Text>
                </View>
                <View style={styles.spendingTrack}>
                  <View
                    style={[
                      styles.spendingBar,
                      {
                        width: `${Math.max(
                          (amount / largestCategorySpending) * 100,
                          4,
                        )}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Primary Action */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() =>
              navigation.navigate("AddTransaction", {
                initialType: "expense",
                monthKey: selectedMonthKey,
              })
            }
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.quickActionGradient}
            >
              <Ionicons name="remove-circle-outline" size={24} color="white" />

              <Text style={styles.quickActionText}>Add Expense</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View
          style={[styles.searchContainer, { backgroundColor: colors.surface }]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search category or note"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery || selectedFilter !== "all" ? (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={clearSearchAndFilters}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tabs */}
        <View
          style={[styles.filterContainer, { backgroundColor: colors.surface }]}
        >
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === "all" && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.text },
                selectedFilter === "all" && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === "income" && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter("income")}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.text },
                selectedFilter === "income" && styles.filterTextActive,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === "expense" && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter("expense")}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.text },
                selectedFilter === "expense" && styles.filterTextActive,
              ]}
            >
              Expenses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View
          style={[
            styles.transactionsContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.transactionsTitle, { color: colors.text }]}>
            Recent Transactions ({filteredTransactions.length})
          </Text>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No transactions found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.text }]}>
                {selectedFilter === "all"
                  ? "Add your first transaction to get started"
                  : `No ${selectedFilter} transactions this month`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TransactionItem
                  key={`${item.id}-${isDark ? "dark" : "light"}`}
                  item={item}
                  isFixedCommitmentPayment={Boolean(
                    item.fixedCommitmentId &&
                    fixedCommitments.some(
                      (commitment) => commitment.id === item.fixedCommitmentId,
                    ),
                  )}
                  onDelete={() => handleDelete(item.id)}
                  onEdit={() =>
                    navigation.navigate("AddTransaction", { transaction: item })
                  }
                />
              )}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
      <Modal
        visible={showDrawer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDrawer(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={[styles.drawer, { backgroundColor: colors.surface }]}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={[styles.drawerTitle, { color: colors.text }]}>
                  My Money
                </Text>
                <Text style={[styles.drawerSubtitle, { color: colors.text }]}>
                  Manage your finances
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDrawer(false)}
                accessibilityLabel="Close navigation menu"
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {[
              ["person-outline", "Profile", "Profile"],
              ["wallet-outline", "Accounts", "Accounts"],
            ].map(([icon, label, routeName]) => (
              <TouchableOpacity
                key={routeName}
                style={styles.drawerItem}
                onPress={() => {
                  setShowDrawer(false);
                  navigation.navigate(routeName);
                }}
              >
                <Ionicons name={icon} size={21} color={colors.primary} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={cycleThemeMode}
              accessibilityLabel={`Theme mode: ${themeMode}`}
            >
              <Ionicons
                name={
                  themeMode === "system"
                    ? "contrast-outline"
                    : isDark
                      ? "moon-outline"
                      : "sunny-outline"
                }
                size={21}
                color={colors.primary}
              />
              <Text style={[styles.drawerItemText, { color: colors.text }]}>
                Theme: {themeMode}
              </Text>
            </TouchableOpacity>
            <View style={styles.drawerDivider} />
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setShowDrawer(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={21} color="#D32F2F" />
              <Text style={[styles.drawerItemText, { color: "#D32F2F" }]}>
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            onPress={() => setShowDrawer(false)}
            accessibilityLabel="Close navigation menu"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerSection: {
    // Remove flex: 1 to prevent taking full height
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  monthNavigationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    minWidth: 120,
    justifyContent: "center",
  },
  monthDisplayText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 6,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },

  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  drawer: {
    width: "78%",
    paddingTop: 54,
    paddingHorizontal: 22,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 24,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  drawerSubtitle: {
    fontSize: 13,
    opacity: 0.65,
    marginTop: 4,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 14,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: "600",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },

  quickActions: {
    flexDirection: "row",
    marginBottom: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: "hidden",
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  quickActionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  spendingCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  spendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  spendingTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  spendingSubtitle: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 3,
  },
  spendingRow: {
    marginTop: 10,
  },
  spendingRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  spendingCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  spendingAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
  spendingTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(128, 128, 128, 0.18)",
    overflow: "hidden",
  },
  spendingBar: {
    height: "100%",
    borderRadius: 4,
  },
  spendingEmptyState: {
    paddingVertical: 8,
  },
  spendingEmptyText: {
    fontSize: 14,
    opacity: 0.65,
  },

  filterContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: LightTheme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filterTextActive: {
    color: "white",
  },
  transactionsContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: LightTheme.colors.text,
    marginBottom: 15,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
  },
  clearSearchButton: {
    paddingLeft: 8,
  },
  leanHeroCard: {
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },

  leanLoadingText: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.7,
  },

  leanHeroLabel: {
    fontSize: 14,
    opacity: 0.68,
    marginBottom: 6,
  },

  leanHeroAmount: {
    fontSize: 36,
    fontWeight: "bold",
  },

  leanHeroDivider: {
    height: 1,
    backgroundColor: "#94A3B8",
    opacity: 0.2,
    marginVertical: 18,
  },

  leanSafeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leanSafeValueContainer: {
    flex: 1,
  },

  leanSafeLabel: {
    fontSize: 12,
    opacity: 0.65,
    marginBottom: 4,
  },

  leanSafeAmount: {
    fontSize: 22,
    fontWeight: "bold",
  },

  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(77, 150, 255, 0.10)",
  },

  daysBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },

  noPlanTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  noPlanText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
  },

  planSummaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  planSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  planSummaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  planSummarySubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 3,
  },

  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },

  planLabel: {
    fontSize: 14,
    opacity: 0.72,
  },

  planValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  planValueStrong: {
    fontSize: 15,
    fontWeight: "bold",
  },

  planDivider: {
    height: 1,
    backgroundColor: "#94A3B8",
    opacity: 0.2,
    marginVertical: 10,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 0,
  },
  planEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(77, 150, 255, 0.10)",
  },
  noPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },

  noPlanButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 7,
  },
});
