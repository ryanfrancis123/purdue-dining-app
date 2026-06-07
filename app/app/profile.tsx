import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ACTIVITY_LEVEL_OPTIONS,
  NUTRITION_GOAL_OPTIONS,
} from "../src/constants/profileOptions";

export default function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9fafb",
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
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
    padding: 18,
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
    marginBottom: 6,
  },
});