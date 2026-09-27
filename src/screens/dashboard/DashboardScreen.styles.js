import { StyleSheet } from "react-native";
import { LightTheme } from "../../theme/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerSection: {
    // Remove flex: 1 to prevent taking full height
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  monthNavigationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    minWidth: 120,
    justifyContent: "center",
  },
  monthDisplayText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 6,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },

  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  drawer: {
    width: "78%",
    paddingTop: 54,
    paddingHorizontal: 22,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 24,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  drawerSubtitle: {
    fontSize: 13,
    opacity: 0.65,
    marginTop: 4,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 14,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: "600",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },

  quickActions: {
    flexDirection: "row",
    marginBottom: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: "hidden",
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  quickActionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  spendingCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  spendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  spendingTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  spendingSubtitle: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 3,
  },
  spendingRow: {
    marginTop: 10,
  },
  spendingRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  spendingCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  spendingAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
  spendingTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(128, 128, 128, 0.18)",
    overflow: "hidden",
  },
  spendingBar: {
    height: "100%",
    borderRadius: 4,
  },
  spendingEmptyState: {
    paddingVertical: 8,
  },
  spendingEmptyText: {
    fontSize: 14,
    opacity: 0.65,
  },

  filterContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: LightTheme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filterTextActive: {
    color: "white",
  },
  transactionsContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: LightTheme.colors.text,
    marginBottom: 15,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
  },
  clearSearchButton: {
    paddingLeft: 8,
  },
  leanHeroCard: {
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },

  leanLoadingText: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.7,
  },

  leanHeroLabel: {
    fontSize: 14,
    opacity: 0.68,
    marginBottom: 6,
  },

  leanHeroAmount: {
    fontSize: 36,
    fontWeight: "bold",
  },

  leanHeroDivider: {
    height: 1,
    backgroundColor: "#94A3B8",
    opacity: 0.2,
    marginVertical: 18,
  },

  leanSafeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leanSafeValueContainer: {
    flex: 1,
  },

  leanSafeLabel: {
    fontSize: 12,
    opacity: 0.65,
    marginBottom: 4,
  },

  leanSafeAmount: {
    fontSize: 22,
    fontWeight: "bold",
  },

  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(77, 150, 255, 0.10)",
  },

  daysBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },

  noPlanTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  noPlanText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
  },

  planSummaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  planSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  planSummaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  planSummarySubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 3,
  },

  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },

  planLabel: {
    fontSize: 14,
    opacity: 0.72,
  },

  planValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  planValueStrong: {
    fontSize: 15,
    fontWeight: "bold",
  },

  planDivider: {
    height: 1,
    backgroundColor: "#94A3B8",
    opacity: 0.2,
    marginVertical: 10,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 0,
  },
  planEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(77, 150, 255, 0.10)",
  },
  noPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },

  noPlanButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 7,
  },
});

export default styles;
