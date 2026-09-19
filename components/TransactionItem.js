import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TransactionItem({ item, onDelete, onEdit }) {
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

  return (
    <View style={styles.card}>
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
          <Text style={styles.category}>
            {isTransfer ? "Transfer" : item.category}
          </Text>
          {item.note && <Text style={styles.note}>{item.note}</Text>}
          <Text style={styles.date}>{formatDate(occurredOn)}</Text>
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

        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 8,
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
  editButton: {
    padding: 4,
    marginRight: 4,
  },
  deleteButton: {
    padding: 4,
  },
});
