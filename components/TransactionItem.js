import React, { useRef } from "react";
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
import { useTheme } from "../ThemeContext";

export default function TransactionItem({
  item,
  onDelete,
  onEdit,
  showActions = true,
}) {
  const { colors, isDark } = useTheme();
  const [showOptions, setShowOptions] = React.useState(false);
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ],
    );
  };

  const handleLongPress = () => {
    setShowOptions(true);
  };

  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        showActions &&
        Math.abs(gestureState.dx) > 10 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(Math.max(-140, Math.min(140, gestureState.dx)));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= -80) {
          handleDelete();
        } else if (gestureState.dx >= 80) {
          onEdit();
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const getCategoryIcon = (category) => {
    const iconMap = {
      "Food & Dining": "restaurant",
      Transportation: "car",
      Shopping: "bag",
      Entertainment: "game-controller",
      "Bills & Utilities": "receipt",
      Healthcare: "medical",
      Education: "school",
      Salary: "briefcase",
      Freelance: "laptop",
      Investment: "trending-up",
      Gift: "gift",
      Bonus: "trophy",
    };
    return iconMap[category] || "ellipsis-horizontal";
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      "Food & Dining": "#FF6B6B",
      Transportation: "#4ECDC4",
      Shopping: "#45B7D1",
      Entertainment: "#96CEB4",
      "Bills & Utilities": "#FFEAA7",
      Healthcare: "#DDA0DD",
      Education: "#98D8C8",
      Salary: "#4ECDC4",
      Freelance: "#45B7D1",
      Investment: "#96CEB4",
      Gift: "#FFEAA7",
      Bonus: "#DDA0DD",
    };
    return colorMap[category] || "#A0A0A0";
  };

  const amountPaise = Number.isInteger(item.amountPaise)
    ? item.amountPaise
    : Math.round(Number(item.amount || 0) * 100);

  const occurredOn = item.occurredOn || item.date;
  const isTransfer = item.type === "transfer";
  const isCardPayment = item.paymentKind === "cardPayment";

  return (
    <View style={styles.swipeContainer}>
      {showActions && (
        <View style={styles.swipeActions}>
          <View style={styles.editAction}>
            <Text style={styles.actionText}>Edit</Text>
          </View>
          <View style={styles.deleteAction}>
            <Text style={styles.actionText}>Delete</Text>
          </View>
        </View>
      )}
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
        <TouchableWithoutFeedback onLongPress={showActions ? handleLongPress : undefined}>
          <View style={styles.cardContent}>
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getCategoryColor(item.category) },
          ]}
        >
          <Ionicons
            name={getCategoryIcon(item.category)}
            size={20}
            color="white"
          />
        </View>
        <View style={styles.details}>
          <Text style={[styles.category, { color: colors.text }]}>
            {isCardPayment ? "Card payment" : isTransfer ? "Transfer" : item.category}
          </Text>
          {item.note && (
            <Text style={[styles.note, { color: colors.text }]}>{item.note}</Text>
          )}
          <Text style={[styles.date, { color: colors.text }]}>
            {formatDate(occurredOn)}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text
          style={[
            styles.amount,
            { color: isTransfer ? "#4D96FF" : item.type === "income" ? "#4ECDC4" : "#FF6B6B" },
          ]}
        >
          {isTransfer ? "" : item.type === "income" ? "+" : "-"}
          {formatCurrency(amountPaise / 100)}
        </Text>

      </View>
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
          <View style={[styles.optionsModal, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOptions(false)}
              accessibilityLabel="Close transaction options"
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.optionsTitle, { color: colors.text }]}>
              Transaction options
            </Text>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                onEdit();
              }}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                handleDelete();
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#D32F2F" />
              <Text style={[styles.optionText, { color: "#D32F2F" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    zIndex: 1,
  },
  swipeContainer: {
    position: "relative",
    marginBottom: 8,
  },
  swipeActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
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
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  note: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
});
