import { StyleSheet } from "react-native";

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

  commitmentItem: {
    paddingVertical: 8,
  },

  commitmentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  paymentStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  paymentInfoCol: {
    flex: 1,
    marginRight: 10,
  },

  paymentStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },

  statusPaidText: {
    color: "#16A34A",
  },

  statusPartialText: {
    color: "#D97706",
  },

  statusPendingText: {
    color: "#64748B",
  },

  paymentProgressText: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 2,
  },

  paymentActionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  paymentActionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },

  commitmentDivider: {
    height: 1,
    backgroundColor: "#94A3B8",
    opacity: 0.15,
    marginTop: 8,
  },
});

export default styles;
