/**
 * Tutor app shell — the 5-tab experience a tutor lands on after onboarding.
 *
 * Mirrors the Claude Design source's `TutorApp` controller: a single stateful
 * shell that switches between Home / Search / Chat / Analytics / Profile and
 * shares Like / Connect / Premium state across tabs. Viewing another tutor's
 * profile replaces the tab content while the bottom tab bar stays visible.
 *
 * Editorial look, English-only text (see CLAUDE.md). Tutors reach this by picking
 * "Tutor" on the welcome screen; the "set up your profile" banner (home) and gate
 * (profile) start — or resume — onboarding, and hide once every step is done.
 */
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { isRegistered, setRegistered as persistRegistered } from "../components/auth/authState";
import { isOnboardingComplete, startTutorSetup } from "../components/onboarding/tutorOnboarding";
import { AnalyticsScreen } from "../components/tutor/AnalyticsScreen";
import { ChatScreen } from "../components/tutor/ChatScreen";
import { FeedScreen } from "../components/tutor/FeedScreen";
import { ProfileScreen } from "../components/tutor/ProfileScreen";
import { SearchScreen } from "../components/tutor/SearchScreen";
import { TabBar, type TabId } from "../components/tutor/TabBar";
import { TutorProfileView } from "../components/tutor/TutorProfileView";
import { CHATS, TH, TUTORS } from "../components/tutor/tutorData";

function toggle(set: Set<string>, id: string): Set<string> {
  const n = new Set(set);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  return n;
}

/* __DEV__-only pill to flip the mock "registered" state without walking the
   whole sign-up flow — for demoing the gated vs ungated experience. Never
   rendered in production builds. */
function DevAuthToggle({ registered, onToggle }: { registered: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={devStyles.pill} accessibilityRole="button">
      <Ionicons name={registered ? "lock-open" : "lock-closed"} size={13} color="#fff" />
      <Text style={devStyles.text}>DEV · {registered ? "Logged in" : "Logged out"}</Text>
    </Pressable>
  );
}

function TutorShell() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>("home");
  const [overlay, setOverlay] = useState<string | null>(null); // id of the tutor being viewed
  const [likes, setLikes] = useState<Set<string>>(() => new Set(["chloe"]));
  const [connected, setConnected] = useState<Set<string>>(
    () => new Set(TUTORS.filter((t) => t.following).map((t) => t.id)),
  );
  const [premium, setPremium] = useState(false);

  // Whether the "set up your profile" banner + gate should show, and whether the
  // user is registered. Both re-checked when /tutor-home regains focus (e.g.
  // returning from onboarding / the auth gate), since the in-memory store
  // doesn't notify subscribers.
  const [setupDone, setSetupDone] = useState(isOnboardingComplete);
  const [registered, setRegistered] = useState(isRegistered);
  useFocusEffect(
    useCallback(() => {
      setSetupDone(isOnboardingComplete());
      setRegistered(isRegistered());
    }, []),
  );

  // Unregistered taps on engagement actions route to the log-in / sign-up gate
  // instead of mutating state.
  const requireAuth = () => router.push("/auth/gate" as Href);

  // __DEV__ demo toggle: flip the mock registered flag (store + local state).
  const toggleDevAuth = () => {
    const next = !registered;
    persistRegistered(next);
    setRegistered(next);
  };

  const onLike = (id: string) => {
    if (!registered) return requireAuth();
    setLikes((s) => toggle(s, id));
  };
  const onConnect = (id: string) => {
    if (!registered) return requireAuth();
    setConnected((s) => toggle(s, id));
  };
  const openProfile = (id: string) => {
    if (id && id !== "me") setOverlay(id);
  };
  const goTab = (id: TabId) => {
    setOverlay(null);
    setTab(id);
  };

  const unread = CHATS.filter((c) => c.unread > 0).length;

  let screen;
  if (tab === "home") {
    screen = (
      <FeedScreen
        likes={likes}
        connected={connected}
        onLike={onLike}
        onConnect={onConnect}
        onOpenProfile={openProfile}
        onCreatePost={() => (registered ? router.push("/post-new" as Href) : requireAuth())}
        showSetup={!setupDone}
        onSetup={startTutorSetup}
        registered={registered}
        onRequireAuth={requireAuth}
      />
    );
  } else if (tab === "search") {
    screen = (
      <SearchScreen
        connected={connected}
        onConnect={onConnect}
        onOpenProfile={openProfile}
        registered={registered}
        onRequireAuth={requireAuth}
      />
    );
  } else if (tab === "chat") {
    screen = <ChatScreen />;
  } else if (tab === "analytics") {
    screen = <AnalyticsScreen premium={premium} onUpgrade={() => setPremium(true)} />;
  } else {
    screen = <ProfileScreen premium={premium} showSetup={!setupDone} onSetup={startTutorSetup} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Content area: home uses the tinted canvas, other tabs are white. The
          tutor-profile overlay covers the active tab while the tab bar stays. */}
      <View style={{ flex: 1, backgroundColor: tab === "home" ? TH.pageBg : "#fff", paddingTop: insets.top }}>
        {screen}
        {overlay && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff" }}>
            <TutorProfileView
              id={overlay}
              connected={connected.has(overlay)}
              onConnect={() => onConnect(overlay)}
              onBack={() => setOverlay(null)}
            />
          </View>
        )}
        {__DEV__ && <DevAuthToggle registered={registered} onToggle={toggleDevAuth} />}
      </View>
      <TabBar tab={tab} onSelect={goTab} unread={unread} premium={premium} bottomInset={insets.bottom} />
    </View>
  );
}

const devStyles = StyleSheet.create({
  pill: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.82)",
  },
  text: { color: "#fff", fontSize: 11.5, fontWeight: "700" },
});

export default function TutorHome() {
  return (
    <SafeAreaProvider>
      <TutorShell />
    </SafeAreaProvider>
  );
}
