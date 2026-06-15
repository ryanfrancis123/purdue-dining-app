import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  NUTRITION_GOAL_OPTIONS,
  SEX_OPTIONS,
} from "../src/constants/profileOptions";
import type { ActivityLevel, NutritionGoal, NutritionProfile, Sex } from "../src/types/profile";

const TOTAL_STEPS = 8;
const CM_PER_INCH = 2.54;
const KG_PER_POUND = 0.45359237;
const AGE_MIN = 16;
const AGE_MAX = 80;
const AGE_DEFAULT = 18;
const WHEEL_ITEM_HEIGHT = 52;

type UnitSystem = "us" | "metric";

type ProfileStep =
  | "intro"
  | "age"
  | "height"
  | "weight"
  | "sex"
  | "activity"
  | "goal"
  | "review";

const PROFILE_STEPS: ProfileStep[] = [
  "intro",
  "age",
  "height",
  "weight",
  "sex",
  "activity",
  "goal",
  "review",
];

const ACTIVITY_DISPLAY_OPTIONS: {
  label: string;
  value: ActivityLevel;
  description: string;
}[] = [
  {
    label: "Low Activity",
    value: "sedentary",
    description: "Little exercise besides walking to class",
  },
  {
    label: "Light Activity",
    value: "light",
    description: "Exercise or sports 1 to 2 days per week",
  },
  {
    label: "Moderate Activity",
    value: "moderate",
    description: "Exercise or sports 3 to 4 days per week",
  },
  {
    label: "High Activity",
    value: "active",
    description: "Hard training 5 to 6 days per week",
  },
  {
    label: "Very High Activity",
    value: "very_active",
    description: "Intense training most days",
  },
];

function buildRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function formatProfileLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function centimetersToFeetInches(heightCm: number) {
  const totalInches = Math.max(0, Math.round(heightCm / CM_PER_INCH));
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return { feet, inches };
}

function kilogramsToPounds(weightKg: number) {
  return Math.round(weightKg / KG_PER_POUND);
}

