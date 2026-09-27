import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../../services/firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import styles from "./MonthlyPlanScreen.styles";
import {
  calculateFixedCommitmentsPaise,
  calculateMoneyAfterFixedPaise,
  calculatePlannedIncomePaise,
  calculatePlannedSpendablePaise,
  formatPaise,
  getFixedCommitmentPaymentStatus,
  isTransactionInMonth,
  parseMoneyInputToPaise,
} from "../../utils/finance";

import {
  formatMonthKey,
  getCurrentMonthKey,
  getPreviousMonthKey,
  shiftMonthKey,
} from "../../utils/month";



export default function MonthlyPlanScreen({ navigation, route }) {
  const { colors } = useTheme();

  const [monthlyPlan, setMonthlyPlan] = useState(null);

  const [transactions, setTransactions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [isLoadingPreviousPlan, setIsLoadingPreviousPlan] = useState(false);

  const [draftIncomeSources, setDraftIncomeSources] = useState([]);

  const [draftFixedCommitments, setDraftFixedCommitments] = useState([]);

  const [draftSavingsTarget, setDraftSavingsTarget] = useState("0");

  const initialMonthKey = route?.params?.monthKey || getCurrentMonthKey();

  const [selectedMonthKey, setSelectedMonthKey] = useState(initialMonthKey);

  const monthKey = selectedMonthKey;

  const previousMonthKey = getPreviousMonthKey(monthKey);

  const [selectedYear, selectedMonthNumber] = monthKey
    .split("-")
    .map(Number);

  const selectedMonthIndex = selectedMonthNumber - 1;

  const isFutureMonth = monthKey > getCurrentMonthKey();

  const handlePayFixedCommitment = (commitment, payment) => {
    if (!commitment || !payment || payment.remainingPaise <= 0) {
      return;
    }

    navigation.navigate("AddTransaction", {
      initialType: "expense",
      monthKey,
      fixedCommitmentId: commitment.id,
      amountPaise: payment.remainingPaise,
      note: commitment.name,
    });
  };

  const changeMonth = (offset) => {
    setIsEditing(false);
    setSelectedMonthKey(shiftMonthKey(monthKey, offset));
  };

  const handleMonthChange = (offset) => {
    if (isSaving || isLoadingPreviousPlan) {
      return;
    }

    if (isEditing) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes to this monthly plan.",
        [
          {
            text: "Keep Editing",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => changeMonth(offset),
          },
        ],
      );

      return;
    }

    changeMonth(offset);
  };

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setIsLoading(false);
      return;
    }

    const planRef = doc(db, "users", userId, "monthlyPlans", monthKey);

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

        setIsLoading(false);
      },
      (error) => {
        console.error("Error loading monthly plan:", error);

        setMonthlyPlan(null);
        setIsLoading(false);
      },
    );
  }, [monthKey]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setTransactions([]);
      return;
    }

    const [targetYear, targetMonthNumber] = monthKey
      .split("-")
      .map(Number);

    const targetMonthIndex = targetMonthNumber - 1;

    const transactionsRef = collection(db, "users", userId, "transactions");

    return onSnapshot(
      transactionsRef,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        const selectedMonthData = data.filter((item) =>
          isTransactionInMonth(item, targetYear, targetMonthIndex),
        );

        setTransactions(selectedMonthData);
      },
      (error) => {
        console.error("Error loading transactions:", error);
        setTransactions([]);
      },
    );
  }, [monthKey]);

  const incomeSources = Array.isArray(monthlyPlan?.incomeSources)
    ? monthlyPlan.incomeSources
    : [];

  const fixedCommitments = Array.isArray(monthlyPlan?.fixedCommitments)
    ? monthlyPlan.fixedCommitments
    : [];

  const totalIncomePaise = calculatePlannedIncomePaise(incomeSources);

  const totalFixedPaise = calculateFixedCommitmentsPaise(fixedCommitments);

  const moneyAfterFixedPaise = calculateMoneyAfterFixedPaise(
    totalIncomePaise,
    totalFixedPaise,
  );

  const savingsTargetPaise = Number.isInteger(monthlyPlan?.savingsTargetPaise)
    ? monthlyPlan.savingsTargetPaise
    : 0;

  const plannedSpendablePaise = calculatePlannedSpendablePaise(
    moneyAfterFixedPaise,
    savingsTargetPaise,
  );

  const draftIncomeForCalculation = draftIncomeSources
    .map((source) => ({
      amountPaise: parseMoneyInputToPaise(source.amount),
    }))
    .filter((source) => Number.isInteger(source.amountPaise));

  const draftFixedForCalculation = draftFixedCommitments
    .map((commitment) => ({
      amountPaise: parseMoneyInputToPaise(commitment.amount),
    }))
    .filter((commitment) => Number.isInteger(commitment.amountPaise));

  const draftTotalIncomePaise = calculatePlannedIncomePaise(
    draftIncomeForCalculation,
  );

  const draftTotalFixedPaise = calculateFixedCommitmentsPaise(
    draftFixedForCalculation,
  );

  const draftMoneyAfterFixedPaise = calculateMoneyAfterFixedPaise(
    draftTotalIncomePaise,
    draftTotalFixedPaise,
  );

  const parsedDraftSavingsTargetPaise =
    parseMoneyInputToPaise(draftSavingsTarget);

  const draftSavingsTargetPaise = Number.isInteger(
    parsedDraftSavingsTargetPaise,
  )
    ? parsedDraftSavingsTargetPaise
    : 0;

  const draftPlannedSpendablePaise = calculatePlannedSpendablePaise(
    draftMoneyAfterFixedPaise,
    draftSavingsTargetPaise,
  );

  const displayedIncomePaise = isEditing
    ? draftTotalIncomePaise
    : totalIncomePaise;

  const displayedFixedPaise = isEditing
    ? draftTotalFixedPaise
    : totalFixedPaise;

  const displayedMoneyAfterFixedPaise = isEditing
    ? draftMoneyAfterFixedPaise
    : moneyAfterFixedPaise;

  const displayedSavingsTargetPaise = isEditing
    ? draftSavingsTargetPaise
    : savingsTargetPaise;

  const displayedSpendablePaise = isEditing
    ? draftPlannedSpendablePaise
    : plannedSpendablePaise;

  const normalizeMoneyInput = (value) => {
    const normalized = String(value).replace(/[^0-9.]/g, "");

    const parts = normalized.split(".");

    if (parts.length > 2) {
      return null;
    }

    if (parts.length === 2 && parts[1].length > 2) {
      return null;
    }

    return normalized;
  };

  const handleStartEditing = () => {
    setDraftIncomeSources(
      incomeSources.map((source) => ({
        id: source.id,
        name: source.name,
        amount: (source.amountPaise / 100).toString(),
      })),
    );

    setDraftFixedCommitments(
      fixedCommitments.map((commitment) => ({
        id: commitment.id,
        name: commitment.name,
        amount: (commitment.amountPaise / 100).toString(),
      })),
    );

    setDraftSavingsTarget((savingsTargetPaise / 100).toString());

    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleStartFromScratch = () => {
    setDraftIncomeSources([
      {
        id: `income-${Date.now()}`,
        name: "",
        amount: "",
      },
    ]);

    setDraftFixedCommitments([]);
    setDraftSavingsTarget("0");
    setIsEditing(true);
  };

  const updateIncomeSource = (id, field, value) => {
    let nextValue = value;

    if (field === "amount") {
      const normalized = normalizeMoneyInput(value);

      if (normalized === null) {
        return;
      }

      nextValue = normalized;
    }

    setDraftIncomeSources((current) =>
      current.map((source) =>
        source.id === id
          ? {
              ...source,
              [field]: nextValue,
            }
          : source,
      ),
    );
  };

  const addIncomeSource = () => {
    setDraftIncomeSources((current) => [
      ...current,
      {
        id: `income-${Date.now()}`,
        name: "",
        amount: "",
      },
    ]);
  };

  const removeIncomeSource = (id) => {
    setDraftIncomeSources((current) =>
      current.filter((source) => source.id !== id),
    );
  };

  const updateFixedCommitment = (id, field, value) => {
    let nextValue = value;

    if (field === "amount") {
      const normalized = normalizeMoneyInput(value);

      if (normalized === null) {
        return;
      }

      nextValue = normalized;
    }

    setDraftFixedCommitments((current) =>
      current.map((commitment) =>
        commitment.id === id
          ? {
              ...commitment,
              [field]: nextValue,
            }
          : commitment,
      ),
    );
  };

  const addFixedCommitment = () => {
    setDraftFixedCommitments((current) => [
      ...current,
      {
        id: `fixed-${Date.now()}`,
        name: "",
        amount: "",
      },
    ]);
  };

  const removeFixedCommitment = (id) => {
    setDraftFixedCommitments((current) =>
      current.filter((commitment) => commitment.id !== id),
    );
  };

  const handleSavingsChange = (value) => {
    const normalized = normalizeMoneyInput(value);

    if (normalized !== null) {
      setDraftSavingsTarget(normalized);
    }
  };

  const handleUsePreviousMonth = async () => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      Alert.alert("Sign in required", "Please sign in again.");
      return;
    }

    setIsLoadingPreviousPlan(true);

    try {
      const previousPlanRef = doc(
        db,
        "users",
        userId,
        "monthlyPlans",
        previousMonthKey,
      );

      const snapshot = await getDoc(previousPlanRef);

      if (!snapshot.exists()) {
        Alert.alert(
          "No previous plan",
          `No plan was found for ${formatMonthKey(previousMonthKey)}.`,
        );
        return;
      }

      const previousPlan = snapshot.data();

      const previousIncomeSources = Array.isArray(previousPlan.incomeSources)
        ? previousPlan.incomeSources
        : [];

      const previousFixedCommitments = Array.isArray(
        previousPlan.fixedCommitments,
      )
        ? previousPlan.fixedCommitments
        : [];

      setDraftIncomeSources(
        previousIncomeSources.map((source) => ({
          id: source.id,
          name: source.name || "",
          amount: Number.isInteger(source.amountPaise)
            ? (source.amountPaise / 100).toString()
            : "",
        })),
      );

      setDraftFixedCommitments(
        previousFixedCommitments.map((commitment) => ({
          id: commitment.id,
          name: commitment.name || "",
          amount: Number.isInteger(commitment.amountPaise)
            ? (commitment.amountPaise / 100).toString()
            : "",
        })),
      );

      setDraftSavingsTarget(
        Number.isInteger(previousPlan.savingsTargetPaise)
          ? (previousPlan.savingsTargetPaise / 100).toString()
          : "0",
      );

      setIsEditing(true);
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Could not load the previous month's plan.",
      );
    } finally {
      setIsLoadingPreviousPlan(false);
    }
  };

  const handleSavePlan = async () => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      Alert.alert("Sign in required", "Please sign in again.");
      return;
    }

    if (draftIncomeSources.length === 0) {
      Alert.alert("Income required", "Add at least one income source.");
      return;
    }

    const normalizedIncomeSources = draftIncomeSources.map((source) => ({
      id: source.id,
      name: source.name.trim(),
      amountPaise: parseMoneyInputToPaise(source.amount),
    }));

    const invalidIncome = normalizedIncomeSources.some(
      (source) =>
        !source.name ||
        !Number.isInteger(source.amountPaise) ||
        source.amountPaise <= 0,
    );

    if (invalidIncome) {
      Alert.alert(
        "Check income",
        "Every income source needs a name and an amount greater than zero.",
      );
      return;
    }

    const normalizedFixedCommitments = draftFixedCommitments.map(
      (commitment) => ({
        id: commitment.id,
        name: commitment.name.trim(),
        amountPaise: parseMoneyInputToPaise(commitment.amount),
      }),
    );

    const invalidFixed = normalizedFixedCommitments.some(
      (commitment) =>
        !commitment.name ||
        !Number.isInteger(commitment.amountPaise) ||
        commitment.amountPaise <= 0,
    );

    if (invalidFixed) {
      Alert.alert(
        "Check fixed commitments",
        "Every fixed commitment needs a name and an amount greater than zero.",
      );
      return;
    }

    const parsedSavingsTarget = parseMoneyInputToPaise(draftSavingsTarget);

    if (!Number.isInteger(parsedSavingsTarget) || parsedSavingsTarget < 0) {
      Alert.alert("Check savings", "Enter a valid savings amount.");
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(
        doc(db, "users", userId, "monthlyPlans", monthKey),
        {
          monthKey,
          incomeSources: normalizedIncomeSources,
          fixedCommitments: normalizedFixedCommitments,
          savingsTargetPaise: parsedSavingsTarget,
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      setMonthlyPlan({
        id: monthKey,
        monthKey,
        incomeSources: normalizedIncomeSources,
        fixedCommitments: normalizedFixedCommitments,
        savingsTargetPaise: parsedSavingsTarget,
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Could not update your monthly plan.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const returnToDashboard = () => {
    navigation.navigate("Dashboard", {
      monthKey,
    });
  };

  const handleBack = () => {
    if (isSaving || isLoadingPreviousPlan) {
      return;
    }

    if (isEditing) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes to this monthly plan.",
        [
          {
            text: "Keep Editing",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: returnToDashboard,
          },
        ],
      );

      return;
    }

    returnToDashboard();
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        backgroundColor: colors.background,
      }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Back to dashboard"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            Monthly Plan
          </Text>
        </View>

        {(monthlyPlan || isEditing) && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={isEditing ? handleCancelEditing : handleStartEditing}
            disabled={isSaving}
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>
              {isEditing ? "Cancel" : "Edit"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[
          styles.monthNavigation,
          {
            backgroundColor: colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={() => handleMonthChange(-1)}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.monthNavigationText}>
          <Text
            style={[
              styles.monthNavigationTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {formatMonthKey(monthKey)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={() => handleMonthChange(1)}
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {!monthlyPlan && !isEditing ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No plan for {formatMonthKey(monthKey)}
          </Text>

          <Text style={[styles.emptyDescription, { color: colors.text }]}>
            Use your {formatMonthKey(previousMonthKey)} plan as a starting
            point, or create a fresh plan for this month.
          </Text>

          <TouchableOpacity
            style={[
              styles.previousPlanButton,
              {
                backgroundColor: colors.primary,
              },
              isLoadingPreviousPlan && styles.disabledButton,
            ]}
            onPress={handleUsePreviousMonth}
            disabled={isLoadingPreviousPlan}
          >
            {isLoadingPreviousPlan ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="copy-outline" size={20} color="white" />

                <Text style={styles.previousPlanButtonText}>
                  Use Previous Month
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.previousPlanButton,
              {
                borderWidth: 1,
                borderColor: colors.primary,
                marginTop: 12,
              },
            ]}
            onPress={handleStartFromScratch}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />

            <Text
              style={[
                styles.previousPlanButtonText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Start From Scratch
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Income
            </Text>

            {isEditing
              ? draftIncomeSources.map((source) => (
                  <View key={source.id} style={styles.editRow}>
                    <TextInput
                      style={[
                        styles.nameInput,
                        {
                          color: colors.text,
                          borderColor: colors.primary,
                        },
                      ]}
                      placeholder="Income source"
                      placeholderTextColor="#999"
                      value={source.name}
                      onChangeText={(value) =>
                        updateIncomeSource(source.id, "name", value)
                      }
                    />

                    <TextInput
                      style={[
                        styles.amountInput,
                        {
                          color: colors.text,
                          borderColor: colors.primary,
                        },
                      ]}
                      placeholder="Amount"
                      placeholderTextColor="#999"
                      keyboardType="decimal-pad"
                      value={source.amount}
                      onChangeText={(value) =>
                        updateIncomeSource(source.id, "amount", value)
                      }
                    />

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeIncomeSource(source.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#D32F2F"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              : incomeSources.map((source) => (
                  <View key={source.id} style={styles.row}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {source.name}
                    </Text>

                    <Text style={[styles.value, { color: colors.text }]}>
                      {formatPaise(source.amountPaise)}
                    </Text>
                  </View>
                ))}

            {isEditing && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={addIncomeSource}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text style={[styles.addButtonText, { color: colors.primary }]}>
                  Add income source
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text
                style={[
                  styles.totalLabel,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Total income
              </Text>

              <Text
                style={[
                  styles.totalValue,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {formatPaise(displayedIncomePaise)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Fixed Commitments
            </Text>

            {isEditing ? (
              <>
                {draftFixedCommitments.map((commitment) => (
                  <View key={commitment.id} style={styles.editRow}>
                    <TextInput
                      style={[
                        styles.nameInput,
                        {
                          color: colors.text,
                          borderColor: colors.primary,
                        },
                      ]}
                      placeholder="Commitment"
                      placeholderTextColor="#999"
                      value={commitment.name}
                      onChangeText={(value) =>
                        updateFixedCommitment(commitment.id, "name", value)
                      }
                    />

                    <TextInput
                      style={[
                        styles.amountInput,
                        {
                          color: colors.text,
                          borderColor: colors.primary,
                        },
                      ]}
                      placeholder="Amount"
                      placeholderTextColor="#999"
                      keyboardType="decimal-pad"
                      value={commitment.amount}
                      onChangeText={(value) =>
                        updateFixedCommitment(commitment.id, "amount", value)
                      }
                    />

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFixedCommitment(commitment.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#D32F2F"
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addFixedCommitment}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.primary}
                  />

                  <Text
                    style={[
                      styles.addButtonText,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    Add fixed commitment
                  </Text>
                </TouchableOpacity>
              </>
            ) : fixedCommitments.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No fixed commitments
              </Text>
            ) : (
              fixedCommitments.map((commitment, index) => {
                const payment = getFixedCommitmentPaymentStatus(
                  commitment,
                  transactions,
                  selectedYear,
                  selectedMonthIndex,
                );

                return (
                  <View key={commitment.id} style={styles.commitmentItem}>
                    <View style={styles.commitmentHeaderRow}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        {commitment.name}
                      </Text>

                      <Text style={[styles.value, { color: colors.text }]}>
                        {formatPaise(commitment.amountPaise)}
                      </Text>
                    </View>

                    <View style={styles.paymentStatusContainer}>
                      <View style={styles.paymentInfoCol}>
                        <Text
                          style={[
                            styles.paymentStatusText,
                            payment.status === "paid"
                              ? styles.statusPaidText
                              : payment.status === "partially_paid"
                                ? styles.statusPartialText
                                : styles.statusPendingText,
                          ]}
                        >
                          {payment.status === "paid"
                            ? "Paid ✓"
                            : payment.status === "partially_paid"
                              ? "Partially paid"
                              : "Pending"}
                        </Text>

                        {payment.status === "partially_paid" ? (
                          <Text
                            style={[
                              styles.paymentProgressText,
                              { color: colors.text },
                            ]}
                          >
                            Paid {formatPaise(payment.paidPaise)} of{" "}
                            {formatPaise(payment.targetPaise)}
                          </Text>
                        ) : payment.status === "paid" ? (
                          <Text
                            style={[
                              styles.paymentProgressText,
                              { color: colors.text },
                            ]}
                          >
                            Paid {formatPaise(payment.paidPaise)}
                          </Text>
                        ) : null}
                      </View>

                      {!isFutureMonth &&
                        (payment.status === "pending" ||
                          payment.status === "partially_paid") && (
                          <TouchableOpacity
                            style={[
                              styles.paymentActionButton,
                              {
                                borderColor: colors.primary,
                              },
                            ]}
                            onPress={() =>
                              handlePayFixedCommitment(commitment, payment)
                            }
                          >
                            <Text
                              style={[
                                styles.paymentActionButtonText,
                                {
                                  color: colors.primary,
                                },
                              ]}
                            >
                              {payment.status === "partially_paid"
                                ? "Pay remaining"
                                : "Mark as paid"}
                            </Text>
                          </TouchableOpacity>
                        )}
                    </View>

                    {index < fixedCommitments.length - 1 && (
                      <View style={styles.commitmentDivider} />
                    )}
                  </View>
                );
              })
            )}

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text
                style={[
                  styles.totalLabel,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Total fixed
              </Text>

              <Text
                style={[
                  styles.totalValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {formatPaise(displayedFixedPaise)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={styles.row}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Savings & Spending
              </Text>

              <Text
                style={[
                  styles.value,
                  {
                    color:
                      displayedMoneyAfterFixedPaise >= 0
                        ? colors.text
                        : "#D32F2F",
                  },
                ]}
              >
                {formatPaise(displayedMoneyAfterFixedPaise)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Savings target
              </Text>

              {isEditing ? (
                <TextInput
                  style={[
                    styles.savingsInput,
                    {
                      color: colors.text,
                      borderColor: colors.primary,
                    },
                  ]}
                  keyboardType="decimal-pad"
                  value={draftSavingsTarget}
                  onChangeText={handleSavingsChange}
                />
              ) : (
                <Text
                  style={[
                    styles.value,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {formatPaise(savingsTargetPaise)}
                </Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text
                style={[
                  styles.totalLabel,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Planned spendable
              </Text>

              <Text
                style={[
                  styles.spendableValue,
                  {
                    color:
                      displayedSpendablePaise >= 0 ? colors.primary : "#D32F2F",
                  },
                ]}
              >
                {formatPaise(displayedSpendablePaise)}
              </Text>
            </View>

            {isEditing && (
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.primary,
                  },
                  isSaving && styles.disabledButton,
                ]}
                onPress={handleSavePlan}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Plan</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
