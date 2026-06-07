import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Purdue Dining</Text>
          <Text style={styles.subtitle}>
            Choose how you want to find meals that match your nutrition goals.
          </Text>
        </View>

        <View style={styles.choiceSection}>
          <Pressable
            style={styles.choiceCard}
            onPress={() => router.push("/manual")}
          >
            <Text style={styles.choiceTitle}>Set Targets Manually</Text>
            <Text style={styles.choiceDescription}>
              Choose calories, protein, and carbs yourself using quick presets or
              custom targets.
            </Text>
            <Text style={styles.choiceAction}>Start with manual targets →</Text>
          </Pressable>

          <Pressable
            style={styles.choiceCard}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.choiceTitle}>Create Nutrition Profile</Text>
            <Text style={styles.choiceDescription}>
              Enter your body, activity level, and goal so the app can suggest
              better targets later.
            </Text>
            <Text style={styles.choiceAction}>Create optional profile →</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          You can use the app without creating a profile. Manual mode is always
          available.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
  },

  header: {
    marginBottom: 28,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 22,
  },

  choiceSection: {
    gap: 16,
  },

  choiceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  choiceTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  choiceDescription: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
    marginBottom: 14,
  },

  choiceAction: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  note: {
    marginTop: 24,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    textAlign: "center",
  },
  safeArea: {
  flex: 1,
  backgroundColor: "#f9fafb",
  },
});