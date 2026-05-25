import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { sampleMenuItems } from "../../src/data/sampleMenuItems";
import { UserGoal, MealRecommendation } from "../../src/types/menu";
import { recommendMeals } from "../../src/utils/recommendMeals";

const DEFAULT_DATE = "2026-08-24";
const DEFAULT_MEAL_PERIOD = "Dinner";
const DEFAULT_DINING_HALL = "Wiley";

export default function HomeScreen() {
  const [calorieInput, setCalorieInput] = useState("610");
  const [proteinInput, setProteinInput] = useState("50");
  const [carbInput, setCarbInput] = useState("70");
  const [recommendations, setRecommendations] = useState<
    MealRecommendation[]
  >([]);

  function handleGenerateRecommendations() {
    const targetCalories = Number(calorieInput);
    const targetProtein = Number(proteinInput);
    const targetCarbs = Number(carbInput);

    if (
      Number.isNaN(targetCalories) ||
      Number.isNaN(targetProtein) ||
      Number.isNaN(targetCarbs)
    ) {
      setRecommendations([]);
      return;
    }

    const userGoal: UserGoal = {
      targetCalories,
      targetProtein,
      targetCarbs,
      mealPeriod: DEFAULT_MEAL_PERIOD,
      date: DEFAULT_DATE,
      requiredDietaryTags: [],
      allergensToAvoid: [],
      preferredDiningHall: DEFAULT_DINING_HALL,
    };

    const results = recommendMeals(sampleMenuItems, userGoal);
    setRecommendations(results);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Purdue Dining Macro Planner</Text>

      <View style={styles.inputCard}>
        <Text style={styles.sectionTitle}>Enter Your Meal Targets</Text>

        <Text style={styles.label}>Calories</Text>
        <TextInput
          style={styles.input}
          value={calorieInput}
          onChangeText={setCalorieInput}
          keyboardType="numeric"
          placeholder="Example: 610"
        />

        <Text style={styles.label}>Protein (g)</Text>
        <TextInput
          style={styles.input}
          value={proteinInput}
          onChangeText={setProteinInput}
          keyboardType="numeric"
          placeholder="Example: 50"
        />

        <Text style={styles.label}>Carbs (g)</Text>
        <TextInput
          style={styles.input}
          value={carbInput}
          onChangeText={setCarbInput}
          keyboardType="numeric"
          placeholder="Example: 70"
        />

        <Pressable
          style={styles.button}
          onPress={handleGenerateRecommendations}
        >
          <Text style={styles.buttonText}>Find Meals</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Top Recommendations</Text>

      {recommendations.length === 0 ? (
        <Text style={styles.emptyText}>
          Enter your targets and press Find Meals.
        </Text>
      ) : (
        recommendations.map((recommendation, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>Recommendation #{index + 1}</Text>

            <Text style={styles.items}>
              {recommendation.items.map((item) => item.name).join(", ")}
            </Text>

            <Text>Calories: {recommendation.totalCalories}</Text>
            <Text>Protein: {recommendation.totalProtein}g</Text>
            <Text>Carbs: {recommendation.totalCarbs}g</Text>
            <Text>Fat: {recommendation.totalFat}g</Text>
            <Text>Score: {recommendation.score}</Text>

            <Text style={styles.explanation}>
              {recommendation.explanation}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 10,
  },
  inputCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#cccccc",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#111111",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  emptyText: {
    color: "#666666",
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  items: {
    fontWeight: "500",
    marginBottom: 8,
  },
  explanation: {
    marginTop: 10,
    fontStyle: "italic",
  },
});