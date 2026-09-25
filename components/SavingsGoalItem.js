import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  Modal,
  PanResponder,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";

import { useTheme } from "../ThemeContext";

export default function SavingsGoalItem({
  goal,
  onEdit,
  onDelete,
}) {
  const { colors, isDark } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;

  const targetPaise = Number.isInteger(goal.targetAmountPaise)
    ? goal.targetAmountPaise
    : 0;

  const savedPaise = Number.isInteger(goal.savedAmountPaise)
    ? goal.savedAmountPaise
    : 0;

  const percentage =
    targetPaise > 0
      ? Math.round((savedPaise / targetPaise) * 100)
      : 0;

  const progress =
    targetPaise > 0
      ? Math.min(savedPaise / targetPaise, 1)
      : 0;

  const remainingPaise = Math.max(
    targetPaise - savedPaise,
    0,
  );

  const formatCurrency = (amountPaise) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((amountPaise || 0) / 100);

  const handleDelete = () => {
    Alert.alert(
      "Delete savings goal?",
      `Delete "${goal.name}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ],
    );
  };

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 &&
        Math.abs(gestureState.dx) >
          Math.abs(gestureState.dy),

      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(
          Math.max(
            -140,
            Math.min(140, gestureState.dx),
          ),
        );
      },

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= -80) {
          handleDelete();
        } else if (gestureState.dx >= 80) {
          onEdit();
        }

        resetPosition();
      },

      onPanResponderTerminate: resetPosition,
    }),
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeActions}>
        <View style={styles.editAction}>
          <Text style={styles.actionText}>Edit</Text>
        </View>

        <View style={styles.deleteAction}>
          <Text style={styles.actionText}>Delete</Text>
        </View>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? "#444" : "#E9ECEF",
            transform: [{ translateX }],
          },
        ]}
      >
        <TouchableWithoutFeedback
          onLongPress={() => setShowOptions(true)}
        >
          <View>
            <View style={styles.goalHeader}>
              <Text
                style={[
                  styles.goalName,
                  { color: colors.text },
                ]}
              >
                {goal.name}
              </Text>

              <Text
                style={[
                  styles.goalPercentage,
                  { color: colors.primary },
                ]}
              >
                {percentage}%
              </Text>
            </View>

            <ProgressBar
              progress={progress}
              color={colors.primary}
              style={styles.progressBar}
            />

            <View style={styles.goalAmounts}>
              <View>
                <Text
                  style={[
                    styles.amountLabel,
                    { color: colors.text },
                  ]}
                >
                  Saved
                </Text>

                <Text
                  style={[
                    styles.amountValue,
                    { color: colors.text },
                  ]}
                >
                  {formatCurrency(savedPaise)}
                </Text>
              </View>

              <View style={styles.amountRight}>
                <Text
                  style={[
                    styles.amountLabel,
                    { color: colors.text },
                  ]}
                >
                  Target
                </Text>

                <Text
                  style={[
                    styles.amountValue,
                    { color: colors.text },
                  ]}
                >
                  {formatCurrency(targetPaise)}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.remainingText,
                { color: colors.text },
              ]}
            >
              {remainingPaise === 0
                ? "Goal reached"
                : `${formatCurrency(
                    remainingPaise,
                  )} remaining`}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.optionsModal,
              { backgroundColor: colors.surface },
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOptions(false)}
            >
              <Ionicons
                name="close"
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>

            <Text
              style={[
                styles.optionsTitle,
                { color: colors.text },
              ]}
            >
              Savings goal options
            </Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                onEdit();
              }}
            >
              <Ionicons
                name="pencil-outline"
                size={20}
                color={colors.text}
              />

              <Text
                style={[
                  styles.optionText,
                  { color: colors.text },
                ]}
              >
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                handleDelete();
              }}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color="#D32F2F"
              />

              <Text
                style={[
                  styles.optionText,
                  { color: "#D32F2F" },
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: "relative",
    marginBottom: 14,
  },

  swipeActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 16,
    overflow: "hidden",
  },

  editAction: {
    width: "50%",
    backgroundColor: "#4D96FF",
    justifyContent: "center",
    paddingLeft: 18,
  },

  deleteAction: {
    width: "50%",
    backgroundColor: "#FF6B6B",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 18,
  },

  actionText: {
    color: "white",
    fontWeight: "bold",
  },

  card: {
    zIndex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  goalName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "bold",
  },

  goalPercentage: {
    fontSize: 16,
    fontWeight: "bold",
  },

  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },

  goalAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  amountRight: {
    alignItems: "flex-end",
  },

  amountLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 3,
  },

  amountValue: {
    fontSize: 15,
    fontWeight: "600",
  },

  remainingText: {
    marginTop: 14,
    fontSize: 13,
    opacity: 0.7,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    padding: 24,
  },

  optionsModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    padding: 22,
    paddingTop: 30,
  },

  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 4,
  },

  optionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },

  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },

  optionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});