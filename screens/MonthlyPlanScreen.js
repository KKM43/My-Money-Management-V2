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
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../services/firebaseConfig";
import { useTheme } from "../ThemeContext";
import {
  calculateFixedCommitmentsPaise,
  calculateMoneyAfterFixedPaise,
  calculatePlannedIncomePaise,
  calculatePlannedSpendablePaise,
  parseMoneyInputToPaise,
} from "../utils/finance";

const getCurrentMonthKey = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getPreviousMonthKey = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);

  const previousMonthDate = new Date(year, month - 2, 1);

  return `${previousMonthDate.getFullYear()}-${String(
    previousMonthDate.getMonth() + 1,
  ).padStart(2, "0")}`;
};

const shiftMonthKey = (monthKey, offset) => {
  const [year, month] = monthKey.split("-").map(Number);

  const shiftedDate = new Date(year, month - 1 + offset, 1);

  return `${shiftedDate.getFullYear()}-${String(
    shiftedDate.getMonth() + 1,
  ).padStart(2, "0")}`;
};

const formatMonthKey = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

export default function MonthlyPlanScreen({ navigation, route }) {
  const { colors } = useTheme();

  const [monthlyPlan, setMonthlyPlan] = useState(null);

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
  if (
    isSaving ||
    isLoadingPreviousPlan
  ) {
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

  const formatPaise = (amountPaise) =>
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

          <Text
            style={[
              styles.monthNavigationKey,
              {
                color: colors.text,
              },
            ]}
          >
            {monthKey}
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
            point, then adjust anything you need.
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
              fixedCommitments.map((commitment) => (
                <View key={commitment.id} style={styles.row}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {commitment.name}
                  </Text>

                  <Text style={[styles.value, { color: colors.text }]}>
                    {formatPaise(commitment.amountPaise)}
                  </Text>
                </View>
              ))
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

 
  card: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },

  label: {
    flex: 1,
    fontSize: 14,
    opacity: 0.72,
    marginRight: 12,
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#94A3B8",
    opacity: 0.2,
    marginVertical: 10,
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  totalValue: {
    fontSize: 15,
    fontWeight: "bold",
  },

  spendableValue: {
    fontSize: 18,
    fontWeight: "bold",
  },

  emptyText: {
    fontSize: 14,
    opacity: 0.6,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  editButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  editRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },

  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
  },

  amountInput: {
    width: 105,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
  },

  removeButton: {
    width: 34,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 4,
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  savingsInput: {
    width: 120,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: "right",
  },

  saveButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
    marginTop: 8,
    marginBottom: 20,
  },

  previousPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  previousPlanButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 20,
  },

  monthNavButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  monthNavigationText: {
    flex: 1,
    alignItems: "center",
  },

  monthNavigationTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  monthNavigationKey: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
  },
});
