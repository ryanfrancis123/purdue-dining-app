import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ACTIVITY_LEVEL_OPTIONS,
  NUTRITION_GOAL_OPTIONS,
} from "../src/constants/profileOptions";
import type { ActivityLevel, NutritionGoal, NutritionProfile, Sex } from "../src/types/profile";

function formatProfileLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const SEX_OPTIONS: { label: string; value: Sex }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [ageInput, setAgeInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [weightInput, setWeightInput] = useState("");

  const [sex, setSex] = useState<Sex>("prefer_not_to_say");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<NutritionGoal>("maintain");

  const [savedProfile, setSavedProfile] = useState<NutritionProfile | null>(null);

  const handleSaveProfile = () => {
    const profile: NutritionProfile = {
      age: ageInput.trim() === "" ? null : Number(ageInput),
      heightCm: heightInput.trim() === "" ? null : Number(heightInput),
      weightKg: weightInput.trim() === "" ? null : Number(weightInput),
      sex,
      activityLevel,
      goal,
    };

    setSavedProfile(profile);
  };

  return (
    <View style={styles.safeArea}>
      <Pressable
        style={[styles.floatingBackButton, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <BlurView intensity={55} tint="light" style={styles.backButtonBlur}>
          <Text style={styles.floatingBackButtonText}>‹</Text>
        </BlurView>
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 76 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Nutrition Profile</Text>
          <Text style={styles.subtitle}>
            This profile is optional. Later, it will help the app suggest daily
            and per-meal nutrition targets.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Details</Text>
            <Text style={styles.bodyText}>
              Enter only what you want. The app stays usable without a profile.
            </Text>
          </View>

          <View style={styles.inputGrid}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={ageInput}
                onChangeText={setAgeInput}
                keyboardType="numeric"
                placeholder="18"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={heightInput}
                onChangeText={setHeightInput}
                keyboardType="numeric"
                placeholder="175"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="numeric"
                placeholder="70"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Sex</Text>
          <View style={styles.filterRow}>
            {SEX_OPTIONS.map((option) => {
              const isSelected = sex === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.filterButton,
                    isSelected && styles.activeFilterButton,
                  ]}
                  onPress={() => setSex(option.value)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      isSelected && styles.activeFilterButtonText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Activity Level</Text>
          <View style={styles.filterRow}>
            {ACTIVITY_LEVEL_OPTIONS.map((option) => {
              const isSelected = activityLevel === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.filterButton,
                    isSelected && styles.activeFilterButton,
                  ]}
                  onPress={() => setActivityLevel(option.value)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      isSelected && styles.activeFilterButtonText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Goal</Text>
          <View style={styles.filterRow}>
            {NUTRITION_GOAL_OPTIONS.map((option) => {
              const isSelected = goal === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.filterButton,
                    isSelected && styles.activeFilterButton,
                  ]}
                  onPress={() => setGoal(option.value)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      isSelected && styles.activeFilterButtonText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </Pressable>

        {savedProfile && (
          <View style={styles.savedNotice}>
            <Text style={styles.savedNoticeTitle}>Profile saved locally</Text>
            <Text style={styles.savedNoticeText}>
              Goal: {formatProfileLabel(savedProfile.goal)} · Activity:{" "}
              {formatProfileLabel(savedProfile.activityLevel)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  container: {
    flexGrow: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: "#555",
  },

  inputSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },

  sectionHeader: {
    marginBottom: 2,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },

  bodyText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 16,
  },

  inputGrid: {
    gap: 14,
  },

  inputGroup: {
    marginBottom: 0,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#111827",
  },

  filterSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },

  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },

  activeFilterButton: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  activeFilterButtonText: {
    color: "#fff",
  },

  saveButton: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  savedNotice: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    marginBottom: 14,
  },

  savedNoticeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },

  savedNoticeText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },

  floatingBackButton: {
    position: "absolute",
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },

  backButtonBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },

  floatingBackButtonText: {
    fontSize: 38,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 40,
    marginTop: -3,
  },
});
