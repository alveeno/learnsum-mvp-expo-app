import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "../components/ui/Button";
import { KeyboardAvoider } from "../components/ui/KeyboardAvoider";
import { markPostsDirty } from "../components/tutor/TutorPosts";
import { mapMeToProfileBody } from "../components/tutor/profileMapping";
import { ApiError, createPost, getMe, type PostType } from "../lib/api";

/**
 * Compose a new tutor post (text-only for now — image upload needs a native
 * picker → EAS rebuild, deferred). Opened from the Home feed "+" and the Posts
 * section on the Profile tab. Resolves the caller's own tutor slug from
 * GET /api/auth/me, POSTs to /api/tutors/[slug]/posts, then flags the profile's
 * posts list to refetch and returns.
 *
 * English-only, matching the rest of /tutor-home.
 */

const TYPES: { key: PostType; label: string; hint: string }[] = [
  { key: "update", label: "Update", hint: "A general update or tip" },
  { key: "showcase", label: "Showcase", hint: "Your work or teaching" },
  { key: "result", label: "Result", hint: "A student's achievement" },
];

const MAX = 2000;

export default function PostNew() {
  const [slug, setSlug] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("update");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve the tutor's own slug (where the post is created).
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        const { slug: s } = mapMeToProfileBody(me);
        if (s) setSlug(s);
        else setLoadErr("Finish setting up your profile before posting.");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadErr(
          err instanceof ApiError && err.isNetworkError
            ? "Can't reach the server. Check your connection and try again."
            : "You need to be signed in to post.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = !!slug && content.trim().length > 0 && !submitting;

  const submit = async () => {
    if (!ready || !slug) return;
    setError(null);
    setSubmitting(true);
    try {
      await createPost(slug, { content: content.trim(), post_type: type });
      markPostsDirty();
      router.back();
    } catch (err) {
      // Offline demo: pretend it posted so the flow completes (no real backend).
      if (err instanceof ApiError && err.isNetworkError && __DEV__) {
        markPostsDirty();
        router.back();
        return;
      }
      setError(
        err instanceof ApiError && !err.isNetworkError
          ? err.message
          : "Couldn't post. Check your connection and try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoider>
        <View style={styles.headerRow}>
          <Pressable hitSlop={8} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={26} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>New post</Text>
          <View style={{ width: 26 }} />
        </View>

        {loadErr ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={32} color="#9CA3AF" />
            <Text style={styles.loadErrText}>{loadErr}</Text>
            <Button label="Go back" variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }} />
          </View>
        ) : !slug ? (
          <View style={styles.center}>
            <ActivityIndicator color="#2D6A4F" />
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {TYPES.map((tOpt) => {
                  const on = type === tOpt.key;
                  return (
                    <TouchableOpacity
                      key={tOpt.key}
                      style={[styles.typeChip, on && styles.typeChipOn]}
                      onPress={() => setType(tOpt.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.typeText, on && styles.typeTextOn]}>{tOpt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.typeHint}>{TYPES.find((x) => x.key === type)?.hint}</Text>

              <Text style={[styles.label, { marginTop: 22 }]}>What&apos;s on your mind?</Text>
              <TextInput
                style={styles.input}
                value={content}
                onChangeText={(text) => {
                  if (text.length <= MAX) setContent(text);
                  if (error) setError(null);
                }}
                placeholder="Share an update, a student result, or your teaching…"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                autoFocus
              />
              <Text style={styles.counter}>
                {content.length}/{MAX}
              </Text>

              <View style={styles.photoNote}>
                <Ionicons name="image-outline" size={16} color="#9CA3AF" />
                <Text style={styles.photoNoteText}>Photos are coming soon.</Text>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Button label={submitting ? "Posting…" : "Post"} variant="primary" disabled={!ready} onPress={submit} />
            </View>
          </>
        )}
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const HAIRLINE = "rgba(60,60,67,0.12)";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ECECEC",
  },
  headerTitle: { fontSize: 16.5, fontWeight: "800", color: "#16201C" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  loadErrText: { fontSize: 14.5, color: "#6B7280", textAlign: "center", lineHeight: 21 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
  label: { fontSize: 13.5, fontWeight: "700", color: "#16201C", marginBottom: 10 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: HAIRLINE,
    backgroundColor: "#F9F9F7",
    alignItems: "center",
    justifyContent: "center",
  },
  typeChipOn: { backgroundColor: "#2D6A4F", borderColor: "#2D6A4F" },
  typeText: { fontSize: 14.5, fontWeight: "700", color: "#16201C" },
  typeTextOn: { color: "#FFFFFF" },
  typeHint: { fontSize: 12.5, color: "#6B7280", marginTop: 8 },
  input: {
    minHeight: 150,
    borderWidth: 1.5,
    borderColor: HAIRLINE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#16201C",
    backgroundColor: "#F9F9F7",
  },
  counter: { alignSelf: "flex-end", fontSize: 12, color: "#9CA3AF", marginTop: 6 },
  photoNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 },
  photoNoteText: { fontSize: 12.5, color: "#9CA3AF" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },
  errorText: { color: "#E63946", fontSize: 13, lineHeight: 18, textAlign: "center", marginBottom: 8 },
});
