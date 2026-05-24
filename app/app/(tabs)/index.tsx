import { ScrollView, StyleSheet, Text, View } from "react-native";

import { sampleMenuItems } from "../../src/data/sampleMenuItems";
import { recommendMeals } from "../../src/utils/recommendMeals";
import { UserGoal } from "../../src/types/menu";

const testGoal: UserGoal = {
  targetCalories: 610,
  targetProtein: 50,
  targetCarbs: 70,
  mealPeriod: "Dinner",
  date: "2026-08-24",
  requiredDietaryTags: [],
  allergensToAvoid: [],
  preferredDiningHall: "Wiley",
};

const recommendations = recommendMeals(sampleMenuItems, testGoal);

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Purdue Dining Macro Planner</Text>

      <View style={styles.goalCard}>
        <Text style={styles.sectionTitle}>Test Goal</Text>
        <Text>Calories: {testGoal.targetCalories}</Text>
        <Text>Protein: {testGoal.targetProtein}g</Text>
        <Text>Carbs: {testGoal.targetCarbs}g</Text>
        <Text>Meal: {testGoal.mealPeriod}</Text>
        <Text>Dining Hall: {testGoal.preferredDiningHall}</Text>
      </View>

      <Text style={styles.sectionTitle}>Top Recommendations</Text>

      {recommendations.length === 0 ? (
        <Text>No recommendations found.</Text>
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
  goalCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    marginBottom: 20,
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