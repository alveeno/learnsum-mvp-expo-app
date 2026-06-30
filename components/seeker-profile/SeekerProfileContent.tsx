/**
 * Seeker (parent / student) profile — what a TUTOR sees when they open a
 * parent/student from the profile-viewers list or their Saved tab.
 *
 * Shows the seeker's preferences (subjects, lesson format, districts, languages,
 * availability) and, for parents, the child's level + age. The seeker's
 * **contact details — phone, WhatsApp, WeChat and in-app chat — are LOCKED**
 * behind a daily quota: a tutor may unlock at most 3 seekers per day (permanent
 * once unlocked; resets daily — see `contactQuota.ts`). The phone number is never
 * shown before unlocking.
 *
 * English-only (mirrors the tutor shell), sample-data fallback (see CLAUDE.md).
 */
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../tutor/feedUi";
import { findSampleSeeker } from "../tutor/sampleSeekers";
import { isUnlocked as quotaIsUnlocked, unlockSeeker, useContactQuota } from "../tutor/contactQuota";
import { useSavedPeople, type SavedPerson } from "../tutor/savedPeople";
import { C } from "../tutor/tutorData";
import { addTutorMatch } from "../match/tutorMatch";
import { quotaForTier, useTier } from "../subscription/tierStore";
import { subdistrictsLabel } from "../onboarding/hkDistricts";
import { ConfirmModal } from "../ui/ConfirmModal";
import { SaveButton } from "../seeker/SaveButton";
import { copyText, notifySuccess, tapMedium } from "../ui/feedback";
import { getSeeker, startConversation, type Seeker } from "../../lib/api";

const FORMAT_LABEL: Record<string, string> = {
  in_person: "In person",
  online: "Online",
  both: "In person or online",
};
const LEVEL_LABEL: Record<string, string> = {
  kindergarten: "Kindergarten",
  primary: "Primary",
  middle: "Junior Secondary",
  high: "Senior Secondary",
  university: "University",
  adult: "Adult",
};

