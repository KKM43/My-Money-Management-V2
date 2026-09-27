import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../../services/firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import {
  calculateFixedCommitmentsPaise,
  calculateMoneyAfterFixedPaise,
  calculatePlannedIncomePaise,
  calculatePlannedSpendablePaise,
  calculateSavingsPercentage,
  parseMoneyInputToPaise,
} from "../../utils/finance";
import { getCurrentMonthKey } from "../../utils/month";


export default function LeanV2OnboardingScreen() {
  const { colors, isDark } = useTheme();

  const [step, setStep] = useState("name");
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);

  const [incomeSources, setIncomeSources] = useState([
    {
      id: "salary",
      name: "Salary",
      amount: "",
    },
  ]);
  const [fixedCommitments, setFixedCommitments] = useState([]);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savingsTarget, setSavingsTarget] = useState("0");

  useEffect(() => {
    const loadSetup = async () => {
      const userId = auth.currentUser?.uid;

      if (!userId) {
        setIsLoadingSetup(false);
        return;
      }

      try {
        const userSnapshot = await getDoc(doc(db, "users", userId));

        if (!userSnapshot.exists()) {
          setIsLoadingSetup(false);
          return;
        }

        const userData = userSnapshot.data();

        if (userData.displayName) {
          setName(userData.displayName);
        }

        const savedStep = userData.leanV2OnboardingStep;

        if (savedStep) {
          setStep(savedStep);
        } else if (
          userData.displayName &&
          userData.leanV2OnboardingComplete !== true
        ) {
          // Existing development user who saved their
          // name before onboarding-step tracking existed.
          setStep("income");
        }

        const monthKey = getCurrentMonthKey();

        const planSnapshot = await getDoc(
          doc(db, "users", userId, "monthlyPlans", monthKey),
        );

        if (planSnapshot.exists()) {
          const planData = planSnapshot.data();

          if (
            Array.isArray(planData.incomeSources) &&
            planData.incomeSources.length > 0
          ) {
            setIncomeSources(
              planData.incomeSources.map((source) => ({
                id: source.id,
                name: source.name,
                amount: (source.amountPaise / 100).toString(),
              })),
            );
          }
          if (
            Array.isArray(planData.fixedCommitments) &&
            planData.fixedCommitments.length > 0
          ) {
            setFixedCommitments(
              planData.fixedCommitments.map((commitment) => ({
                id: commitment.id,
                name: commitment.name,
                amount: (commitment.amountPaise / 100).toString(),
              })),
            );
          }
          if (Number.isInteger(planData.savingsTargetPaise)) {
            setSavingsTarget((planData.savingsTargetPaise / 100).toString());
          }
        }
      } catch (error) {
        console.error("Error loading Lean V2 onboarding:", error);
      } finally {
        setIsLoadingSetup(false);
      }
    };

    loadSetup();
  }, []);

  const handleGetStarted = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Name required", "Please enter your name before continuing.");
      return;
    }

    const userId = auth.currentUser?.uid;

    if (!userId) {
      Alert.alert("Sign in required", "Please sign in again and continue.");
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(
        doc(db, "users", userId),
        {
          displayName: trimmedName,
          leanV2OnboardingComplete: false,
          leanV2OnboardingStep: "income",
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      setStep("income");
    } catch (error) {
      Alert.alert("Error", error.message || "Could not save your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleIncomeNameChange = (id, value) => {
    setIncomeSources((current) =>
      current.map((source) =>
        source.id === id
          ? {
              ...source,
              name: value,
            }
          : source,
      ),
    );
  };

  const handleIncomeAmountChange = (id, value) => {
    const cleaned = value.replace(/[^0-9.]/g, "");

    const parts = cleaned.split(".");

    if (parts.length > 2) {
      return;
    }

    const [rupees, paise = ""] = parts;

    const normalized = cleaned.includes(".")
      ? `${rupees || "0"}.${paise.slice(0, 2)}`
      : rupees;

    setIncomeSources((current) =>
      current.map((source) =>
        source.id === id
          ? {
              ...source,
              amount: normalized,
            }
          : source,
      ),
    );
  };

  const addIncomeSource = () => {
    setIncomeSources((current) => [
      ...current,
      {
        id: `income-${Date.now()}`,
        name: "",
        amount: "",
      },
    ]);
  };

  const removeIncomeSource = (id) => {
    setIncomeSources((current) => current.filter((source) => source.id !== id));
  };

  const normalizedIncomeSources = incomeSources
    .map((source) => ({
      id: source.id,
      name: source.name.trim(),
      amountPaise: parseMoneyInputToPaise(source.amount),
    }))
    .filter((source) => source.name && Number.isInteger(source.amountPaise));

  const totalIncomePaise = calculatePlannedIncomePaise(normalizedIncomeSources);

  const normalizedFixedCommitments = fixedCommitments
    .map((commitment) => ({
      id: commitment.id,
      name: commitment.name.trim(),
      amountPaise: parseMoneyInputToPaise(commitment.amount),
    }))
    .filter(
      (commitment) =>
        commitment.name && Number.isInteger(commitment.amountPaise),
    );

  const totalFixedPaise = calculateFixedCommitmentsPaise(
    normalizedFixedCommitments,
  );

  const moneyAfterFixedPaise = calculateMoneyAfterFixedPaise(
    totalIncomePaise,
    totalFixedPaise,
  );

  const parsedSavingsTargetPaise = parseMoneyInputToPaise(savingsTarget);

  const savingsTargetPaise = Number.isInteger(parsedSavingsTargetPaise)
    ? parsedSavingsTargetPaise
    : 0;

  const savingsPercentage = calculateSavingsPercentage(
    totalIncomePaise,
    savingsTargetPaise,
  );

  const plannedSpendablePaise = calculatePlannedSpendablePaise(
    moneyAfterFixedPaise,
    savingsTargetPaise,
  );

  const handleSaveIncome = async () => {
    if (normalizedIncomeSources.length === 0) {
      Alert.alert("Income required", "Please add at least one income source.");
      return;
    }

    const hasInvalidSource = incomeSources.some((source) => {
      const sourceName = source.name.trim();

      const amountPaise = parseMoneyInputToPaise(source.amount);

      return !sourceName || !Number.isInteger(amountPaise) || amountPaise <= 0;
    });

    if (hasInvalidSource) {
      Alert.alert(
        "Check your income",
        "Each income source needs a name and an amount greater than ₹0.",
      );
      return;
    }

    const userId = auth.currentUser?.uid;

    if (!userId) {
      return;
    }

    setIsSaving(true);

    try {
      const monthKey = getCurrentMonthKey();

      await setDoc(
        doc(db, "users", userId, "monthlyPlans", monthKey),
        {
          monthKey,
          incomeSources: normalizedIncomeSources,
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      await setDoc(
        doc(db, "users", userId),
        {
          leanV2OnboardingStep: "fixedCommitments",
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      setStep("fixedCommitments");
    } catch (error) {
      Alert.alert("Error", error.message || "Could not save your income.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommitmentNameChange = (id, value) => {
    setFixedCommitments((current) =>
      current.map((commitment) =>
        commitment.id === id
          ? {
              ...commitment,
              name: value,
            }
          : commitment,
      ),
    );
  };

  const handleCommitmentAmountChange = (id, value) => {
    const cleaned = value.replace(/[^0-9.]/g, "");

    const parts = cleaned.split(".");

    if (parts.length > 2) {
      return;
    }

    const [rupees, paise = ""] = parts;

    const normalized = cleaned.includes(".")
      ? `${rupees || "0"}.${paise.slice(0, 2)}`
      : rupees;

    setFixedCommitments((current) =>
      current.map((commitment) =>
        commitment.id === id
          ? {
              ...commitment,
              amount: normalized,
            }
          : commitment,
      ),
    );
  };

  const addFixedCommitment = () => {
    setFixedCommitments((current) => [
      ...current,
      {
        id: `fixed-${Date.now()}`,
        name: "",
        amount: "",
      },
    ]);
  };

  const removeFixedCommitment = (id) => {
    setFixedCommitments((current) =>
      current.filter((commitment) => commitment.id !== id),
    );
  };

  const handleSaveFixedCommitments = async () => {
    const hasInvalidCommitment = fixedCommitments.some((commitment) => {
      const commitmentName = commitment.name.trim();

      const amountPaise = parseMoneyInputToPaise(commitment.amount);

      return (
        !commitmentName || !Number.isInteger(amountPaise) || amountPaise <= 0
      );
    });

    if (hasInvalidCommitment) {
      Alert.alert(
        "Check your commitments",
        "Each fixed commitment needs a name and an amount greater than ₹0.",
      );
      return;
    }

    const userId = auth.currentUser?.uid;

    if (!userId) {
      return;
    }

    setIsSaving(true);

    try {
      const monthKey = getCurrentMonthKey();

      await setDoc(
        doc(db, "users", userId, "monthlyPlans", monthKey),
        {
          monthKey,
          fixedCommitments: normalizedFixedCommitments,
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      await setDoc(
        doc(db, "users", userId),
        {
          leanV2OnboardingStep: "savings",
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      setStep("savings");
    } catch (error) {
      Alert.alert("Error", error.message || "Could not save your commitments.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavingsTargetChange = (value) => {
    const cleaned = value.replace(/[^0-9.]/g, "");

    const parts = cleaned.split(".");

    if (parts.length > 2) {
      return;
    }

    const [rupees, paise = ""] = parts;

    const normalized = cleaned.includes(".")
      ? `${rupees || "0"}.${paise.slice(0, 2)}`
      : rupees;

    setSavingsTarget(normalized);
  };

  const handleSaveSavings = async () => {
    const amountPaise = parseMoneyInputToPaise(savingsTarget);

    if (!Number.isInteger(amountPaise) || amountPaise < 0) {
      Alert.alert("Check your savings target", "Enter a valid savings amount.");
      return;
    }

    const userId = auth.currentUser?.uid;

    if (!userId) {
      return;
    }

    setIsSaving(true);

    try {
      const monthKey = getCurrentMonthKey();

      await setDoc(
        doc(db, "users", userId, "monthlyPlans", monthKey),
        {
          monthKey,
          savingsTargetPaise: amountPaise,
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      await setDoc(
        doc(db, "users", userId),
        {
          leanV2OnboardingStep: "review",
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      setStep("review");
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Could not save your savings target.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteOnboarding = async () => {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    Alert.alert(
      "Sign in required",
      "Please sign in again and continue.",
    );
    return;
  }

  setIsSaving(true);

  try {
    await setDoc(
      doc(db, "users", userId),
      {
        leanV2OnboardingComplete: true,
        leanV2OnboardingStep: "complete",
        onboardingCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      },
    );
  } catch (error) {
    Alert.alert(
      "Error",
      error.message ||
        "Could not finish setting up your plan.",
    );
  } finally {
    setIsSaving(false);
  }
};

  if (isLoadingSetup) {
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

  if (step === "income") {
    return (
      <KeyboardAvoidingView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.incomeContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              styles.stepText,
              {
                color: colors.primary,
              },
            ]}
          >
            STEP 2
          </Text>

          <Text style={[styles.title, { color: colors.text }]}>
            Your monthly income
          </Text>

          <Text style={[styles.subtitle, { color: colors.text }]}>
            Add the money you expect to receive this month.
          </Text>

          {incomeSources.map((source, index) => (
            <View
              key={source.id}
              style={[
                styles.incomeCard,
                {
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <View style={styles.incomeCardHeader}>
                <Text
                  style={[
                    styles.incomeNumber,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Income {index + 1}
                </Text>

                {incomeSources.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeIncomeSource(source.id)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? "#1F2937" : "#F8FAFC",
                    borderColor: isDark ? "#374151" : "#E2E8F0",
                  },
                ]}
                placeholder="Salary, Freelance, Bonus..."
                placeholderTextColor="#94A3B8"
                value={source.name}
                onChangeText={(value) =>
                  handleIncomeNameChange(source.id, value)
                }
              />

              <View
                style={[
                  styles.moneyInput,
                  {
                    backgroundColor: isDark ? "#1F2937" : "#F8FAFC",
                    borderColor: isDark ? "#374151" : "#E2E8F0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rupee,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  ₹
                </Text>

                <TextInput
                  style={[
                    styles.moneyInputText,
                    {
                      color: colors.text,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={source.amount}
                  onChangeText={(value) =>
                    handleIncomeAmountChange(source.id, value)
                  }
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.addButton,
              {
                borderColor: colors.primary,
              },
            ]}
            onPress={addIncomeSource}
          >
            <Text
              style={[
                styles.addButtonText,
                {
                  color: colors.primary,
                },
              ]}
            >
              + Add another income source
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.totalCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#EFF6FF",
              },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total monthly income
            </Text>

            <Text
              style={[
                styles.totalAmount,
                {
                  color: colors.primary,
                },
              ]}
            >
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              }).format(totalIncomePaise / 100)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
              },
              isSaving && styles.disabledButton,
            ]}
            onPress={handleSaveIncome}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "fixedCommitments") {
    return (
      <KeyboardAvoidingView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.incomeContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => setStep("income")}
            style={styles.backButton}
          >
            <Text
              style={[
                styles.backButtonText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ← Back
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.stepText,
              {
                color: colors.primary,
              },
            ]}
          >
            STEP 3
          </Text>

          <Text style={[styles.title, { color: colors.text }]}>
            Fixed monthly commitments
          </Text>

          <Text style={[styles.subtitle, { color: colors.text }]}>
            Add expenses you already know you must pay this month.
          </Text>

          {fixedCommitments.map((commitment, index) => (
            <View
              key={commitment.id}
              style={[
                styles.incomeCard,
                {
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <View style={styles.incomeCardHeader}>
                <Text
                  style={[
                    styles.incomeNumber,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Commitment {index + 1}
                </Text>

                <TouchableOpacity
                  onPress={() => removeFixedCommitment(commitment.id)}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? "#1F2937" : "#F8FAFC",
                    borderColor: isDark ? "#374151" : "#E2E8F0",
                  },
                ]}
                placeholder="Rent, EMI, Recharge..."
                placeholderTextColor="#94A3B8"
                value={commitment.name}
                onChangeText={(value) =>
                  handleCommitmentNameChange(commitment.id, value)
                }
              />

              <View
                style={[
                  styles.moneyInput,
                  {
                    backgroundColor: isDark ? "#1F2937" : "#F8FAFC",
                    borderColor: isDark ? "#374151" : "#E2E8F0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rupee,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  ₹
                </Text>

                <TextInput
                  style={[
                    styles.moneyInputText,
                    {
                      color: colors.text,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={commitment.amount}
                  onChangeText={(value) =>
                    handleCommitmentAmountChange(commitment.id, value)
                  }
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.addButton,
              {
                borderColor: colors.primary,
              },
            ]}
            onPress={addFixedCommitment}
          >
            <Text
              style={[
                styles.addButtonText,
                {
                  color: colors.primary,
                },
              ]}
            >
              + Add fixed commitment
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Monthly income
              </Text>

              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(totalIncomePaise / 100)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Fixed commitments
              </Text>

              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(totalFixedPaise / 100)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.totalCard,
              {
                backgroundColor:
                  moneyAfterFixedPaise >= 0
                    ? isDark
                      ? "#1E293B"
                      : "#EFF6FF"
                    : isDark
                      ? "#3F1D1D"
                      : "#FEF2F2",
              },
            ]}
          >
            <Text
              style={[
                styles.totalLabel,
                {
                  color: colors.text,
                },
              ]}
            >
              Money after fixed commitments
            </Text>

            <Text
              style={[
                styles.totalAmount,
                {
                  color: moneyAfterFixedPaise >= 0 ? colors.primary : "#D32F2F",
                },
              ]}
            >
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              }).format(moneyAfterFixedPaise / 100)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
              },
              isSaving && styles.disabledButton,
            ]}
            onPress={handleSaveFixedCommitments}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "savings") {
    return (
      <KeyboardAvoidingView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.incomeContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => setStep("fixedCommitments")}
            style={styles.backButton}
          >
            <Text
              style={[
                styles.backButtonText,
                {
                  color: colors.primary,
                },
              ]}
            >
              ← Back
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.stepText,
              {
                color: colors.primary,
              },
            ]}
          >
            STEP 4
          </Text>

          <Text style={[styles.title, { color: colors.text }]}>
            Protect some money
          </Text>

          <Text style={[styles.subtitle, { color: colors.text }]}>
            Choose how much money you want to keep aside as savings this month.
          </Text>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>
                Monthly income
              </Text>

              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(totalIncomePaise / 100)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>
                Fixed commitments
              </Text>

              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(totalFixedPaise / 100)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>
                After fixed
              </Text>

              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: moneyAfterFixedPaise >= 0 ? colors.text : "#D32F2F",
                  },
                ]}
              >
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(moneyAfterFixedPaise / 100)}
              </Text>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            How much do you want to save?
          </Text>

          <View
            style={[
              styles.moneyInput,
              styles.savingsInput,
              {
                backgroundColor: isDark ? "#1F2937" : "#F8FAFC",
                borderColor: isDark ? "#374151" : "#E2E8F0",
              },
            ]}
          >
            <Text
              style={[
                styles.rupee,
                {
                  color: colors.primary,
                },
              ]}
            >
              ₹
            </Text>

            <TextInput
              style={[
                styles.moneyInputText,
                {
                  color: colors.text,
                },
              ]}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={savingsTarget}
              onChangeText={handleSavingsTargetChange}
            />
          </View>

          <View
            style={[
              styles.savingsRateCard,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.text }]}>
              Savings rate
            </Text>

            <Text
              style={[
                styles.savingsRateValue,
                {
                  color: colors.primary,
                },
              ]}
            >
              {savingsPercentage.toFixed(2)}%
            </Text>
          </View>

          <View
            style={[
              styles.totalCard,
              {
                backgroundColor:
                  plannedSpendablePaise >= 0
                    ? isDark
                      ? "#1E293B"
                      : "#EFF6FF"
                    : isDark
                      ? "#3F1D1D"
                      : "#FEF2F2",
              },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Available to spend
            </Text>

            <Text
              style={[
                styles.totalAmount,
                {
                  color:
                    plannedSpendablePaise >= 0 ? colors.primary : "#D32F2F",
                },
              ]}
            >
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              }).format(plannedSpendablePaise / 100)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
              },
              isSaving && styles.disabledButton,
            ]}
            onPress={handleSaveSavings}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "review") {
  return (
    <ScrollView
      style={{
        backgroundColor: colors.background,
      }}
      contentContainerStyle={styles.reviewContent}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        onPress={() => setStep("savings")}
        style={styles.backButton}
      >
        <Text
          style={[
            styles.backButtonText,
            {
              color: colors.primary,
            },
          ]}
        >
          ← Back
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.stepText,
          {
            color: colors.primary,
          },
        ]}
      >
        STEP 5
      </Text>

      <Text
        style={[
          styles.title,
          { color: colors.text },
        ]}
      >
        Your monthly plan
      </Text>

      <Text
        style={[
          styles.subtitle,
          { color: colors.text },
        ]}
      >
        Here's how your money is planned for this month.
      </Text>

      <View
        style={[
          styles.reviewCard,
          {
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.reviewRow}>
          <Text
            style={[
              styles.reviewLabel,
              { color: colors.text },
            ]}
          >
            Monthly income
          </Text>

          <Text
            style={[
              styles.reviewValue,
              { color: colors.text },
            ]}
          >
            {new Intl.NumberFormat(
              "en-IN",
              {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              },
            ).format(totalIncomePaise / 100)}
          </Text>
        </View>

        <View style={styles.reviewDivider} />

        <View style={styles.reviewRow}>
          <Text
            style={[
              styles.reviewLabel,
              { color: colors.text },
            ]}
          >
            Fixed commitments
          </Text>

          <Text
            style={[
              styles.reviewValue,
              { color: colors.text },
            ]}
          >
            {new Intl.NumberFormat(
              "en-IN",
              {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              },
            ).format(totalFixedPaise / 100)}
          </Text>
        </View>

        <View style={styles.reviewDivider} />

        <View style={styles.reviewRow}>
          <Text
            style={[
              styles.reviewLabel,
              { color: colors.text },
            ]}
          >
            Money after fixed
          </Text>

          <Text
            style={[
              styles.reviewValue,
              {
                color:
                  moneyAfterFixedPaise >= 0
                    ? colors.text
                    : "#D32F2F",
              },
            ]}
          >
            {new Intl.NumberFormat(
              "en-IN",
              {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              },
            ).format(
              moneyAfterFixedPaise / 100,
            )}
          </Text>
        </View>

        <View style={styles.reviewDivider} />

        <View style={styles.reviewRow}>
          <View>
            <Text
              style={[
                styles.reviewLabel,
                { color: colors.text },
              ]}
            >
              Savings target
            </Text>

            <Text
              style={[
                styles.reviewSubtext,
                { color: colors.text },
              ]}
            >
              {savingsPercentage.toFixed(2)}% of income
            </Text>
          </View>

          <Text
            style={[
              styles.reviewValue,
              { color: colors.text },
            ]}
          >
            {new Intl.NumberFormat(
              "en-IN",
              {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              },
            ).format(
              savingsTargetPaise / 100,
            )}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.reviewSpendableCard,
          {
            backgroundColor:
              plannedSpendablePaise >= 0
                ? isDark
                  ? "#1E293B"
                  : "#EFF6FF"
                : isDark
                  ? "#3F1D1D"
                  : "#FEF2F2",
          },
        ]}
      >
        <Text
          style={[
            styles.totalLabel,
            {
              color: colors.text,
            },
          ]}
        >
          Available to spend
        </Text>

        <Text
          style={[
            styles.reviewSpendableAmount,
            {
              color:
                plannedSpendablePaise >= 0
                  ? colors.primary
                  : "#D32F2F",
            },
          ]}
        >
          {new Intl.NumberFormat(
            "en-IN",
            {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 2,
            },
          ).format(
            plannedSpendablePaise / 100,
          )}
        </Text>

        <Text
          style={[
            styles.reviewSpendableHint,
            { color: colors.text },
          ]}
        >
          This is the money available for your day-to-day spending after fixed commitments and savings.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: colors.primary,
          },
          isSaving && styles.disabledButton,
        ]}
        onPress={handleCompleteOnboarding}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator
            size="small"
            color="white"
          />
        ) : (
          <Text style={styles.primaryButtonText}>
            Start My Plan
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? "#1E293B" : "#EFF6FF",
            },
          ]}
        >
          <Text style={styles.icon}>👋</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to My Money
        </Text>

        <Text style={[styles.subtitle, { color: colors.text }]}>
          Let's make your money easier to understand, control, and save.
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>
            What should we call you?
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? "#1F2937" : "#F8FAFC",
                borderColor: isDark ? "#374151" : "#E2E8F0",
              },
            ]}
            placeholder="Enter your name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={50}
            returnKeyType="done"
            onSubmitEditing={handleGetStarted}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
              },
              isSaving && styles.disabledButton,
            ]}
            onPress={handleGetStarted}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Get Started</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.footerText, { color: colors.text }]}>
          We'll use your real numbers to build a monthly plan that works for
          you.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  icon: {
    fontSize: 34,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.72,
    marginBottom: 36,
  },

  form: {
    width: "100%",
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 17,
    marginBottom: 16,
  },

  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  footerText: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.55,
    marginTop: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  incomeContent: {
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },

  stepText: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
  },

  incomeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  incomeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  incomeNumber: {
    fontSize: 14,
    fontWeight: "600",
  },

  removeText: {
    color: "#D32F2F",
    fontSize: 13,
    fontWeight: "600",
  },

  moneyInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
  },

  rupee: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },

  moneyInputText: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 17,
  },

  addButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  totalCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },

  totalLabel: {
    fontSize: 14,
    opacity: 0.65,
    marginBottom: 6,
  },

  totalAmount: {
    fontSize: 30,
    fontWeight: "bold",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  summaryCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  savingsInput: {
    marginBottom: 16,
  },

  savingsRateCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  savingsRateValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  reviewContent: {
  paddingHorizontal: 24,
  paddingTop: 70,
  paddingBottom: 40,
},

reviewCard: {
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
},

reviewRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

reviewLabel: {
  fontSize: 14,
  opacity: 0.72,
},

reviewValue: {
  fontSize: 16,
  fontWeight: "700",
},

reviewSubtext: {
  fontSize: 12,
  opacity: 0.55,
  marginTop: 4,
},

reviewDivider: {
  height: 1,
  backgroundColor: "#94A3B8",
  opacity: 0.18,
  marginVertical: 16,
},

reviewSpendableCard: {
  borderRadius: 20,
  padding: 22,
  marginBottom: 20,
},

reviewSpendableAmount: {
  fontSize: 34,
  fontWeight: "bold",
  marginTop: 6,
  marginBottom: 10,
},

reviewSpendableHint: {
  fontSize: 13,
  lineHeight: 19,
  opacity: 0.6,
},
});
