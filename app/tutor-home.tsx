/**
 * Tutor app shell — the 5-tab experience a tutor lands on after onboarding.
 *
 * Mirrors the Claude Design source's `TutorApp` controller: a single stateful
 * shell that switches between Home / Search / Chat / Analytics / Profile and
 * shares Like / Connect / Premium state across tabs. Viewing another tutor's
 * profile replaces the tab content while the bottom tab bar stays visible.
 *
 * Editorial look, first-time state, English-only text (see CLAUDE.md). Reachable
 * at /tutor-home via the temporary "Tutor Home ›" link on the welcome screen —
 * remove both once the design review is done.
 */
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

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

function TutorShell() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>("home");
  const [overlay, setOverlay] = useState<string | null>(null); // id of the tutor being viewed
  const [likes, setLikes] = useState<Set<string>>(() => new Set(["chloe"]));
  const [connected, setConnected] = useState<Set<string>>(
    () => new Set(TUTORS.filter((t) => t.following).map((t) => t.id)),
  );
  const [premium, setPremium] = useState(false);

  const onLike = (id: string) => setLikes((s) => toggle(s, id));
  const onConnect = (id: string) => setConnected((s) => toggle(s, id));
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
      <FeedScreen likes={likes} connected={connected} onLike={onLike} onConnect={onConnect} onOpenProfile={openProfile} />
    );
  } else if (tab === "search") {
    screen = <SearchScreen connected={connected} onConnect={onConnect} onOpenProfile={openProfile} />;
  } else if (tab === "chat") {
    screen = <ChatScreen />;
  } else if (tab === "analytics") {
    screen = <AnalyticsScreen premium={premium} onUpgrade={() => setPremium(true)} />;
  } else {
    screen = <ProfileScreen premium={premium} />;
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
      </View>
      <TabBar tab={tab} onSelect={goTab} unread={unread} premium={premium} bottomInset={insets.bottom} />
    </View>
  );
}

export default function TutorHome() {
  return (
    <SafeAreaProvider>
      <TutorShell />
    </SafeAreaProvider>
  );
}
