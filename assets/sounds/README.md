# Sound effects

Drop the UI sound clips here, then I'll wire them on (uncomment the matching
lines in `components/ui/sound.ts`). Any of `.mp3` / `.m4a` / `.wav` / `.caf`
work — keep them short (a few hundred ms) and soft.

Expected files (rename yours to these, or tell me your names):

| File          | Plays on                                                        |
| ------------- | --------------------------------------------------------------- |
| `tap.mp3`     | Primary button taps (Continue / Publish / Save / pill buttons)  |
| `like.mp3`    | The like / heart pop on a post                                  |
| `success.mp3` | A save / post / publish succeeded (with the success haptic)     |
| `error.mp3`   | A save / post / publish failed (with the error haptic)          |
| `pop.mp3`     | Each icon landing in the onboarding category / subject cascade  |

`expo-audio` is already in the dev build, so no EAS rebuild is needed — once the
files are here and wired, the sounds play over the Metro QR.
