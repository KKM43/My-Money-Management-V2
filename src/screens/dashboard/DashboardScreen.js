import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
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
import { db, auth } from "../../services/firebaseConfig";

import TransactionItem from "../../components/transactions/TransactionItem";
import styles from "./DashboardScreen.styles";
import { useTheme } from "../../theme/ThemeContext";
import {
  calculateFixedCommitmentsPaise,
  calculateMoneyAfterFixedPaise,
  calculatePlannedIncomePaise,
  calculatePlannedSpendablePaise,
  calculateRemainingSpendablePaise,
  calculateSafeToSpendPerDayPaise,
  calculateVariableSpentPaise,
  formatPaise,
  getAmountPaise,
  getDaysRemainingInMonth,
  isTransactionInMonth,
  isVariableExpenseTransaction,
} from "../../utils/finance";

import {
  formatMonthKey,
  getMonthKeyFromDate,
  shiftMonthKey,
} from "../../utils/month";

export default function DashboardScreen({ navigation, route }) {
  const { colors } = useTheme();
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
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setTransactions([]);
      return;
    }

    const q = collection(db, "users", userId, "transactions");

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

  // Progress bar: fraction of plannedSpendable that has been spent
  const spentFraction =
    plannedSpendablePaise > 0
      ? Math.min(variableSpentPaise / plannedSpendablePaise, 1)
      : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ?? Header ??????????????????????????????????????????????????? */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.headerGradient}
      >
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
                <Ionicons name="menu-outline" size={26} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigationContainer}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => navigateMonth("prev")}
            >
              <Ionicons name="chevron-back" size={18} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthDisplay}
              onPress={goToCurrentMonth}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.monthDisplayText}>{selectedMonthLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => navigateMonth("next")}
            >
              <Ionicons name="chevron-forward" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* ?? Scrollable Body ?????????????????????????????????????????? */}
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ?? Hero Card ???????????????????????????????????????????????? */}
        {isPlanLoading ? (
          <View style={[styles.leanHeroCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.leanLoadingText, { color: colors.text }]}>
              Loading your monthly plan...
            </Text>
          </View>
        ) : monthlyPlan ? (
          <View style={[styles.leanHeroCard, { backgroundColor: colors.surface }]}>
            {/* Primary: Safe to Spend / Day (current month) OR Remaining (other) */}
            {isCurrentMonthSelected ? (
              <>
                <Text style={[styles.heroLabel, { color: colors.text }]}>
                  Safe to spend today
                </Text>
                <Text
                  style={[
                    styles.heroPrimaryAmount,
                    {
                      color:
                        safeToSpendPerDayPaise >= 0
                          ? colors.primary
                          : "#D32F2F",
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatPaise(safeToSpendPerDayPaise)}
                </Text>

                {/* Secondary row */}
                <View style={styles.heroSecondaryRow}>
                  <Text
                    style={[
                      styles.heroRemainingText,
                      {
                        color:
                          remainingSpendablePaise >= 0
                            ? colors.text
                            : "#D32F2F",
                      },
                    ]}
                  >
                    {formatPaise(remainingSpendablePaise)} left this month
                  </Text>
                  <View style={styles.heroDaysBadge}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.heroDaysText, { color: colors.primary }]}
                    >
                      {daysRemaining}{" "}
                      {daysRemaining === 1 ? "day left" : "days left"}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                {plannedSpendablePaise > 0 && (
                  <>
                    <View style={styles.heroProgressTrack}>
                      <View
                        style={[
                          styles.heroProgressBar,
                          {
                            width: `${Math.round(spentFraction * 100)}%`,
                            backgroundColor:
                              spentFraction >= 1 ? "#D32F2F" : colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.heroProgressLabel, { color: colors.text }]}
                    >
                      {formatPaise(variableSpentPaise)} spent of{" "}
                      {formatPaise(plannedSpendablePaise)}
                    </Text>
                  </>
                )}
              </>
            ) : (
              /* Past / future month: show Remaining to Spend as hero */
              <>
                <Text style={[styles.heroLabel, { color: colors.text }]}>
                  Planned spendable
                </Text>
                <Text
                  style={[
                    styles.heroPrimaryAmount,
                    {
                      color:
                        plannedSpendablePaise >= 0
                          ? colors.primary
                          : "#D32F2F",
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatPaise(plannedSpendablePaise)}
                </Text>

                <View style={styles.heroSecondaryRow}>
                  <Text
                    style={[
                      styles.heroRemainingText,
                      {
                        color:
                          remainingSpendablePaise >= 0
                            ? colors.text
                            : "#D32F2F",
                      },
                    ]}
                  >
                    {formatPaise(remainingSpendablePaise)} remaining
                  </Text>
                </View>

                {plannedSpendablePaise > 0 && (
                  <>
                    <View style={styles.heroProgressTrack}>
                      <View
                        style={[
                          styles.heroProgressBar,
                          {
                            width: `${Math.round(spentFraction * 100)}%`,
                            backgroundColor:
                              spentFraction >= 1 ? "#D32F2F" : colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.heroProgressLabel, { color: colors.text }]}
                    >
                      {formatPaise(variableSpentPaise)} spent of{" "}
                      {formatPaise(plannedSpendablePaise)}
                    </Text>
                  </>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={[styles.leanHeroCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.noPlanTitle, { color: colors.text }]}>
              No monthly plan
            </Text>
            <Text style={[styles.noPlanText, { color: colors.text }]}>
              No monthly plan for {selectedMonthLabel}.
            </Text>
            <TouchableOpacity
              style={[styles.noPlanButton, { backgroundColor: colors.primary }]}
              onPress={() =>
                navigation.navigate("MonthlyPlan", {
                  monthKey: selectedMonthKey,
                })
              }
            >
              <Ionicons name="add-circle-outline" size={18} color="white" />
              <Text style={styles.noPlanButtonText}>Set Up This Month</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ?? Your Plan Card ??????????????????????????????????????????? */}
        {!isPlanLoading && monthlyPlan && (
          <View
            style={[
              styles.planSummaryCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.planSummaryHeader}>
              <View>
                <Text
                  style={[styles.planSummaryTitle, { color: colors.text }]}
                >
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
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Income
              </Text>
              <Text style={[styles.planValue, { color: colors.text }]}>
                {formatPaise(plannedIncomePaise)}
              </Text>
            </View>

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Fixed commitments
              </Text>
              <Text style={[styles.planValue, { color: colors.text }]}>
                {formatPaise(plannedFixedPaise)}
              </Text>
            </View>

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Savings target
              </Text>
              <Text style={[styles.planValue, { color: colors.text }]}>
                {formatPaise(savingsTargetPaise)}
              </Text>
            </View>

            <View style={[styles.planDivider, { backgroundColor: colors.text }]} />

            <View style={styles.planRow}>
              <Text style={[styles.planLabel, { color: colors.text }]}>
                Spendable
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
                {formatPaise(plannedSpendablePaise)}
              </Text>
            </View>
          </View>
        )}

        {/* ?? Spending Summary ????????????????????????????????????????? */}
        <View style={[styles.spendingCard, { backgroundColor: colors.surface }]}>
          <View style={styles.spendingHeader}>
            <View>
              <Text style={[styles.spendingTitle, { color: colors.text }]}>
                Spending this month
              </Text>
              <Text
                style={[styles.spendingSubtitle, { color: colors.text }]}
              >
                Top categories
              </Text>
            </View>
            <Ionicons
              name="pie-chart-outline"
              size={20}
              color={colors.primary}
            />
          </View>

          {spendingCategories.length === 0 ? (
            <View style={styles.spendingEmptyState}>
              <Text style={[styles.spendingEmptyText, { color: colors.text }]}>
                No expenses recorded yet
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
                  <Text
                    style={[styles.spendingAmount, { color: colors.text }]}
                  >
                    {formatPaise(Math.round(amount * 100))}
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

        {/* ?? Add Expense ?????????????????????????????????????????????? */}
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
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle-outline" size={22} color="white" />
              <Text style={styles.quickActionText}>Add Expense</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ?? Recent Transactions ?????????????????????????????????????? */}
        <View style={styles.transactionsContainer}>
          <View style={styles.txSectionHeader}>
            <Text style={[styles.transactionsTitle, { color: colors.text }]}>
              Recent Transactions ({filteredTransactions.length})
            </Text>
          </View>

          {/* Search */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.text + "30",
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.text + "80"}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search category or note"
              placeholderTextColor={colors.text + "55"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery || selectedFilter !== "all" ? (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={clearSearchAndFilters}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.text + "80"}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Tabs */}
          <View
            style={[
              styles.filterContainer,
              { backgroundColor: colors.surface + "CC" },
            ]}
          >
            {[
              { key: "all", label: "All" },
              { key: "income", label: "Income" },
              { key: "expense", label: "Expenses" },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterTab,
                  selectedFilter === key && styles.filterTabActive,
                  selectedFilter === key && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedFilter(key)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: colors.text + "99" },
                    selectedFilter === key && styles.filterTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction list */}
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={52} color={colors.text + "40"} />
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
                  key={item.id}
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

      {/* ?? Sidebar / Drawer ????????????????????????????????????????? */}
      <Modal
        visible={showDrawer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDrawer(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={[styles.drawer, { backgroundColor: colors.surface }]}>
            <View style={styles.drawerNavSection}>
              <View style={styles.drawerHeader}>
                <View>
                  <Text style={[styles.drawerTitle, { color: colors.text }]}>
                    My Money
                  </Text>
                  <Text
                    style={[styles.drawerSubtitle, { color: colors.text }]}
                  >
                    Manage your finances
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.drawerCloseButton,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() => setShowDrawer(false)}
                  accessibilityLabel="Close navigation menu"
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.drawerDivider,
                  { backgroundColor: colors.text },
                ]}
              />

              {[
                ["calendar-outline", "Monthly Plan", "MonthlyPlan"],
                ["wallet-outline", "Accounts", "Accounts"],
                ["person-outline", "Profile", "Profile"],
              ].map(([icon, label, routeName]) => (
                <TouchableOpacity
                  key={routeName}
                  style={[
                    styles.drawerItem,
                    { backgroundColor: "transparent" },
                  ]}
                  onPress={() => {
                    setShowDrawer(false);
                    navigation.navigate(routeName);
                  }}
                >
                  <View
                    style={[
                      styles.drawerIconContainer,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Ionicons name={icon} size={19} color={colors.primary} />
                  </View>
                  <Text
                    style={[styles.drawerItemText, { color: colors.text }]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.drawerFooter}>
              <Text style={[styles.drawerFooterText, { color: colors.text }]}>
                My Money ? Personal Finance
              </Text>
            </View>
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
