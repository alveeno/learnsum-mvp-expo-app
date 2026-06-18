/**
 * Tutor app — bottom tab bar.
 *
 * Ported from the source `TabBar` in `tutor/tutor-app.jsx`. Analytics carries a
 * gold lock badge until Premium; Chat shows an unread count. Active tab uses the
 * filled Ionicons glyph in green, inactive uses the `-outline` glyph in grey.
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { C } from "./tutorData";

export type TabId = "home" | "search" | "chat" | "analytics" | "profile";

const TABS: { id: TabId; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: "home", icon: "home", label: "Home" },
  { id: "search", icon: "search", label: "Search" },
  { id: "chat", icon: "chatbubble-ellipses", label: "Chat" },
  { id: "analytics", icon: "bar-chart", label: "Analytics" },
  { id: "profile", icon: "person", label: "Profile" },
];

export function TabBar({
  tab,
  onSelect,
  unread,
  premium,
  bottomInset,
}: {
  tab: TabId;
  onSelect: (id: TabId) => void;
  unread: number;
  premium: boolean;
  bottomInset: number;
}) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, 6) }]}>
      {TABS.map((tb) => {
        const on = tb.id === tab;
        const iconName = (on ? tb.icon : `${tb.icon}-outline`) as keyof typeof Ionicons.glyphMap;
        const locked = tb.id === "analytics" && !premium;
        const showUnread = tb.id === "chat" && unread > 0;
        return (
          <Pressable key={tb.id} onPress={() => onSelect(tb.id)} style={styles.item}>
            <View>
              <Ionicons name={iconName} size={24} color={on ? C.green : C.unselIc} />
              {locked && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={9} color="#3a2c06" />
                </View>
              )}
              {showUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unread}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color: on ? C.green : C.unselIc, fontWeight: on ? "700" : "600" }]}>
              {tb.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
    backgroundColor: "#fff",
  },
  item: { alignItems: "center", gap: 3, paddingHorizontal: 6 },
  label: { fontSize: 10 },
  lockBadge: {
    position: "absolute",
    top: -5,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -7,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: C.destructive,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  unreadText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
