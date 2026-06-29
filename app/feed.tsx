/**
 * Seeker (student/parent) app shell — the home a student/parent lands on after
 * onboarding (and where the welcome-screen / login routes them).
 *
 * Mirrors the tutor shell (`app/tutor-home.tsx`): one stateful controller with a
 * custom bottom tab bar switching five tabs — Home (Instagram-style post feed) /
 * Search (+ Quick Match) / Chat / Saved / Account. Tapping any tutor opens the public
 * profile route `app/tutors/[slug].tsx` (a real, shareable URL), so the tab bar
 * hides while viewing a profile and returns on back.
 *
 * Front-end only, sample data, English-only (see CLAUDE.md). Likes are local
 * session state; saved tutors live in the shared `savedTutors` store so the
 * Saved tab and the profile route stay in sync.
 */
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatList } from "../components/chat/ChatList";
import { MatchBanner } from "../components/match/MatchBanner";
import { hydrateSeekerContact, resolveSeekerContact, useSeekerContact } from "../components/match/seekerContact";
import { hydrateSaved, useSavedTutors } from "../components/seeker/savedTutors";
import { SeekerAccountScreen } from "../components/seeker/SeekerAccountScreen";
import { SeekerFeedScreen } from "../components/seeker/SeekerFeedScreen";
import { SeekerSavedScreen } from "../components/seeker/SeekerSavedScreen";
import { SeekerSearchScreen } from "../components/seeker/SeekerSearchScreen";
import { SeekerTabBar, type SeekerTabId } from "../components/seeker/SeekerTabBar";
import { C, TH } from "../components/tutor/tutorData";

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
  // Home is still a sample-data feed, so its Save button uses a local set —
  // saving a sample tutor to the real backend would 404. Search + Saved (and the
  // public profile route) use the backend-backed store below.
  const [homeSaved, setHomeSaved] = useState<Set<string>>(() => new Set());
  const { ids: saved, toggle: toggleSaved } = useSavedTutors();
  const seekerPending = useSeekerContact();

  // Load the seeker's real bookmarks + any pending contact once on mount.
  useEffect(() => {
    void hydrateSaved();
    void hydrateSeekerContact();
  }, []);

  const openProfile = (id: string) => router.push(`/tutors/${id}` as Href);
  const onLike = (id: string) => setLikes((s) => toggle(s, id));
  const toggleHomeSaved = (id: string) => setHomeSaved((s) => toggle(s, id));

  let screen;
  if (tab === "home") {
    screen = (
      <SeekerFeedScreen
        likes={likes}
        saved={homeSaved}
        onLike={onLike}
        onToggleSave={toggleHomeSaved}
        onOpenProfile={openProfile}
        onGoSearch={() => setTab("search")}
      />
    );
  } else if (tab === "search") {
    screen = <SeekerSearchScreen saved={saved} onToggleSave={toggleSaved} onOpenProfile={openProfile} />;
  } else if (tab === "chat") {
    screen = (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 10 }}>
          <Text style={{ fontSize: 26, fontWeight: "800", letterSpacing: -0.6, color: C.ink }}>Messages</Text>
          <Text style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>Your conversations with tutors</Text>
        </View>
        <ChatList
          onOpen={(c) =>
            router.push({
              pathname: "/messages/[id]",
              params: {
                id: c.id,
                name: c.other_participant?.display_name ?? "LearnSum user",
                otherId: c.other_participant?.id ?? "",
              },
            })
          }
        />
      </View>
    );
  } else if (tab === "saved") {
    screen = <SeekerSavedScreen saved={saved} onToggleSave={toggleSaved} onOpenProfile={openProfile} />;
  } else {
    screen = <SeekerAccountScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, backgroundColor: tab === "home" ? TH.pageBg : "#fff", paddingTop: insets.top }}>
        {(tab === "home" || tab === "chat") && seekerPending ? (
          <MatchBanner
            name={seekerPending.tutorName}
            onYes={() => resolveSeekerContact(true)}
            onNo={() => resolveSeekerContact(false)}
          />
        ) : null}
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
