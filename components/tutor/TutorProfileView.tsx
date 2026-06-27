/**
 * Tutor app — viewing ANOTHER tutor's profile (overlay).
 *
 * Opened from the feed, search results, and the suggestions strip; replaces the
 * tab content while the bottom tab bar stays visible. The header + bio/feed body +
 * WhatsApp/WeChat contact + the in-app **Message** button live in the shared
 * `TutorProfileContent` (also used by the public `app/tutors/[slug].tsx` route);
 * this overlay just supplies the Connect action row.
 */
import { View } from "react-native";

import { FollowBtn } from "./feedUi";
import { TutorProfileContent } from "./TutorProfileContent";

export function TutorProfileView({
  id,
  connected,
  onConnect,
  onBack,
}: {
  /** Tutor slug (real) or a sample tutor id (falls back to sample data). */
  id: string;
  connected: boolean;
  onConnect: () => void;
  onBack: () => void;
}) {
  return (
    <TutorProfileContent
      id={id}
      onBack={onBack}
      actions={
        <View style={{ marginTop: 12 }}>
          <FollowBtn following={connected} onToggle={onConnect} />
        </View>
      }
    />
  );
}
