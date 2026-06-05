import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MealRecommendation } from "../types/menu";

type MealRecommendationCardProps = {
  meal: MealRecommendation;
  index: number;
  onPress: () => void;
};

function getMealPeriodLabel(meal: MealRecommendation) {
  const firstSpecificMealPeriod = meal.items.find(
    (item) => item.mealPeriod !== "all_day"
  )?.mealPeriod;

  if (!firstSpecificMealPeriod) {
    return "All Day";
  }

  return firstSpecificMealPeriod
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDiningHallLabel(meal: MealRecommendation) {
  const diningHalls = Array.from(
    new Set(meal.items.map((item) => item.diningHall))
  );

  if (diningHalls.length === 1) {
    return diningHalls[0];
  }

  return "Multiple locations";
}

export function MealRecommendationCard({
  meal,
  index,
  onPress,
}: MealRecommendationCardProps) {
  const itemNames = meal.items.map((item) => item.name).join(" + ");
  const mealPeriodLabel = getMealPeriodLabel(meal);
  const diningHallLabel = getDiningHallLabel(meal);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.optionLabel}>Meal Option {index + 1}</Text>
          <Text style={styles.metaText}>
            {mealPeriodLabel} · {diningHallLabel}
          </Text>
        </View>

        <Text style={styles.calorieText}>{meal.totalCalories} cal</Text>
      </View>

      <Text style={styles.itemsText}>{itemNames}</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>{meal.totalProtein}g protein</Text>
        <Text style={styles.summaryDot}>·</Text>
        <Text style={styles.summaryText}>{meal.totalCarbs}g carbs</Text>
        <Text style={styles.summaryDot}>·</Text>
        <Text style={styles.summaryText}>{meal.totalFat}g fat</Text>
      </View>

      <Text style={styles.tapHint}>Tap for details</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardPressed: {
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  titleGroup: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  metaText: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },
  calorieText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#b45309",
  },
  itemsText: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#111827",
  },
  summaryRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    color: "#4b5563",
  },
  summaryDot: {
    fontSize: 14,
    color: "#9ca3af",
  },
  tapHint: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },
});