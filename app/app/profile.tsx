import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useState } from "react";

import {
  ACTIVITY_LEVEL_OPTIONS,
  NUTRITION_GOAL_OPTIONS,
} from "../src/constants/profileOptions";
import type { ActivityLevel, NutritionGoal, NutritionProfile, Sex } from "../src/types/profile";

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const [ageInput, setAgeInput] = useState("");
    const [heightInput, setHeightInput] = useState("");
    const [weightInput, setWeightInput] = useState("");

    const [sex, setSex] = useState<Sex>("prefer_not_to_say");
    const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("moderate");
    const [goal, setGoal] = useState<NutritionGoal>("maintain");

    const [savedProfile, setSavedProfile] = useState<NutritionProfile | null>(
    null
    );
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

        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Details</Text>

            <Text style={styles.bodyText}>
                Enter only what you want. This profile stays optional and will later help
                    suggest meal targets.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                    style={styles.input}
                    value={ageInput}
                    onChangeText={setAgeInput}
                    keyboardType="numeric"
                    placeholder="18"
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
                />
            </View>

            <Text style={styles.label}>Sex</Text>
            <View style={styles.optionGrid}>
                {[
                    { label: "Male", value: "male" as Sex },
                    { label: "Female", value: "female" as Sex },
                    { label: "Prefer not to say", value: "prefer_not_to_say" as Sex },
                ].map((option) => {
                    const isSelected = sex === option.value;

                    return (
                        <Pressable
                            key={option.value}
                            style={[
                                styles.optionButton,
                                isSelected && styles.optionButtonSelected,
                            ]}
                            onPress={() => setSex(option.value)}
                        >
                            <Text
                                style={[
                                    styles.optionButtonText,
                                    isSelected && styles.optionButtonTextSelected,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.optionGrid}>
                {ACTIVITY_LEVEL_OPTIONS.map((option) => {
                    const isSelected = activityLevel === option.value;

                    return (
                        <Pressable
                            key={option.value}
                            style={[
                            styles.optionButton,
                            isSelected && styles.optionButtonSelected,
                            ]}
                            onPress={() => setActivityLevel(option.value)}
                        >
                        <Text
                            style={[
                                styles.optionButtonText,
                                isSelected && styles.optionButtonTextSelected,
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Goal</Text>
            <View style={styles.optionGrid}>
                {NUTRITION_GOAL_OPTIONS.map((option) => {
                    const isSelected = goal === option.value;

                    return (
                    <Pressable
                        key={option.value}
                        style={[
                            styles.optionButton,
                            isSelected && styles.optionButtonSelected,
                        ]}
                        onPress={() => setGoal(option.value)}
                    >
                        <Text
                            style={[
                                styles.optionButtonText,
                                isSelected && styles.optionButtonTextSelected,
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
                })}
            </View>

            <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>Save Profile</Text>
            </Pressable>

            {savedProfile && (
                <View style={styles.savedNotice}>
                    <Text style={styles.savedNoticeTitle}>Profile saved locally</Text>
                    <Text style={styles.savedNoticeText}>
                        Goal: {savedProfile.goal.replace("_", " ")} · Activity:{" "}
                        {savedProfile.activityLevel.replace("_", " ")}
                    </Text>
                </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: "#f9fafb",
  },

  iconBackButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  iconBackButtonText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 26,
  },

  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  bodyText: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
    marginBottom: 18,
  },

  label: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginTop: 12,
    marginBottom: 8,
  },

  optionText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 21,
    marginBottom: 8,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  inputGroup: {
  marginBottom: 14,
},

input: {
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 14,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
  backgroundColor: "#ffffff",
  color: "#111827",
},

optionGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 16,
},

optionButton: {
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 999,
  paddingVertical: 10,
  paddingHorizontal: 14,
  backgroundColor: "#ffffff",
},

optionButtonSelected: {
  backgroundColor: "#111827",
  borderColor: "#111827",
},

optionButtonText: {
  fontSize: 14,
  fontWeight: "700",
  color: "#374151",
},

optionButtonTextSelected: {
  color: "#ffffff",
},

saveButton: {
  backgroundColor: "#111827",
  borderRadius: 16,
  paddingVertical: 15,
  alignItems: "center",
  marginTop: 8,
},

saveButtonText: {
  color: "#ffffff",
  fontSize: 16,
  fontWeight: "800",
},

savedNotice: {
  marginTop: 16,
  padding: 14,
  borderRadius: 14,
  backgroundColor: "#f3f4f6",
},

savedNoticeTitle: {
  fontSize: 15,
  fontWeight: "800",
  color: "#111827",
  marginBottom: 4,
},

savedNoticeText: {
  fontSize: 14,
  color: "#6b7280",
  lineHeight: 20,
},
});