/**
 * Seeker (student/parent) app shell — the home a student/parent lands on after
 * onboarding (and where the welcome-screen / login routes them).
 *
 * Mirrors the tutor shell (`app/tutor-home.tsx`): one stateful controller with a
 * custom bottom tab bar switching four tabs — Home (Instagram-style post feed) /
 * Search (+ Quick Match) / Saved / Account. Tapping any tutor opens the public
 * profile route `app/tutors/[slug].tsx` (a real, shareable URL), so the tab bar
 * hides while viewing a profile and returns on back.
 *
 * Front-end only, sample data, English-only (see CLAUDE.md). Likes are local
 * session state; saved tutors live in the shared `savedTutors` store so the
 * Saved tab and the profile route stay in sync.
 */
import { router, type Href } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { useSavedTutors } from "../components/seeker/savedTutors";
import { SeekerAccountScreen } from "../components/seeker/SeekerAccountScreen";
import { SeekerFeedScreen } from "../components/seeker/SeekerFeedScreen";
import { SeekerSavedScreen } from "../components/seeker/SeekerSavedScreen";
import { SeekerSearchScreen } from "../components/seeker/SeekerSearchScreen";
import { SeekerTabBar, type SeekerTabId } from "../components/seeker/SeekerTabBar";
import { TH } from "../components/tutor/tutorData";

function toggle(set: Set<string>, id: string): Set<string> {
  const n = new Set(set);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  return n;
}

function SeekerShell() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<SeekerTabId>("home");
  const [likes, setLikes] = useState<Set<string>>(() => new Set(["chloe"]));
  const { ids: saved, toggle: toggleSaved } = useSavedTutors();

  const openProfile = (id: string) => router.push(`/tutors/${id}` as Href);
  const onLike = (id: string) => setLikes((s) => toggle(s, id));

  let screen;
  if (tab === "home") {
    screen = (
      <SeekerFeedScreen
        likes={likes}
        saved={saved}
        onLike={onLike}
        onToggleSave={toggleSaved}
        onOpenProfile={openProfile}
        onGoSearch={() => setTab("search")}
      />
    );
  } else if (tab === "search") {
    screen = <SeekerSearchScreen saved={saved} onToggleSave={toggleSaved} onOpenProfile={openProfile} />;
  } else if (tab === "saved") {
    screen = <SeekerSavedScreen saved={saved} onToggleSave={toggleSaved} onOpenProfile={openProfile} />;
  } else {
    screen = <SeekerAccountScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, backgroundColor: tab === "home" ? TH.pageBg : "#fff", paddingTop: insets.top }}>
        {screen}
      </View>
      <SeekerTabBar tab={tab} onSelect={setTab} savedCount={saved.size} bottomInset={insets.bottom} />
    </View>
  );
}

export default function Feed() {
  return (
    <SafeAreaProvider>
      <SeekerShell />
    </SafeAreaProvider>
  );
}
