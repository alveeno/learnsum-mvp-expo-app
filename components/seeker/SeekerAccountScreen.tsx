/**
 * Seeker (student/parent) ACCOUNT tab — identity + light settings surface.
 *
 * Shows the seeker's real profile (GET /api/auth/me): avatar, name, role, and —
 * when set — their bio, phone, education level and gender (collected on the
 * SeekerAbout screen). An "Edit profile" row re-opens SeekerAbout in edit mode
 * (the store is pre-seeded here from the loaded `me`, so the screen shows current
 * values), and on return the tab refetches (consumeSeekerProfileDirty).
 *
 * If there's no session / the profile can't load, it falls back to a neutral
 * "Your account" card (no fake data) so the working rows — language, become a
 * tutor, log out — still function. English-only, matching the rest of the shell.
 */
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { LanguagePicker } from "../i18n/LanguagePicker";
import { setRegistered } from "../auth/authState";
import { C } from "../tutor/tutorData";
import { consumeSeekerProfileDirty, hydrateSeekerAboutFromMe, schoolLevelFromMe } from "../onboarding/seekerProfile";
import { getMe, logout, type MeResponse } from "../../lib/api";

// Backend enums → English labels (this shell isn't wired into i18n yet).
const GENDER_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
  lgbt: "LGBTQ+",
  prefer_not_to_say: "Rather not say",
  other: "Rather not say",
};
const LEVEL_LABEL: Record<string, string> = {
  kindergarten: "Kindergarten",
  primary: "Primary",
  middle: "Middle School",
  high: "High School",
  university: "University",
  adult: "Adult / Pro",
};

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
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getMe()
      .then(setMe)
      .catch(() => setMe(null)) // no session / offline → neutral fallback, no fake data
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  // Returning from an "Edit profile" save marks the profile dirty — refetch.
  useFocusEffect(
    useCallback(() => {
      if (consumeSeekerProfileDirty()) load();
    }, [load]),
  );

  const profile = me?.profile;
  const role: "student" | "parent" = profile?.role === "parent" ? "parent" : "student";
  const roleLabel = role === "parent" ? "Parent" : "Student";
  const name = (profile?.full_name || profile?.display_name || "").trim();
  const avatarUrl = typeof profile?.avatar_url === "string" ? profile.avatar_url : "";
  const bio = typeof profile?.bio === "string" ? profile.bio.trim() : "";
  const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";
  const gender = typeof profile?.gender === "string" ? profile.gender : "";
  const schoolLevel = me ? schoolLevelFromMe(me) ?? "" : "";
  const hasDetails = !!phone || (role === "student" && !!LEVEL_LABEL[schoolLevel]) || !!GENDER_LABEL[gender];

  const onEdit = () => {
    if (!me) return;
    // Pre-seed the onboarding store from the real profile so SeekerAbout (edit
    // mode) opens showing current values, then route in.
    hydrateSeekerAboutFromMe(me);
    router.push({ pathname: "/onboarding/SeekerAbout", params: { role, mode: "edit" } });
  };

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
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.idAvatarImg} />
            ) : (
              <Ionicons name="person" size={30} color="#fff" />
            )}
          </View>
          {loading && !me ? (
            <ActivityIndicator color={C.green} style={{ marginTop: 4 }} />
          ) : (
            <>
              <Text style={styles.idName}>{name || "Your account"}</Text>
              <Text style={styles.idRole}>{me ? roleLabel : "Student / parent"}</Text>
              {bio ? <Text style={styles.idBio}>{bio}</Text> : null}
            </>
          )}
        </View>

        {me ? (
          <>
            <Text style={styles.sectionLabel}>Profile</Text>
            <View style={styles.group}>
              <Row icon="create-outline" label="Edit profile" sub="Name, photo, bio, phone" onPress={onEdit} />
              {hasDetails ? <View style={styles.divider} /> : null}
              {phone ? <Row icon="call-outline" label="Phone" sub={phone} /> : null}
              {role === "student" && LEVEL_LABEL[schoolLevel] ? (
                <Row icon="school-outline" label="Education level" sub={LEVEL_LABEL[schoolLevel]} />
              ) : null}
              {GENDER_LABEL[gender] ? <Row icon="person-outline" label="Gender" sub={GENDER_LABEL[gender]} /> : null}
            </View>
          </>
        ) : null}

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
    paddingHorizontal: 20,
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
    overflow: "hidden",
  },
  idAvatarImg: { width: 72, height: 72, borderRadius: 36 },
  idName: { fontSize: 18, fontWeight: "800", color: C.ink },
  idRole: { fontSize: 13.5, color: C.muted, marginTop: 3 },
  idBio: { fontSize: 14, color: C.ink, marginTop: 10, lineHeight: 20, textAlign: "center" },
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
