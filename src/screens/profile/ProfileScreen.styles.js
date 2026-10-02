import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 56,
  },

  // ── Top bar ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSpacer: { width: 32 },

  // ── User identity card ─────────────────────────────────────────────────────
  identityCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 8,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.55,
  },

  // ── Section labels ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    opacity: 0.45,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 2,
  },

  // ── Generic card ───────────────────────────────────────────────────────────
  card: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },

  // ── Appearance / theme selector ────────────────────────────────────────────
  themeRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 6,
  },
  themeOptionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Settings rows (Account, etc.) ──────────────────────────────────────────
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  settingsRowIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },

  // ── About rows ─────────────────────────────────────────────────────────────
  aboutCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  aboutRowLeft: {
    flex: 1,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  aboutSubLabel: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.55,
  },
  aboutDivider: {
    height: 1,
    opacity: 0.08,
  },

  // ── Danger zone / reset ────────────────────────────────────────────────────
  dangerCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 14,
  },
  disabledButton: { opacity: 0.5 },
  deleteButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});

export default styles;
