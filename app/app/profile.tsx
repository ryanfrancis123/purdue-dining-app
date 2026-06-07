import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

import {
  ACTIVITY_LEVEL_OPTIONS,
  NUTRITION_GOAL_OPTIONS,
} from "../src/constants/profileOptions";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

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
            <Text style={styles.sectionTitle}>Profile fields coming next</Text>

            <Text style={styles.bodyText}>
            We will add age, height, weight, sex, activity level, and goal inputs
            here without forcing users to create an account.
            </Text>

            <Text style={styles.label}>Activity levels planned:</Text>
            {ACTIVITY_LEVEL_OPTIONS.map((option) => (
            <Text key={option.value} style={styles.optionText}>
                • {option.label}: {option.description}
            </Text>
            ))}

            <Text style={styles.label}>Goals planned:</Text>
            {NUTRITION_GOAL_OPTIONS.map((option) => (
            <Text key={option.value} style={styles.optionText}>
                • {option.label}: {option.description}
            </Text>
            ))}
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
});