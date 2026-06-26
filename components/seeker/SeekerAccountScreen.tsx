/**
 * Seeker (student/parent) ACCOUNT tab — light settings surface.
 *
 * Front-end prototype: student/parent accounts aren't fully wired to the backend
 * yet (the one-shot save + final credential step are still Todo — see CLAUDE.md),
 * so this shows a generic identity plus the few things that do work: switch app
 * language (the real, translated `LanguagePicker`), jump over to the tutor side,
 * and log out (clears any session and returns to the welcome screen).
 *
 * English-only, matching the rest of the seeker shell.
 */
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { LanguagePicker } from "../i18n/LanguagePicker";
import { setRegistered } from "../auth/authState";
import { C } from "../tutor/tutorData";
import { logout } from "../../lib/api";

function Row({
  icon,
  label,
  sub,
  onPress,
  right,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row} disabled={!onPress && !right}>
      <View style={[styles.rowIcon, destructive && { backgroundColor: "rgba(230,57,70,0.1)" }]}>
        <Ionicons name={icon} size={19} color={destructive ? C.destructive : C.green} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rowLabel, destructive && { color: C.destructive }]}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={20} color={C.unselIc} /> : null)}
    </Pressable>
  );
}

export function SeekerAccountScreen() {
  const onLogOut = () => {
    Alert.alert("Log out", "You'll return to the welcome screen.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          void logout();
          setRegistered(false);
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.idCard}>
          <View style={styles.idAvatar}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
          <Text style={styles.idName}>Your account</Text>
          <Text style={styles.idRole}>Student / parent</Text>
        </View>

        <View style={styles.group}>
          <Row
            icon="chatbubbles-outline"
            label="Messages"
            sub="Your conversations with tutors"
            onPress={() => router.push("/messages" as Href)}
          />
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.group}>
          <Row icon="globe-outline" label="Language" right={<LanguagePicker />} />
        </View>

        <Text style={styles.sectionLabel}>More</Text>
        <View style={styles.group}>
          <Row
            icon="school-outline"
            label="Become a tutor"
            sub="Build a profile and earn"
            onPress={() => router.push("/tutor-home" as Href)}
          />
          <View style={styles.divider} />
          <Row icon="help-circle-outline" label="Help & feedback" onPress={() => {}} />
        </View>

        <View style={[styles.group, { marginTop: 16 }]}>
          <Row icon="log-out-outline" label="Log out" destructive onPress={onLogOut} />
        </View>

        <Text style={styles.note}>LearnSum · prototype</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: C.ink },
  idCard: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.hairline,
    marginTop: 6,
  },
  idAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  idName: { fontSize: 18, fontWeight: "800", color: C.ink },
  idRole: { fontSize: 13.5, color: C.muted, marginTop: 3 },
  sectionLabel: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: C.muted,
    textTransform: "uppercase",
  },
  group: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.hairline,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.greenTint,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15.5, fontWeight: "700", color: C.ink },
  rowSub: { fontSize: 12.5, color: C.muted, marginTop: 1 },
  divider: { height: 1, backgroundColor: C.hairline, marginLeft: 63 },
  note: { textAlign: "center", color: C.unselIc, fontSize: 12, marginTop: 24 },
});
