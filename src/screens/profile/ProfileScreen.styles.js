import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 48,
  },

  // ── Top bar ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSpacer: { width: 24 },

  // ── User identity card ─────────────────────────────────────────────────────
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: "700",
    color: "white",
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.6,
  },

  // ── Section labels ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    opacity: 0.5,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },

  // ── Appearance / theme selector ────────────────────────────────────────────
  themeRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 6,
  },
  themeOptionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Account row ────────────────────────────────────────────────────────────
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
  },
  accountRowText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // ── About rows ─────────────────────────────────────────────────────────────
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  aboutLabel: {
    fontSize: 14,
    opacity: 0.65,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  aboutDivider: {
    height: 1,
    marginVertical: 2,
  },

  // ── Danger zone / reset ────────────────────────────────────────────────────
  dangerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    opacity: 0.75,
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
    padding: 15,
  },
  disabledButton: { opacity: 0.6 },
  deleteButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default styles;
