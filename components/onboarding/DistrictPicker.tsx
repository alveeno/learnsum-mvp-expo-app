import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { SelectableCircle } from "../ui/SelectableCircle";
import { playTap } from "../ui/sound";
import {
  REGIONS,
  regionIdOfSub,
  subSlugsOfDistrict,
  subSlugsOfRegion,
  type District,
  type RegionId,
} from "./hkDistricts";

/**
 * Region tabs → district circles (larger) that **expand** into subdistrict circles
 * (smaller). A controlled component: the chosen **subdistrict slugs** live in the
 * parent (`value`) and changes flow back through `onChange`. Selections persist
 * across regions and across which district is open, so a tutor / seeker can pick
 * subdistricts anywhere.
 *
 * Shared by the student/parent preference screen (PreferencesScreen) and the
 * tutor's per-subject location picker (TutorSD). Tapping a district only expands
 * it; selection happens at the subdistrict level (or via "Select all", which picks
 * every subdistrict in the open district). Circles reuse `SelectableCircle`, so
 * they get the same cascade entrance + "pop" on appear / "tap" on select, played
 * through the low-latency sound pool.
 */
const CASCADE_STAGGER = 55;
const PRIMARY = "#2D6A4F";
const DISTRICT_SIZE = 72;
const SUB_SIZE = 52;

export function DistrictPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [activeRegion, setActiveRegion] = useState<RegionId>(() => {
    const first = value.find((s) => regionIdOfSub(s));
    return first ? (regionIdOfSub(first) as RegionId) : REGIONS[0].id;
  });
  const [openDistrict, setOpenDistrict] = useState<string | null>(null);

  const activeRegionObj = REGIONS.find((r) => r.id === activeRegion) ?? REGIONS[0];
  const openObj = activeRegionObj.districts.find((d) => d.name === openDistrict) ?? null;

  const countForRegion = (regionId: RegionId) =>
    value.filter((s) => regionIdOfSub(s) === regionId).length;
  const countForDistrict = (d: District) =>
    d.subs.reduce((n, s) => n + (value.includes(s.slug) ? 1 : 0), 0);

  const toggleSub = (slug: string) =>
    onChange(value.includes(slug) ? value.filter((x) => x !== slug) : [...value, slug]);

  const allSelectedInOpen = openObj ? openObj.subs.every((s) => value.includes(s.slug)) : false;
  const toggleSelectAll = () => {
    if (!openObj) return;
    playTap();
    const slugs = subSlugsOfDistrict(openObj);
    if (allSelectedInOpen) {
      const remove = new Set(slugs);
      onChange(value.filter((x) => !remove.has(x)));
    } else {
      const have = new Set(value);
      onChange([...value, ...slugs.filter((s) => !have.has(s))]);
    }
  };

  // Select / clear every subdistrict across the whole active region ("area").
  const regionSlugs = subSlugsOfRegion(activeRegionObj);
  const allSelectedInRegion = regionSlugs.every((s) => value.includes(s));
  const toggleSelectAllRegion = () => {
    playTap();
    if (allSelectedInRegion) {
      const remove = new Set(regionSlugs);
      onChange(value.filter((x) => !remove.has(x)));
    } else {
      const have = new Set(value);
      onChange([...value, ...regionSlugs.filter((s) => !have.has(s))]);
    }
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
              onPress={() => {
                setActiveRegion(r.id);
                setOpenDistrict(null);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${r.fullLabel}${count > 0 ? `, ${count} selected` : ""}`}
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

      {/* Per-area "select all districts" — every subdistrict in the active region. */}
      <View style={styles.regionActionRow}>
        <TouchableOpacity
          style={styles.selectAllBtn}
          onPress={toggleSelectAllRegion}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={
            allSelectedInRegion
              ? `Clear all districts in ${activeRegionObj.fullLabel}`
              : `Select all districts in ${activeRegionObj.fullLabel}`
          }
        >
          <Text style={styles.selectAllText}>
            {allSelectedInRegion ? "Clear all districts" : "Select all districts"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* District circles (larger). Tapping one expands its subdistricts below. */}
      <View style={styles.districtGrid}>
        {activeRegionObj.districts.map((d, i) => {
          const count = countForDistrict(d);
          const open = openDistrict === d.name;
          return (
            <SelectableCircle
              key={d.name}
              style={styles.gridItem}
              size={DISTRICT_SIZE}
              label={d.name}
              labelStyle={styles.districtLabel}
              selected={count > 0}
              color={PRIMARY}
              badge={count}
              badgeColor={PRIMARY}
              entranceDelay={i * CASCADE_STAGGER}
              onPress={() => setOpenDistrict((cur) => (cur === d.name ? null : d.name))}
              accessibilityLabel={`${d.name}${count > 0 ? `, ${count} selected` : ""}${open ? ", expanded" : ""}`}
              renderIcon={({ size, color }) => (
                <Text style={{ fontSize: size, fontWeight: "700", color, lineHeight: size * 1.12 }}>
                  {d.zh}
                </Text>
              )}
            />
          );
        })}
      </View>

      {/* Subdistricts of the open district (smaller). Cascade in on expand. */}
      {openObj ? (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>{openObj.name}</Text>
            <TouchableOpacity
              style={styles.selectAllBtn}
              onPress={toggleSelectAll}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={allSelectedInOpen ? `Clear all in ${openObj.name}` : `Select all in ${openObj.name}`}
            >
              <Text style={styles.selectAllText}>{allSelectedInOpen ? "Clear all" : "Select all"}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subGrid}>
            {openObj.subs.map((s, i) => (
              <SelectableCircle
                key={s.slug}
                style={styles.gridItem}
                size={SUB_SIZE}
                label={s.name}
                labelStyle={styles.subLabel}
                selected={value.includes(s.slug)}
                color={PRIMARY}
                entranceDelay={i * CASCADE_STAGGER}
                onPress={() => toggleSub(s.slug)}
                accessibilityLabel={s.name}
                renderIcon={({ size, color }) => (
                  <Text style={{ fontSize: size, fontWeight: "700", color, lineHeight: size * 1.12 }}>
                    {s.zh}
                  </Text>
                )}
              />
            ))}
          </View>
        </View>
      ) : null}
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
  regionActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  districtGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 18,
    marginTop: 18,
  },
  gridItem: { width: "25%", alignItems: "center" },
  districtLabel: { marginTop: 8, fontSize: 11, fontWeight: "600", color: "#374151" },
  panel: {
    marginTop: 18,
    backgroundColor: "#F9F9F7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: "#EEEEEC",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  panelTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  selectAllBtn: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
  },
  selectAllText: { fontSize: 13, fontWeight: "700", color: "#2D6A4F" },
  subGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
    marginTop: 10,
  },
  subLabel: { marginTop: 6, fontSize: 10, fontWeight: "500", color: "#6B7280" },
});
