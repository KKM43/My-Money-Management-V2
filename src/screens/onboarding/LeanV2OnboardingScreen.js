import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../../services/firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import styles from "./LeanV2OnboardingScreen.styles";
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

  const cardBorderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0";
  const inputBg = isDark ? "rgba(255, 255, 255, 0.04)" : "#F8FAFC";
  const inputBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0";
  const placeholderColor = isDark ? "rgba(255, 255, 255, 0.45)" : "#94A3B8";
  const textMuted = isDark ? "#A0AEC0" : "#64748B";
  const errorColor = colors.error || "#D32F2F";

  const totalCardBg = isDark ? "rgba(77, 150, 255, 0.08)" : "#EFF6FF";
  const totalCardBorder = isDark ? "rgba(77, 150, 255, 0.22)" : "#BFDBFE";

  const errorCardBg = isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2";
  const errorCardBorder = isDark ? "rgba(239, 68, 68, 0.25)" : "#FECACA";

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
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === "income") {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
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

            <Text style={[styles.subtitle, { color: textMuted }]}>
              Add the money you expect to receive this month.
            </Text>

            {incomeSources.map((source, index) => (
              <View
                key={source.id}
                style={[
                  styles.incomeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: cardBorderColor,
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
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.removeButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${source.name.trim() || `income ${index + 1}`}`}
                    >
                      <Text style={[styles.removeText, { color: errorColor }]}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                    },
                  ]}
                  placeholder="Salary, Freelance, Bonus..."
                  placeholderTextColor={placeholderColor}
                  value={source.name}
                  onChangeText={(value) =>
                    handleIncomeNameChange(source.id, value)
                  }
                />

                <View
                  style={[
                    styles.moneyInput,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
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
                    placeholderTextColor={placeholderColor}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
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
              accessibilityRole="button"
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
                  backgroundColor: totalCardBg,
                  borderColor: totalCardBorder,
                },
              ]}
            >
              <Text style={[styles.totalLabel, { color: textMuted }]}>
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
              accessibilityRole="button"
              accessibilityLabel="Continue to fixed commitments"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (step === "fixedCommitments") {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.incomeContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => setStep("income")}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Go back to income"
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

            <Text style={[styles.subtitle, { color: textMuted }]}>
              Add expenses you already know you must pay this month.
            </Text>

            {fixedCommitments.map((commitment, index) => (
              <View
                key={commitment.id}
                style={[
                  styles.incomeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: cardBorderColor,
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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.removeButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${commitment.name.trim() || `commitment ${index + 1}`}`}
                  >
                    <Text style={[styles.removeText, { color: errorColor }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                    },
                  ]}
                  placeholder="Rent, EMI, Recharge..."
                  placeholderTextColor={placeholderColor}
                  value={commitment.name}
                  onChangeText={(value) =>
                    handleCommitmentNameChange(commitment.id, value)
                  }
                />

                <View
                  style={[
                    styles.moneyInput,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
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
                    placeholderTextColor={placeholderColor}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
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
              accessibilityRole="button"
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
                  borderColor: cardBorderColor,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryLabel,
                    {
                      color: textMuted,
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
                      color: textMuted,
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
                    moneyAfterFixedPaise >= 0 ? totalCardBg : errorCardBg,
                  borderColor:
                    moneyAfterFixedPaise >= 0
                      ? totalCardBorder
                      : errorCardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.totalLabel,
                  {
                    color: textMuted,
                  },
                ]}
              >
                Money after fixed commitments
              </Text>

              <Text
                style={[
                  styles.totalAmount,
                  {
                    color:
                      moneyAfterFixedPaise >= 0 ? colors.primary : errorColor,
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
              accessibilityRole="button"
              accessibilityLabel="Continue to savings target"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (step === "savings") {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.incomeContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => setStep("fixedCommitments")}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Go back to fixed commitments"
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

            <Text style={[styles.subtitle, { color: textMuted }]}>
              Choose how much money you want to keep aside as savings this month.
            </Text>

            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: cardBorderColor,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: textMuted }]}>
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
                <Text style={[styles.summaryLabel, { color: textMuted }]}>
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
                <Text style={[styles.summaryLabel, { color: textMuted }]}>
                  After fixed
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        moneyAfterFixedPaise >= 0 ? colors.text : errorColor,
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
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
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
                placeholderTextColor={placeholderColor}
                keyboardType="decimal-pad"
                inputMode="decimal"
                value={savingsTarget}
                onChangeText={handleSavingsTargetChange}
              />
            </View>

            <View
              style={[
                styles.savingsRateCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: cardBorderColor,
                },
              ]}
            >
              <Text style={[styles.summaryLabel, { color: textMuted }]}>
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
                    plannedSpendablePaise >= 0 ? totalCardBg : errorCardBg,
                  borderColor:
                    plannedSpendablePaise >= 0
                      ? totalCardBorder
                      : errorCardBorder,
                },
              ]}
            >
              <Text style={[styles.totalLabel, { color: textMuted }]}>
                Available to spend
              </Text>

              <Text
                style={[
                  styles.totalAmount,
                  {
                    color:
                      plannedSpendablePaise >= 0 ? colors.primary : errorColor,
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
              accessibilityRole="button"
              accessibilityLabel="Continue to plan review"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (step === "review") {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.reviewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => setStep("savings")}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back to savings target"
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

          <Text style={[styles.title, { color: colors.text }]}>
            Your monthly plan
          </Text>

          <Text style={[styles.subtitle, { color: textMuted }]}>
            Here's how your money is planned for this month.
          </Text>

          <View
            style={[
              styles.reviewCard,
              {
                backgroundColor: colors.surface,
                borderColor: cardBorderColor,
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
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(totalIncomePaise / 100)}
              </Text>
            </View>

            <View
              style={[
                styles.reviewDivider,
                { backgroundColor: cardBorderColor },
              ]}
            />

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
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(totalFixedPaise / 100)}
              </Text>
            </View>

            <View
              style={[
                styles.reviewDivider,
                { backgroundColor: cardBorderColor },
              ]}
            />

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
                      moneyAfterFixedPaise >= 0 ? colors.text : errorColor,
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

            <View
              style={[
                styles.reviewDivider,
                { backgroundColor: cardBorderColor },
              ]}
            />

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
                    { color: textMuted },
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
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(savingsTargetPaise / 100)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.reviewSpendableCard,
              {
                backgroundColor:
                  plannedSpendablePaise >= 0 ? totalCardBg : errorCardBg,
                borderColor:
                  plannedSpendablePaise >= 0
                    ? totalCardBorder
                    : errorCardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.totalLabel,
                {
                  color: textMuted,
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
                    plannedSpendablePaise >= 0 ? colors.primary : errorColor,
                },
              ]}
            >
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              }).format(plannedSpendablePaise / 100)}
            </Text>

            <Text
              style={[
                styles.reviewSpendableHint,
                { color: textMuted },
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
            accessibilityRole="button"
            accessibilityLabel="Start My Plan"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Start My Plan</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.welcomeScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(77, 150, 255, 0.12)"
                    : "#EFF6FF",
                  borderColor: isDark
                    ? "rgba(77, 150, 255, 0.25)"
                    : "#BFDBFE",
                },
              ]}
            >
              <Text style={styles.icon}>👋</Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Welcome to My Money
            </Text>

            <Text style={[styles.subtitle, { color: textMuted }]}>
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
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={placeholderColor}
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
                accessibilityRole="button"
                accessibilityLabel="Get Started"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.footerText, { color: textMuted }]}>
              We'll use your real numbers to build a monthly plan that works for you.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
