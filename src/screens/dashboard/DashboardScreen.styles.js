import { StyleSheet } from "react-native";
import { LightTheme } from "../../theme/theme";

const styles = StyleSheet.create({
  // ??? Root ????????????????????????????????????????????????????????????????
  container: {
    flex: 1,
  },

  // ??? Header ??????????????????????????????????????????????????????????????
  headerGradient: {
    paddingTop: 46,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  headerSection: {},
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  greeting: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 2,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ??? Month Navigation ?????????????????????????????????????????????????????
  monthNavigationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 2,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 10,
    minWidth: 130,
    justifyContent: "center",
  },
  monthDisplayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginLeft: 5,
  },

  // ??? Content scroll area ??????????????????????????????????????????????????
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ??? Hero Card ????????????????????????????????????????????????????????????
  leanHeroCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  leanLoadingText: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.7,
    paddingVertical: 12,
  },
  heroLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.65,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  // Primary number ? Safe to Spend / Day
  heroPrimaryAmount: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 16,
  },
  // Secondary row ? remaining + days
  heroSecondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heroRemainingText: {
    fontSize: 15,
    fontWeight: "600",
  },
  heroDaysBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(77,150,255,0.12)",
    gap: 4,
  },
  heroDaysText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Progress bar
  heroProgressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(128,128,128,0.18)",
    overflow: "hidden",
    marginBottom: 10,
  },
  heroProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  heroProgressLabel: {
    fontSize: 12,
    opacity: 0.55,
  },
  leanHeroDivider: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.25)",
    marginVertical: 16,
  },

  // Legacy labels kept for leanSafeRow path (past/future months)
  leanHeroLabel: {
    fontSize: 13,
    opacity: 0.65,
    marginBottom: 4,
  },
  leanHeroAmount: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1,
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
    fontSize: 26,
    fontWeight: "700",
  },
  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(77,150,255,0.10)",
    gap: 4,
  },
  daysBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ??? No Plan ??????????????????????????????????????????????????????????????
  noPlanTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  noPlanText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
    marginBottom: 16,
  },
  noPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  noPlanButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },

  // ??? Your Plan Card ???????????????????????????????????????????????????????
  planSummaryCard: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  planSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  planSummaryTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  planSummarySubtitle: {
    fontSize: 12,
    opacity: 0.55,
    marginTop: 2,
  },
  planEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(77,150,255,0.10)",
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  planLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  planValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  planValueStrong: {
    fontSize: 14,
    fontWeight: "700",
  },
  planDivider: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.22)",
    marginVertical: 8,
  },

  // ??? Spending Summary Card ????????????????????????????????????????????????
  spendingCard: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  spendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  spendingTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  spendingSubtitle: {
    fontSize: 12,
    opacity: 0.55,
    marginTop: 2,
  },
  spendingEmptyState: {
    paddingVertical: 4,
  },
  spendingEmptyText: {
    fontSize: 13,
    opacity: 0.55,
  },
  spendingRow: {
    marginTop: 10,
  },
  spendingRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  spendingCategory: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  spendingAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
  spendingTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(128,128,128,0.15)",
    overflow: "hidden",
  },
  spendingBar: {
    height: "100%",
    borderRadius: 3,
  },

  // ??? Add Expense ??????????????????????????????????????????????????????????
  quickActions: {
    marginBottom: 14,
  },
  quickActionButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  quickActionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  // ??? Transactions Section ?????????????????????????????????????????????????
  txSectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LightTheme.colors.text,
  },
  transactionsContainer: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchButton: {
    paddingLeft: 8,
  },
  filterContainer: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: LightTheme.colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  filterTextActive: {
    color: "white",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    opacity: 0.55,
    textAlign: "center",
  },

  // ??? Drawer ???????????????????????????????????????????????????????????????
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.45)",
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
  drawerNavSection: {
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
  drawerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
  drawerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  drawerFooter: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.15)",
    alignItems: "center",
  },
  drawerFooterText: {
    fontSize: 11,
    opacity: 0.5,
  },
});

export default styles;
