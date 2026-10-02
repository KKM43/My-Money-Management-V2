import { Platform, StatusBar, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) : 0,
  },

  keyboardAvoiding: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  welcomeScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
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
    borderWidth: 1,
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
    marginBottom: 24,
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
    marginTop: 24,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  incomeContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
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
    borderWidth: 1,
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

  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },

  removeText: {
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
    borderWidth: 1,
  },

  totalLabel: {
    fontSize: 14,
    marginBottom: 6,
  },

  totalAmount: {
    fontSize: 30,
    fontWeight: "bold",
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  summaryCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 14,
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
    borderWidth: 1,
  },

  savingsRateValue: {
    fontSize: 20,
    fontWeight: "bold",
  },

  reviewContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },

  reviewCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
  },

  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  reviewLabel: {
    fontSize: 14,
  },

  reviewValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  reviewSubtext: {
    fontSize: 12,
    marginTop: 4,
  },

  reviewDivider: {
    height: 1,
    marginVertical: 16,
  },

  reviewSpendableCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
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
  },
});

export default styles;
