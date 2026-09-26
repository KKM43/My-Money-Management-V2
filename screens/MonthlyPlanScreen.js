import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../services/firebaseConfig";
import { useTheme } from "../ThemeContext";
import {
  calculateFixedCommitmentsPaise,
  calculateMoneyAfterFixedPaise,
  calculatePlannedIncomePaise,
  calculatePlannedSpendablePaise,
} from "../utils/finance";

const getCurrentMonthKey = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;
};

export default function MonthlyPlanScreen({
  navigation,
}) {
  const { colors } = useTheme();

  const [monthlyPlan, setMonthlyPlan] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const monthKey = getCurrentMonthKey();

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setIsLoading(false);
      return;
    }

    const planRef = doc(
      db,
      "users",
      userId,
      "monthlyPlans",
      monthKey,
    );

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
        console.error(
          "Error loading monthly plan:",
          error,
        );

        setMonthlyPlan(null);
        setIsLoading(false);
      },
    );
  }, [monthKey]);

  const incomeSources = Array.isArray(
    monthlyPlan?.incomeSources,
  )
    ? monthlyPlan.incomeSources
    : [];

  const fixedCommitments = Array.isArray(
    monthlyPlan?.fixedCommitments,
  )
    ? monthlyPlan.fixedCommitments
    : [];

  const totalIncomePaise =
    calculatePlannedIncomePaise(
      incomeSources,
    );

  const totalFixedPaise =
    calculateFixedCommitmentsPaise(
      fixedCommitments,
    );

  const moneyAfterFixedPaise =
    calculateMoneyAfterFixedPaise(
      totalIncomePaise,
      totalFixedPaise,
    );

  const savingsTargetPaise =
    Number.isInteger(
      monthlyPlan?.savingsTargetPaise,
    )
      ? monthlyPlan.savingsTargetPaise
      : 0;

  const plannedSpendablePaise =
    calculatePlannedSpendablePaise(
      moneyAfterFixedPaise,
      savingsTargetPaise,
    );

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
            backgroundColor:
              colors.background,
          },
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
    <ScrollView
      style={{
        backgroundColor: colors.background,
      }}
      contentContainerStyle={
        styles.container
      }
    >
      <View style={styles.header}>
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

        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            Monthly Plan
          </Text>

          <Text
            style={[
              styles.monthText,
              {
                color: colors.text,
              },
            ]}
          >
            {monthKey}
          </Text>
        </View>
      </View>

      {!monthlyPlan ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.emptyTitle,
              {
                color: colors.text,
              },
            ]}
          >
            No monthly plan found
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.card,
              {
                backgroundColor:
                  colors.surface,
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

            {incomeSources.map((source) => (
              <View
                key={source.id}
                style={styles.row}
              >
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {source.name}
                </Text>

                <Text
                  style={[
                    styles.value,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {formatPaise(
                    source.amountPaise,
                  )}
                </Text>
              </View>
            ))}

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
                {formatPaise(
                  totalIncomePaise,
                )}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor:
                  colors.surface,
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

            {fixedCommitments.length ===
            0 ? (
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                No fixed commitments
              </Text>
            ) : (
              fixedCommitments.map(
                (commitment) => (
                  <View
                    key={commitment.id}
                    style={styles.row}
                  >
                    <Text
                      style={[
                        styles.label,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {commitment.name}
                    </Text>

                    <Text
                      style={[
                        styles.value,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {formatPaise(
                        commitment.amountPaise,
                      )}
                    </Text>
                  </View>
                ),
              )
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
                {formatPaise(
                  totalFixedPaise,
                )}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor:
                  colors.surface,
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
              Savings & Spending
            </Text>

            <View style={styles.row}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Money after fixed
              </Text>

              <Text
                style={[
                  styles.value,
                  {
                    color:
                      moneyAfterFixedPaise >=
                      0
                        ? colors.text
                        : "#D32F2F",
                  },
                ]}
              >
                {formatPaise(
                  moneyAfterFixedPaise,
                )}
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

              <Text
                style={[
                  styles.value,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {formatPaise(
                  savingsTargetPaise,
                )}
              </Text>
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
                      plannedSpendablePaise >=
                      0
                        ? colors.primary
                        : "#D32F2F",
                  },
                ]}
              >
                {formatPaise(
                  plannedSpendablePaise,
                )}
              </Text>
            </View>
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

  monthText: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 3,
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
});