function poundsToKilograms(weightLb: number) {
  return Math.round(weightLb * KG_PER_POUND);
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [age, setAge] = useState<number | null>(AGE_DEFAULT);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("us");

  const [sex, setSex] = useState<Sex | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);

  const [savedProfile, setSavedProfile] = useState<NutritionProfile | null>(null);

  const currentStep = PROFILE_STEPS[currentStepIndex];
  const isReviewStep = currentStep === "review";
  const progressPercent = `${((currentStepIndex + 1) / TOTAL_STEPS) * 100}%`;

  const canContinue =
    (currentStep !== "sex" || sex !== null) &&
    (currentStep !== "activity" || activityLevel !== null) &&
    (currentStep !== "goal" || goal !== null);

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNextStep = () => {
    if (!canContinue) {
      return;
    }

    if (currentStepIndex < PROFILE_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleSaveProfile = () => {
    if (sex === null || activityLevel === null || goal === null) {
      return;
    }

    const profile: NutritionProfile = {
      age,
      heightCm,
      weightKg,
      sex,
      activityLevel,
      goal,
    };

    setSavedProfile(profile);
  };

  const setUsHeight = (part: "feet" | "inches", value: number) => {
    const currentHeight = centimetersToFeetInches(heightCm ?? 173);
    const feet = part === "feet" ? value : currentHeight.feet;
    const inches = part === "inches" ? value : currentHeight.inches;
    setHeightCm(Math.round((feet * 12 + inches) * CM_PER_INCH));
  };

  const formatHeightForReview = () => {
    if (heightCm === null) {
      return "Not provided";
    }

    if (unitSystem === "metric") {
      return `${heightCm} cm`;
    }

    const { feet, inches } = centimetersToFeetInches(heightCm);
    return `${feet} ft ${inches} in`;
  };

  const formatWeightForReview = () => {
    if (weightKg === null) {
      return "Not provided";
    }

    if (unitSystem === "metric") {
      return `${weightKg} kg`;
    }

    return `${kilogramsToPounds(weightKg)} lb`;
  };

  const selectedActivityOption = ACTIVITY_DISPLAY_OPTIONS.find(
    (option) => option.value === activityLevel
  );

  function renderStepContent() {
    switch (currentStep) {
      case "intro":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Optional setup</Text>
            <Text style={styles.stepTitle}>Build a profile for better meal ideas.</Text>
            <Text style={styles.stepBody}>
              Your nutrition profile is optional. It helps prepare more personalized
              meal suggestions while keeping Purdue Dining easy to use without one.
            </Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>You are in control</Text>
              <Text style={styles.infoText}>
                Answer what feels useful, skip what you want, and come back anytime.
              </Text>
            </View>
          </View>
        );
      case "age":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>About you</Text>
            <Text style={styles.stepTitle}>How old are you?</Text>
            {renderAgeWheel()}
          </View>
        );
      case "height":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Body details</Text>
            <Text style={styles.stepTitle}>What is your height?</Text>
            {renderUnitToggle()}
            {unitSystem === "metric" ? renderMetricHeightControl() : renderUsHeightControl()}
          </View>
        );
      case "weight":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Body details</Text>
            <Text style={styles.stepTitle}>What is your weight?</Text>
            {renderUnitToggle()}
            {unitSystem === "metric" ? renderMetricWeightControl() : renderUsWeightControl()}
          </View>
        );
      case "sex":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Profile detail</Text>
            <Text style={styles.stepTitle}>Which option should we use?</Text>
            <Text style={styles.stepBody}>
              Choose one to continue. Prefer not to say is always available.
            </Text>
            <View style={styles.optionStack}>
              {SEX_OPTIONS.map((option) => renderOptionCard({
                isSelected: sex === option.value,
                label: option.label,
                onPress: () => setSex(option.value),
              }))}
            </View>
          </View>
        );
      case "activity":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Daily rhythm</Text>
            <Text style={styles.stepTitle}>How active are you most weeks?</Text>
            <Text style={styles.stepBody}>
              Pick the option that sounds closest to your normal routine.
            </Text>
            <View style={styles.optionStack}>
              {ACTIVITY_DISPLAY_OPTIONS.map((option) => renderOptionCard({
                description: option.description,
                isSelected: activityLevel === option.value,
                label: option.label,
                onPress: () => setActivityLevel(option.value),
              }))}
            </View>
          </View>
        );
      case "goal":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Nutrition direction</Text>
            <Text style={styles.stepTitle}>What is your main goal?</Text>
            <Text style={styles.stepBody}>
              This helps shape future meal target suggestions.
            </Text>
            <View style={styles.optionStack}>
              {NUTRITION_GOAL_OPTIONS.map((option) => renderOptionCard({
                description: option.description,
                isSelected: goal === option.value,
                label: option.label,
                onPress: () => setGoal(option.value),
              }))}
            </View>
          </View>
        );
      case "review":
        return (
          <View style={styles.stepCard}>
            <Text style={styles.eyebrow}>Review</Text>
            <Text style={styles.stepTitle}>Ready to save this profile?</Text>
            <Text style={styles.stepBody}>
              Review your answers before saving this profile for now.
            </Text>

            <View style={styles.reviewList}>
              {renderReviewRow("Age", age === null ? "Not provided" : `${age}`)}
              {renderReviewRow("Height", formatHeightForReview())}
              {renderReviewRow("Weight", formatWeightForReview())}
              {renderReviewRow("Sex", sex ? formatProfileLabel(sex) : "Not selected")}
              {renderReviewRow(
                "Activity",
                selectedActivityOption ? selectedActivityOption.label : "Not selected"
              )}
              {renderReviewRow("Goal", goal ? formatProfileLabel(goal) : "Not selected")}
            </View>

            {savedProfile ? (
              <View style={styles.savedNotice}>
                <Text style={styles.savedNoticeTitle}>Profile saved</Text>
                <Text style={styles.savedNoticeText}>
                  You can keep using Purdue Dining with or without these answers.
                </Text>
              </View>
            ) : null}
          </View>
        );
    }
  }

  function renderAgeWheel() {
    return renderNumberWheel({
      label: "Age",
      options: buildRange(AGE_MIN, AGE_MAX),
      selectedValue: age,
      defaultValue: AGE_DEFAULT,
      onSelect: setAge,
      unit: "years",
    });
  }

  function renderUnitToggle() {
    return (
      <View style={styles.unitToggle}>
        {(["us", "metric"] as UnitSystem[]).map((unit) => {
          const isSelected = unitSystem === unit;

          return (
            <Pressable
              key={unit}
              style={[styles.unitToggleButton, isSelected && styles.selectedUnitToggle]}
              onPress={() => setUnitSystem(unit)}
            >
              <Text
                style={[
                  styles.unitToggleText,
                  isSelected && styles.selectedUnitToggleText,
                ]}
              >
                {unit === "us" ? "US" : "Metric"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  function renderMetricHeightControl() {
    return renderNumberWheel({
      label: "Centimeters",
      options: buildRange(120, 230),
      selectedValue: heightCm,
      defaultValue: 170,
      onSelect: setHeightCm,
      unit: "cm",
    });
  }

  function renderUsHeightControl() {
    const { feet, inches } = centimetersToFeetInches(heightCm ?? 173);

    return (
      <View style={styles.dualWheelRow}>
        {renderNumberWheel({
          label: "Feet",
          options: buildRange(4, 7),
          selectedValue: heightCm === null ? null : feet,
          defaultValue: 5,
          onSelect: (value) => setUsHeight("feet", value),
          unit: "ft",
        })}
        {renderNumberWheel({
          label: "Inches",
          options: buildRange(0, 11),
          selectedValue: heightCm === null ? null : inches,
          defaultValue: 8,
          onSelect: (value) => setUsHeight("inches", value),
          unit: "in",
        })}
      </View>
    );
  }

  function renderMetricWeightControl() {
    return renderNumberWheel({
      label: "Kilograms",
      options: buildRange(35, 250),
      selectedValue: weightKg,
      defaultValue: 70,
      onSelect: setWeightKg,
      unit: "kg",
    });
  }

  function renderUsWeightControl() {
    return renderNumberWheel({
      label: "Pounds",
      options: buildRange(75, 550),
      selectedValue: weightKg === null ? null : kilogramsToPounds(weightKg),
      defaultValue: 150,
      onSelect: (value) => setWeightKg(poundsToKilograms(value)),
      unit: "lb",
    });
  }

  function renderNumberWheel({
    defaultValue,
    label,
    onSelect,
    options,
    selectedValue,
    unit,
  }: {
    defaultValue: number;
    label: string;
    onSelect: (value: number) => void;
    options: number[];
    selectedValue: number | null;
    unit: string;
  }) {
    const displayValue = selectedValue ?? defaultValue;
    const handleWheelMomentumEnd = (
      event: NativeSyntheticEvent<NativeScrollEvent>
    ) => {
      const selectedIndex = Math.round(
        event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT
      );
      const nextValue = options[Math.min(options.length - 1, Math.max(0, selectedIndex))];

      onSelect(nextValue);
    };

    return (
      <View style={styles.wheelPanel}>
        <Text style={styles.wheelLabel}>{label}</Text>
        <View style={styles.wheelShell}>
          <View style={styles.wheelSelectionBand} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            snapToInterval={WHEEL_ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={handleWheelMomentumEnd}
            contentContainerStyle={styles.wheelContent}
          >
            {options.map((option) => {
              const isSelected = option === displayValue;

              return (
                <Pressable
                  key={option}
                  style={styles.wheelItem}
                  onPress={() => onSelect(option)}
                >
                  <Text style={[styles.wheelItemText, isSelected && styles.selectedWheelItemText]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Text style={styles.wheelUnit}>{unit}</Text>
      </View>
    );
  }

  function renderOptionCard({
    description,
    isSelected,
    label,
    onPress,
  }: {
    description?: string;
    isSelected: boolean;
    label: string;
    onPress: () => void;
  }) {
    return (
      <Pressable
        key={label}
        style={[styles.optionCard, isSelected && styles.selectedOptionCard]}
        onPress={onPress}
      >
        <View style={[styles.selectionDot, isSelected && styles.selectedSelectionDot]}>
          {isSelected ? <View style={styles.selectionDotInner} /> : null}
        </View>
        <View style={styles.optionTextGroup}>
          <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
            {label}
          </Text>
          {description ? (
            <Text
              style={[
                styles.optionDescription,
                isSelected && styles.selectedOptionDescription,
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  function renderReviewRow(label: string, value: string) {
    return (
      <View key={label} style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue}>{value}</Text>
      </View>
    );
  }

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

      <View style={[styles.container, { paddingTop: insets.top + 76 }]}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Step {currentStepIndex + 1} of {TOTAL_STEPS}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressPercent }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.stepScrollContent,
            { paddingBottom: insets.bottom + 148 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[
              styles.secondaryButton,
              currentStepIndex === 0 && styles.hiddenButton,
            ]}
            onPress={handlePreviousStep}
            disabled={currentStepIndex === 0}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>

          <Pressable
            style={[
              styles.primaryButton,
              !canContinue && styles.disabledPrimaryButton,
            ]}
            onPress={isReviewStep ? handleSaveProfile : handleNextStep}
            disabled={!canContinue}
          >
            <Text style={styles.primaryButtonText}>
              {isReviewStep ? "Save Nutrition Profile" : "Continue"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 20,
  },

  progressHeader: {
    marginBottom: 18,
  },

  progressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 10,
    textTransform: "uppercase",
    lineHeight: 18,
  },

  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#111",
  },

  stepScrollContent: {
    flexGrow: 1,
  },

  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    minHeight: 430,
  },

  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 12,
    textTransform: "uppercase",
  },

  stepTitle: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "800",
    color: "#111",
    marginBottom: 24,
  },

  stepBody: {
    fontSize: 16,
    lineHeight: 23,
    color: "#555",
    marginBottom: 24,
  },

  infoCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 6,
  },

  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
  },

  unitToggle: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },

  unitToggleButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },

  selectedUnitToggle: {
    backgroundColor: "#111",
  },

  unitToggleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#555",
  },

  selectedUnitToggleText: {
    color: "#fff",
  },

  dualWheelRow: {
    flexDirection: "row",
    gap: 12,
  },

  wheelPanel: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    padding: 14,
    alignItems: "center",
  },

  wheelLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 10,
    textTransform: "uppercase",
  },

  wheelShell: {
    width: "100%",
    height: WHEEL_ITEM_HEIGHT * 3,
    overflow: "hidden",
    justifyContent: "center",
  },

  wheelSelectionBand: {
    position: "absolute",
    left: 0,
    right: 0,
    top: WHEEL_ITEM_HEIGHT,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
  },

  wheelContent: {
    paddingVertical: WHEEL_ITEM_HEIGHT,
  },

  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  wheelItemText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#9ca3af",
  },

  selectedWheelItemText: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#111",
  },

  wheelUnit: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: "#6b7280",
    marginTop: 10,
  },

  optionStack: {
    gap: 12,
  },

  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
  },

  selectedOptionCard: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  selectionDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },

  selectedSelectionDot: {
    borderColor: "#fff",
  },

  selectionDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  optionTextGroup: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: "#111",
  },

  selectedOptionTitle: {
    color: "#fff",
  },

  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginTop: 4,
  },

  selectedOptionDescription: {
    color: "#e5e7eb",
  },

  reviewList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },

  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  reviewLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },

  reviewValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },

  savedNotice: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    marginTop: 18,
  },

  savedNoticeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },

  savedNoticeText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },

  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    backgroundColor: "#f9fafb",
  },

  secondaryButton: {
    minWidth: 88,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  hiddenButton: {
    opacity: 0,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },

  primaryButton: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledPrimaryButton: {
    backgroundColor: "#9ca3af",
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
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
