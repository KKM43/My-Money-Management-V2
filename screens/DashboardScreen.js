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
  Dimensions,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { signOut } from "firebase/auth";
import { ProgressBar } from "react-native-paper";
import TransactionItem from "../components/TransactionItem";
import { LightTheme } from "../theme";

const MONTHLY_BUDGET = 20000;
const { width, height } = Dimensions.get("window");

export default function DashboardScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, income, expense
  const [searchQuery, setSearchQuery] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState(20000); // Default budget
  const [showMonthPicker, setShowMonthPicker] = useState(false);

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
          setMonthlyBudget(budgetSnapshot.data().monthlyBudget || 20000);
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
      const selectedMonthData = data.filter((item) => {
        const dateValue = item.occurredOn || item.date;
        const date = item.occurredOn
          ? new Date(`${dateValue}T00:00:00`)
          : new Date(dateValue);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      });

      setTransactions(selectedMonthData);

      let totalIncome = 0;
      let totalExpense = 0;

      selectedMonthData.forEach((item) => {
        const amountPaise = Number.isInteger(item.amountPaise)
          ? item.amountPaise
          : Math.round(Number(item.amount || 0) * 100);

        if (item.type === "income") totalIncome += amountPaise / 100;
        else totalExpense += amountPaise / 100;
      });

      setIncomeTotal(totalIncome);
      setExpenseTotal(totalExpense);
      setBalance(totalIncome - totalExpense);

      if (totalExpense > monthlyBudget) {
        Alert.alert(
          "⚠️ Budget Exceeded!",
          `You have crossed your ${formatCurrency(monthlyBudget)} monthly budget!`,
        );
      }
    });

    return unsubscribe;
  }, [currentMonth, currentYear, monthlyBudget]);

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
  const progress = Math.min(expenseTotal / monthlyBudget, 1);
  const budgetPercentage = Math.round((expenseTotal / monthlyBudget) * 100);

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
    <View style={styles.container}>
      <LinearGradient
        colors={[LightTheme.colors.primary, LightTheme.colors.secondary]}
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
                style={styles.settingsButton}
                onPress={() => navigation.navigate("BudgetSettings")}
              >
                <Ionicons name="settings-outline" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="white" />
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
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
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
                <Text style={styles.statLabel}>Income</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(incomeTotal)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trending-down" size={16} color="#FF6B6B" />
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={styles.statValue}>
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
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>Monthly Budget</Text>
            <Text style={styles.budgetPercentage}>{budgetPercentage}%</Text>
          </View>
          <View style={styles.budgetProgress}>
            <ProgressBar
              progress={progress}
              color={remainingBudget < 0 ? "#FF6B6B" : "#4ECDC4"}
              style={styles.progressBar}
            />
          </View>
          <View style={styles.budgetDetails}>
            <Text style={styles.budgetSpent}>
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
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate("AddTransaction")}
          >
            <LinearGradient
              colors={[LightTheme.colors.primary, LightTheme.colors.secondary]}
              style={styles.quickActionGradient}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.quickActionText}>Add Transaction</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accountsButton}
            onPress={() => navigation.navigate("Accounts")}
          >
            <Ionicons name="wallet-outline" size={20} color={LightTheme.colors.primary} />
            <Text style={styles.accountsButtonText}>Accounts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
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
        <View style={styles.filterContainer}>
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
                selectedFilter === "expense" && styles.filterTextActive,
              ]}
            >
              Expenses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.transactionsTitle}>
            Recent Transactions ({filteredTransactions.length})
          </Text>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
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
  budgetSpent: {
    fontSize: 14,
    color: "#666",
  },
  budgetRemaining: {
    fontSize: 14,
    fontWeight: "bold",
  },
  overBudget: {
    color: "#FF6B6B",
  },
  underBudget: {
    color: "#4ECDC4",
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionButton: {
    borderRadius: 15,
    overflow: "hidden",
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
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
    marginTop: 10,
    borderWidth: 1,
    borderColor: LightTheme.colors.primary,
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
  backgroundColor: "white",
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
  color: LightTheme.colors.text,
},
clearSearchButton: {
  paddingLeft: 8,
},
});