function subtitleForSeeker(s: Seeker): string {
  if (s.role === "parent" && s.child) {
    return [LEVEL_LABEL[s.child.level] ?? s.child.level, s.subjects[0]].filter(Boolean).join(" · ");
  }
  return s.subjects.join(", ");
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={17} color={C.green} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function SeekerProfileContent({ id, onBack }: { id: string; onBack: () => void }) {
  const [seeker, setSeeker] = useState<Seeker | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const { remaining, isUnlocked } = useContactQuota();
  const tier = useTier();
  const allowance = quotaForTier(tier);
  const { isSaved, toggle } = useSavedPeople();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSeeker(id)
      .then((s) => {
        if (!cancelled) setSeeker(s);
      })
      .catch(() => {
        // Offline / endpoint not built yet — fall back to sample data.
        if (!cancelled) setSeeker(findSampleSeeker(id) ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const unlocked = seeker ? isUnlocked(seeker.id) : false;

  const onUnlockPress = () => {
    if (!seeker) return;
    // Already used a quota on this seeker (or just unlocked) → buttons are live.
    if (quotaIsUnlocked(seeker.id)) return;
    if (allowance === 0) {
      router.push("/subscribe" as Href);
      return;
    }
    if (remaining <= 0) {
      Alert.alert(
        "No contacts left today",
        `You've used all ${allowance} of today's contacts. Your allowance resets tomorrow.`,
        [{ text: "OK" }],
      );
      return;
    }
    setConfirm(true);
  };

  const doUnlock = () => {
    if (!seeker) return;
    setConfirm(false);
    const wasUnlocked = quotaIsUnlocked(seeker.id);
    const ok = unlockSeeker(seeker.id);
    if (ok) {
      if (!wasUnlocked) addTutorMatch(seeker.id, seeker.name); // start the tutor's match question
      notifySuccess();
    } else {
      Alert.alert(
        "No contacts left today",
        `You've used all ${allowance} of today's contacts. Your allowance resets tomorrow.`,
        [{ text: "OK" }],
      );
    }
  };

  const openPhone = () => {
    const digits = seeker?.contact.phone?.replace(/[^\d+]/g, "");
    if (!digits) return;
    tapMedium();
    Linking.openURL(`tel:${digits}`).catch(() => {});
  };
  const openWhatsApp = () => {
    const digits = seeker?.contact.whatsapp?.replace(/\D/g, "");
    if (!digits) return;
    tapMedium();
    const subject = seeker?.subjects?.[0];
    const msg = `Hi, I'm a tutor on LearnSum and I'd love to help${subject ? ` with ${subject}` : ""}.`;
    Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`).catch(() => {});
  };
  const showWeChat = async () => {
    const wechat = seeker?.contact.wechat;
    if (!wechat) return;
    tapMedium();
    const ok = await copyText(wechat);
    if (ok) notifySuccess();
    Alert.alert(
      "WeChat",
      ok ? `Copied "${wechat}" — open WeChat and add this ID.` : `Add on WeChat:\n\n${wechat}`,
      [{ text: "Done" }],
    );
  };
  const onMessage = async () => {
    const accountId = seeker?.contact.account_id;
    tapMedium();
    if (!accountId) {
      Alert.alert("Messaging", "This is a sample contact — in-app chat opens once they have a LearnSum account.");
      return;
    }
    try {
      const { id: convId } = await startConversation(accountId);
      router.push({ pathname: "/messages/[id]", params: { id: convId, name: seeker?.name ?? "LearnSum user", otherId: accountId } });
    } catch {
      Alert.alert("Messaging", "Couldn't open the chat. Please try again.");
    }
  };

  const roleLabel = seeker?.role === "parent" ? "Parent" : "Student";

  return (
    <>
      <View style={styles.head}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Text style={styles.headTitle} numberOfLines={1}>
          {seeker?.name ?? "Profile"}
        </Text>
        {seeker ? (
          <SaveButton
            saved={isSaved(seeker.id)}
            onToggle={() =>
              toggle({
                id: seeker.id,
                kind: seeker.role,
                name: seeker.name,
                subtitle: subtitleForSeeker(seeker),
                avatar_url: seeker.avatar_url,
              } satisfies SavedPerson)
            }
          />
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && !seeker ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={C.green} />
          </View>
        ) : !seeker ? (
          <View style={styles.loadingWrap}>
            <Ionicons name="person-circle-outline" size={40} color={C.unselIc} />
            <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 10, color: C.muted }}>Couldn&apos;t load this profile</Text>
          </View>
        ) : (
          <>
            {/* Identity card */}
            <View style={styles.idCard}>
              <Avatar name={seeker.name} uri={seeker.avatar_url ?? undefined} size={72} />
              <Text style={styles.name}>{seeker.name}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name={seeker.role === "parent" ? "people" : "person"} size={13} color={C.greenD} />
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
            </View>

            {/* Minimal-card note when the seeker hid their personal info. */}
            {seeker.share_info === false ? (
              <View style={styles.privateNote}>
                <Ionicons name="lock-closed-outline" size={14} color={C.muted} />
                <Text style={styles.privateNoteText}>This person has kept their personal details private.</Text>
              </View>
            ) : null}

            {/* For parents: the child */}
            {seeker.role === "parent" && seeker.child ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Their child</Text>
                <InfoRow
                  icon="happy-outline"
                  label={seeker.child.name}
                  value={[
                    LEVEL_LABEL[seeker.child.level] ?? seeker.child.level,
                    seeker.child.age != null ? `Age ${seeker.child.age}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              </View>
            ) : null}

            {/* For students: their own level + age */}
            {seeker.role === "student" && (seeker.level || seeker.age != null) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Their details</Text>
                {seeker.level ? (
                  <InfoRow icon="school-outline" label="Education level" value={LEVEL_LABEL[seeker.level] ?? seeker.level} />
                ) : null}
                {seeker.age != null ? <InfoRow icon="calendar-outline" label="Age" value={String(seeker.age)} /> : null}
              </View>
            ) : null}

            {/* Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What they're looking for</Text>
              {seeker.subjects.length > 0 && (
                <InfoRow icon="book-outline" label="Subjects" value={seeker.subjects.join(", ")} />
              )}
              {seeker.format && (
                <InfoRow icon="laptop-outline" label="Lesson format" value={FORMAT_LABEL[seeker.format] ?? seeker.format} />
              )}
              {seeker.districts.length > 0 && (
                <InfoRow icon="location-outline" label="Districts" value={subdistrictsLabel(seeker.districts)} />
              )}
              {seeker.languages.length > 0 && (
                <InfoRow icon="chatbubbles-outline" label="Languages" value={seeker.languages.join(", ")} />
              )}
              {seeker.availability_note && (
                <InfoRow icon="time-outline" label="Availability" value={seeker.availability_note} />
              )}
            </View>

            {/* Contact — locked behind the daily quota */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              {unlocked ? (
                <View style={{ gap: 9 }}>
                  {seeker.contact.phone ? (
                    <Pressable style={[styles.contactBtn, styles.phoneBtn]} onPress={openPhone}>
                      <Ionicons name="call" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>{seeker.contact.phone}</Text>
                    </Pressable>
                  ) : null}
                  <View style={styles.contactRow}>
                    {seeker.contact.whatsapp ? (
                      <Pressable style={[styles.contactBtn, styles.whatsappBtn, { flex: 1 }]} onPress={openWhatsApp}>
                        <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                        <Text style={styles.contactBtnText}>WhatsApp</Text>
                      </Pressable>
                    ) : null}
                    {seeker.contact.wechat ? (
                      <Pressable style={[styles.contactBtn, styles.wechatBtn, { flex: 1 }]} onPress={showWeChat}>
                        <Ionicons name="logo-wechat" size={18} color="#fff" />
                        <Text style={styles.contactBtnText}>WeChat</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Pressable style={styles.messageBtn} onPress={onMessage}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                    <Text style={styles.messageBtnText}>Message in app</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.lockCard}>
                  <View style={styles.lockIcon}>
                    <Ionicons name={allowance === 0 ? "rocket" : "lock-closed"} size={22} color={C.goldD} />
                  </View>
                  <Text style={styles.lockTitle}>{allowance === 0 ? "Replying needs Premium" : "Contact is locked"}</Text>
                  <Text style={styles.lockBody}>
                    {allowance === 0
                      ? `Free tutors can't contact students. Upgrade to Premium (1/day) or Deluxe (3/day) to message ${seeker.name} and see their number.`
                      : `Unlock ${seeker.name}'s phone, WhatsApp, WeChat and in-app chat. You can contact ${allowance} new ${allowance === 1 ? "student" : "students"} a day.`}
                  </Text>
                  <Pressable
                    style={[styles.unlockBtn, allowance > 0 && remaining <= 0 && styles.unlockBtnOff]}
                    onPress={onUnlockPress}
                  >
                    <Ionicons name={allowance === 0 ? "rocket-outline" : "lock-open-outline"} size={18} color="#3a2c06" />
                    <Text style={styles.unlockText}>{allowance === 0 ? "Upgrade" : "Unlock contact"}</Text>
                  </Pressable>
                  <Text style={styles.remainText}>
                    {allowance === 0 ? "Use the tier switcher on your Profile tab to test" : `${remaining} of ${allowance} daily unlocks left`}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirm}
        title="Unlock contact?"
        message={`Use 1 of your ${allowance} daily contacts to unlock ${seeker?.name ?? "this person"}? This stays unlocked — re-contacting them later is free.`}
        confirmLabel="Unlock"
        cancelLabel="Not now"
        onConfirm={doUnlock}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 4, paddingRight: 10, paddingTop: 2, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: C.ink },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  loadingWrap: { paddingVertical: 64, alignItems: "center", justifyContent: "center" },

  idCard: { alignItems: "center", paddingVertical: 12, gap: 8 },
  name: { fontSize: 21, fontWeight: "800", color: C.ink, letterSpacing: -0.4 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.greenTint, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20 },
  roleText: { fontSize: 12.5, fontWeight: "800", color: C.greenD },

  section: { marginTop: 18 },
  sectionTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3, color: C.muted, textTransform: "uppercase", marginBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.hairline },
  infoIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.greenTint, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 12, color: C.muted, fontWeight: "600" },
  infoValue: { fontSize: 15, color: C.ink, fontWeight: "700", marginTop: 1 },

  lockCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: 18, padding: 18, alignItems: "center" },
  lockIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.goldTint, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  lockTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  lockBody: { fontSize: 13.5, lineHeight: 19, color: C.muted, textAlign: "center", marginTop: 6, marginBottom: 14 },
  unlockBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, alignSelf: "stretch", borderRadius: 24, backgroundColor: C.gold },
  unlockBtnOff: { opacity: 0.55 },
  unlockText: { fontSize: 16, fontWeight: "800", color: "#3a2c06" },
  remainText: { fontSize: 12.5, color: C.muted, fontWeight: "600", marginTop: 10 },

  contactRow: { flexDirection: "row", gap: 9 },
  contactBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 23, paddingHorizontal: 16 },
  contactBtnText: { fontSize: 14.5, fontWeight: "800", color: "#fff" },
  phoneBtn: { backgroundColor: C.green },
  whatsappBtn: { backgroundColor: "#25D366" },
  wechatBtn: { backgroundColor: "#09B83E" },
  messageBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 23, backgroundColor: C.ink },
  messageBtnText: { fontSize: 14.5, fontWeight: "800", color: "#fff" },
  privateNote: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline },
  privateNoteText: { flex: 1, fontSize: 12.5, color: C.muted, fontWeight: "600" },
});
