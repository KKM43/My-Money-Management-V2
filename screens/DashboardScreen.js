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
import { ProgressBar } from "react-native-paper";
import TransactionItem from "../components/TransactionItem";
import { LightTheme } from "../theme";
import { useTheme } from "../ThemeContext";
import {
  calculateNetWorthPaise,
  getAmountPaise,
  isTransactionInMonth,
} from "../utils/finance";

export default function DashboardScreen({ navigation }) {
  const { colors, isDark, themeMode, cycleThemeMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, income, expense
  const [searchQuery, setSearchQuery] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState(20000); // Default budget
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [showDrawer, setShowDrawer] = useState(false);

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
        console.error("Error loading accounts:", error);
      },
    );
  }, []);

  useEffect(() => {
    const budgetRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "settings",
      "budget",
    );

    const unsubscribe = onSnapshot(
      budgetRef,
      (budgetSnapshot) => {
        if (budgetSnapshot.exists()) {
          setMonthlyBudget(budgetSnapshot.data().monthlyBudget ?? 20000);
          setCategoryBudgets(budgetSnapshot.data().categoryBudgets || {});
        } else {
          setMonthlyBudget(20000);
        }
      },
      (error) => {
        console.error("Error loading budget:", error);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = collection(db, "users", auth.currentUser.uid, "transactions");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // 🔹 Filter selected month and year
      // Monthly reports retain their existing meaning: all transactions in the
      // selected calendar month, including future-dated entries in that month.
      const selectedMonthData = data.filter((item) =>
        isTransactionInMonth(item, currentYear, currentMonth),
      );

      setTransactions(selectedMonthData);

      let totalIncome = 0;
      let totalExpense = 0;
      const netWorthPaise = calculateNetWorthPaise(accounts, data);

      selectedMonthData.forEach((item) => {
        if (item.type === "transfer") return;
        const amountPaise = getAmountPaise(item);

        if (item.type === "income") totalIncome += amountPaise / 100;
        else totalExpense += amountPaise / 100;
      });

      setIncomeTotal(totalIncome);
      setExpenseTotal(totalExpense);
      setBalance(netWorthPaise / 100);
    });

    return unsubscribe;
  }, [accounts, currentMonth, currentYear]);

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

  const remainingBudget = monthlyBudget - expenseTotal;
  const progress =
    monthlyBudget > 0 ? Math.min(expenseTotal / monthlyBudget, 1) : 0;
  const budgetPercentage =
    monthlyBudget > 0 ? Math.round((expenseTotal / monthlyBudget) * 100) : 0;

  const isOverBudget = monthlyBudget >= 0 && expenseTotal > monthlyBudget;
  const categorySpending = transactions.reduce((totals, transaction) => {
    if (transaction.type === "expense" && transaction.category) {
      const amountPaise = getAmountPaise(transaction);

      totals[transaction.category] =
        (totals[transaction.category] || 0) + amountPaise / 100;
    }

    return totals;
  }, {});
  const spendingCategories = Object.entries(categorySpending)
    .sort(([, firstAmount], [, secondAmount]) => secondAmount - firstAmount)
    .slice(0, 5);
  const largestCategorySpending = spendingCategories[0]?.[1] || 0;
  const selectedMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(
    2,
    "0",
  )}`;
  const selectedCategoryBudgets = Object.entries(categoryBudgets).reduce(
    (budgets, [key, amount]) => {
      if (key.includes("|")) {
        const [monthKey, category] = key.split("|");
        if (monthKey === selectedMonthKey) {
          budgets[category] = amount;
        }
      } else if (
        selectedMonthKey ===
        `${new Date().getFullYear()}-${String(
          new Date().getMonth() + 1,
        ).padStart(2, "0")}`
      ) {
        budgets[key] = amount;
      }
      return budgets;
    },
    {},
  );

  const monthNames = [
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

  const navigateMonth = (direction) => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
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
              <Text style={styles.monthTitle}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
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
              <Text style={styles.monthDisplayText}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => navigateMonth("next")}
            >
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View
            style={[styles.balanceCard, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.balanceLabel}>Net Worth</Text>
            <Text
              style={[
                styles.balanceAmount,
                { color: balance >= 0 ? "#4ECDC4" : "#FF6B6B" },
              ]}
            >
              {formatCurrency(balance)}
            </Text>
            <View style={styles.balanceStats}>
              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={16} color="#4ECDC4" />
                <Text style={[styles.statLabel, { color: colors.text }]}>
                  Income
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatCurrency(incomeTotal)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trending-down" size={16} color="#FF6B6B" />
                <Text style={[styles.statLabel, { color: colors.text }]}>
                  Expenses
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatCurrency(expenseTotal)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Budget Card */}
        <View style={[styles.budgetCard, { backgroundColor: colors.surface }]}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={[styles.budgetTitle, { color: colors.text }]}>
                Monthly Budget
              </Text>
              <Text style={[styles.budgetSubtitle, { color: colors.text }]}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
            </View>
            <View style={styles.budgetHeaderActions}>
              <Text
                style={[styles.budgetPercentage, { color: colors.primary }]}
              >
                {budgetPercentage}%
              </Text>
              <TouchableOpacity
                style={styles.budgetSettingsButton}
                onPress={() => navigation.navigate("BudgetSettings")}
                accessibilityLabel="Open budget settings"
              >
                <Ionicons
                  name="settings-outline"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {Object.keys(selectedCategoryBudgets).length > 0 && (
            <View style={styles.categoryBudgetSection}>
              <Text style={[styles.budgetTitle, { color: colors.text }]}>
                Category Budgets
              </Text>
              {Object.entries(selectedCategoryBudgets).map(
                ([category, budget]) => {
                  const spent = categorySpending[category] || 0;

                  const percentage =
                    budget > 0 ? Math.round((spent / budget) * 100) : 0;

                  const categoryProgress =
                    budget > 0 ? Math.min(spent / budget, 1) : 0;
                  return (
                    <View key={category} style={styles.categoryBudgetRow}>
                      <View style={styles.categoryBudgetHeader}>
                        <Text
                          style={[
                            styles.categoryBudgetName,
                            { color: colors.text },
                          ]}
                        >
                          {category}
                        </Text>
                        <Text
                          style={[
                            styles.categoryBudgetAmount,
                            { color: colors.text },
                          ]}
                        >
                          {formatCurrency(spent)} / {formatCurrency(budget)}
                        </Text>
                      </View>
                      <ProgressBar
                        progress={categoryProgress}
                        color={percentage > 100 ? "#FF6B6B" : colors.primary}
                        style={styles.categoryProgressBar}
                      />
                    </View>
                  );
                },
              )}
            </View>
          )}
          <View style={styles.budgetProgress}>
            <ProgressBar
              progress={progress}
              color={remainingBudget < 0 ? "#FF6B6B" : "#4ECDC4"}
              style={styles.progressBar}
            />
          </View>
          <View style={styles.budgetDetails}>
            <Text style={[styles.budgetSpent, { color: colors.text }]}>
              Spent: {formatCurrency(expenseTotal)} /{" "}
              {formatCurrency(monthlyBudget)}
            </Text>
            <Text
              style={[
                styles.budgetRemaining,
                remainingBudget < 0 ? styles.overBudget : styles.underBudget,
              ]}
            >
              {remainingBudget < 0 ? "Over budget by " : "Remaining: "}
              {formatCurrency(Math.abs(remainingBudget))}
            </Text>
          </View>
          {isOverBudget && (
            <View
              style={[
                styles.budgetWarning,
                { backgroundColor: isDark ? "#3A2020" : "#FDECEC" },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color={isDark ? "#FF8A80" : "#B42318"}
              />
              <Text
                style={[
                  styles.budgetWarningText,
                  { color: isDark ? "#FFB4AB" : "#B42318" },
                ]}
              >
                Spending is {formatCurrency(Math.abs(remainingBudget))} over
                your monthly budget.
              </Text>
            </View>
          )}
        </View>

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
            onPress={() => navigation.navigate("AddTransaction")}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.quickActionGradient}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.quickActionText}>Add Transaction</Text>
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
              ["analytics-outline", "Analytics", "Analytics"],
               ["flag-outline", "Savings Goals", "SavingsGoals"],
              ["settings-outline", "Budget Settings", "BudgetSettings"],
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
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
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceCard: {
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
  balanceLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
  },
  balanceStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: LightTheme.colors.text,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 0,
  },
  budgetCard: {
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
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  budgetHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  budgetSettingsButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(77, 150, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  budgetSubtitle: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 3,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: LightTheme.colors.text,
  },
  budgetPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: LightTheme.colors.primary,
  },
  budgetProgress: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  budgetDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FDECEC",
  },
  budgetWarningText: {
    flex: 1,
    marginLeft: 8,
    color: "#B42318",
    fontSize: 13,
    fontWeight: "600",
  },
  categoryBudgetRow: {
    marginTop: 14,
  },
  categoryBudgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryBudgetName: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryBudgetAmount: {
    fontSize: 12,
  },
  categoryProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  budgetSpent: {
    fontSize: 14,
    color: "#666",
  },
  budgetRemaining: {
    fontSize: 14,
    fontWeight: "bold",
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
  overBudget: {
    color: "#FF6B6B",
  },
  underBudget: {
    color: "#4ECDC4",
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
  accountsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: LightTheme.colors.primary,
  },
  categoryBudgetSection: {
    marginTop: 8,
    marginBottom: 6,
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
  accountsButtonText: {
    color: LightTheme.colors.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
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
});
