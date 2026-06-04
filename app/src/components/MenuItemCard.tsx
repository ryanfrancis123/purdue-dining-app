import { Pressable, StyleSheet, Text, View } from "react-native";

import { MenuItem } from "../types/menu";

type MenuItemCardProps = {
  item: MenuItem;
  variant?: "compact" | "full";
  onPress?: () => void;
};

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function MenuItemCard({
  item,
  variant = "full",
  onPress,
}: MenuItemCardProps) {
  const hasAllergens = item.allergens.length > 0;
  const hasDietaryTags = item.dietaryTags.length > 0;

  const formattedDietaryTags = item.dietaryTags.map(formatLabel);
  const formattedAllergens = item.allergens.map(formatLabel);
  
  
  if (variant === "compact") {
    return (
      <Pressable
        style={({ pressed }) => [
            styles.compactCard,
            pressed && styles.compactCardPressed,
        ]}
        onPress={onPress}
        disabled={!onPress}
      >
            <View style={styles.compactHeaderRow}>
                <Text style={styles.compactName}>{item.name}</Text>
                <Text style={styles.compactCalories}>{item.calories} kcal</Text>
            </View>

            <Text style={styles.compactMeta}>
                {item.diningHall} • {item.mealPeriod} • {item.category}
            </Text>

            <Text style={styles.compactMacros}>
                {item.protein}g protein · {item.carbs}g carbs · {item.fat}g fat
            </Text>

            {hasAllergens ? (
                <Text style={styles.compactAllergens}>
                    Allergens: {formattedAllergens.join(", ")}
                </Text>
            ) : null}
        </Pressable>
  );
}

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.calories}>{item.calories} kcal</Text>
      </View>

      <Text style={styles.locationText}>
        {item.diningHall} • {item.mealPeriod} • {item.category}
      </Text>

      {item.servingSize ? (
        <Text style={styles.servingText}>Serving: {item.servingSize}</Text>
      ) : null}

      <View style={styles.macroRow}>
        <View style={styles.macroBox}>
          <Text style={styles.macroValue}>{item.protein}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>

        <View style={styles.macroBox}>
          <Text style={styles.macroValue}>{item.carbs}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>

        <View style={styles.macroBox}>
          <Text style={styles.macroValue}>{item.fat}g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
      </View>

      {hasDietaryTags ? (
        <Text style={styles.tagText}>
          Tags: {formattedDietaryTags.join(", ")}
        </Text>
      ) : null}

      {hasAllergens ? (
        <Text style={styles.allergenText}>
          Allergens: {item.allergens.join(", ")}
        </Text>
      ) : (
        <Text style={styles.safeText}>No listed allergens</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  calories: {
    fontSize: 15,
    fontWeight: "700",
    color: "#b45309",
  },
  locationText: {
    marginTop: 6,
    fontSize: 14,
    color: "#4b5563",
  },
  servingText: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  macroRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  macroBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  macroLabel: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  tagText: {
    marginTop: 10,
    fontSize: 13,
    color: "#2563eb",
  },
  allergenText: {
    marginTop: 6,
    fontSize: 13,
    color: "#dc2626",
  },
  safeText: {
    marginTop: 6,
    fontSize: 13,
    color: "#16a34a",
  },
  compactCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  compactHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  compactName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  compactCalories: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b45309",
  },
  compactMeta: {
    marginTop: 3,
    fontSize: 13,
    color: "#6b7280",
  },
  compactMacros: {
    marginTop: 4,
    fontSize: 13,
    color: "#374151",
  },
  compactAllergens: {
    marginTop: 4,
    fontSize: 12,
    color: "#dc2626",
  },
  compactCardPressed: {
  opacity: 0.65,
  },
});