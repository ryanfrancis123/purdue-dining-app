import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { sampleMenuItems } from "../../src/data/sampleMenuItems";
import { recommendMeals } from "../../src/utils/recommendMeals";
import { MacroTargets, MealPeriod } from "../../src/types/menu";

export default function HomeScreen() {
  const [caloriesInput, setCaloriesInput] = useState("600");
  const [proteinInput, setProteinInput] = useState("40");
  const [carbsInput, setCarbsInput] = useState("60");
  const [selectedMealPeriod, setSelectedMealPeriod] = useState<
    MealPeriod | undefined
  >(undefined);

  const [targets, setTargets] = useState<MacroTargets>({
    calories: 600,
    protein: 40,
    carbs: 60,
  });

  const recommendations = recommendMeals(
    sampleMenuItems,
    targets,
    selectedMealPeriod
  );

  function handleGenerateRecommendations() {
    const calories = Number(caloriesInput);
    const protein = Number(proteinInput);
    const carbs = Number(carbsInput);

    if (
      Number.isNaN(calories) ||
      Number.isNaN(protein) ||
      Number.isNaN(carbs)
    ) {
      return;
    }

    setTargets({
      calories,
      protein,
      carbs,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Purdue Dining Macro Planner</Text>

      <Text style={styles.subtitle}>
        Enter your macro targets and get realistic meal combinations from sample
        dining hall data.
      </Text>

      <View style={styles.inputSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Calories</Text>
          <TextInput
            style={styles.input}
            value={caloriesInput}
            onChangeText={setCaloriesInput}
            keyboardType="numeric"
            placeholder="600"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Protein (g)</Text>
          <TextInput
            style={styles.input}
            value={proteinInput}
            onChangeText={setProteinInput}
            keyboardType="numeric"
            placeholder="40"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput
            style={styles.input}
            value={carbsInput}
            onChangeText={setCarbsInput}
            keyboardType="numeric"
            placeholder="60"
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGenerateRecommendations}
        >
          <Text style={styles.buttonText}>Generate Meal Recommendations</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Meal Period</Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMealPeriod === undefined && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedMealPeriod(undefined)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedMealPeriod === undefined &&
                  styles.activeFilterButtonText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMealPeriod === "breakfast" && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedMealPeriod("breakfast")}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedMealPeriod === "breakfast" &&
                  styles.activeFilterButtonText,
              ]}
            >
              Breakfast
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMealPeriod === "lunch" && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedMealPeriod("lunch")}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedMealPeriod === "lunch" &&
                  styles.activeFilterButtonText,
              ]}
            >
              Lunch
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMealPeriod === "dinner" && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedMealPeriod("dinner")}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedMealPeriod === "dinner" &&
                  styles.activeFilterButtonText,
              ]}
            >
              Dinner
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Top Meal Options</Text>
        <Text style={styles.targetText}>
          Target: {targets.calories} cal, {targets.protein}g protein,{" "}
          {targets.carbs}g carbs
        </Text>
      </View>

      {recommendations.map((meal, index) => (
        <View key={meal.id} style={styles.card}>
          <Text style={styles.cardTitle}>Meal Option {index + 1}</Text>

          <View style={styles.itemList}>
            {meal.items.map((item) => (
              <Text key={item.id} style={styles.itemText}>
                • {item.name}
              </Text>
            ))}
          </View>

          <View style={styles.macroRow}>
            <Text style={styles.macroText}>{meal.totalCalories} cal</Text>
            <Text style={styles.macroText}>{meal.totalProtein}g protein</Text>
          </View>

          <View style={styles.macroRow}>
            <Text style={styles.macroText}>{meal.totalCarbs}g carbs</Text>
            <Text style={styles.macroText}>{meal.totalFat}g fat</Text>
          </View>

          <Text style={styles.explanation}>{meal.explanation}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: "#555",
    marginBottom: 24,
  },
  inputSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 14,
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
  },
  button: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  resultsHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  targetText: {
    fontSize: 14,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },
  itemList: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  macroText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  explanation: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginTop: 10,
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
});