import { StyleSheet } from "react-native";

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

export default styles;
