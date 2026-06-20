import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DISTRICT_ZH, REGIONS, districtKey, type RegionId } from "./hkDistricts";

/**
 * Region tabs + a grid of district circles. A controlled component: the chosen
 * districts live in the parent (`value`, an array of "<regionId>:<District>"
 * keys) and changes flow back through `onChange`. Selections persist across
 * region tabs, so a tutor / seeker can pick districts in several regions at once.
 *
 * Shared by the student/parent preference screen (PreferencesScreen) and the
 * tutor's per-subject location picker (TutorSD). Only the active tab is internal
 * UI state — it seeds from whatever region the first chosen district is in.
 */
export function DistrictPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [activeRegion, setActiveRegion] = useState<RegionId>(() => {
    const first = value[0];
    return first ? (first.split(":")[0] as RegionId) : REGIONS[0].id;
  });
  const activeRegionObj = REGIONS.find((r) => r.id === activeRegion) ?? REGIONS[0];

  const countForRegion = (regionId: RegionId) =>
    value.filter((k) => k.startsWith(`${regionId}:`)).length;
  const toggle = (regionId: RegionId, d: string) => {
    const k = districtKey(regionId, d);
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  };

  return (
    <>
      <View style={styles.segment}>
        {REGIONS.map((r) => {
          const on = activeRegion === r.id;
          const count = countForRegion(r.id);
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.segmentTab, on && styles.segmentTabOn]}
              onPress={() => setActiveRegion(r.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${r.label}${count > 0 ? `, ${count} selected` : ""}`}
            >
              <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{r.label}</Text>
              {count > 0 ? (
                <View style={styles.regionBadge}>
                  <Text style={styles.regionBadgeText}>{count}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.districtGrid}>
        {activeRegionObj.districts.map((d) => {
          const on = value.includes(districtKey(activeRegionObj.id, d));
          return (
            <TouchableOpacity
              key={d}
              style={styles.districtItem}
              onPress={() => toggle(activeRegionObj.id, d)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={d}
              accessibilityState={{ selected: on }}
            >
              <View
                style={[
                  styles.districtCircle,
                  on ? styles.districtCircleOn : styles.districtCircleOff,
                ]}
              >
                <Text style={[styles.districtChar, { color: on ? "#FFFFFF" : "#111827" }]}>
                  {DISTRICT_ZH[d] ?? d[0]}
                </Text>
              </View>
              <Text style={[styles.districtLabel, on && styles.districtLabelOn]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderRadius: 12,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  segmentTabOn: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  segmentTextOn: { color: "#111827", fontWeight: "700" },
  regionBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  regionBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  districtGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 18,
    marginTop: 18,
  },
  districtItem: { width: "25%", alignItems: "center" },
  districtCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  districtCircleOff: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" },
  districtCircleOn: {
    backgroundColor: "#2D6A4F",
    borderColor: "#2D6A4F",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  districtChar: { fontSize: 21, fontWeight: "700", lineHeight: 24 },
  districtLabel: {
    marginTop: 7,
    fontSize: 10,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  districtLabelOn: { color: "#2D6A4F", fontWeight: "700" },
});
