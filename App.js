import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import DashboardScreen from "./src/screens/dashboard/DashboardScreen";
import AddTransactionScreen from "./src/screens/transactions/AddTransactionScreen";
import BudgetSettingsScreen from "./src/screens/legacy/BudgetSettingsScreen";
import AccountsScreen from "./src/screens/accounts/AccountsScreen";
import AccountActivityScreen from "./src/screens/accounts/AccountActivityScreen";
import ProfileScreen from "./src/screens/profile/ProfileScreen";
import AnalyticsScreen from "./src/screens/analytics/AnalyticsScreen";
import SavingsGoalsScreen from "./src/screens/savings/SavingsGoalsScreen";
import LeanV2OnboardingScreen from "./src/screens/onboarding/LeanV2OnboardingScreen";
import MonthlyPlanScreen from "./src/screens/monthly-plan/MonthlyPlanScreen";
import { auth, db } from "./src/services/firebaseConfig";
import { ThemeProvider } from "./src/theme/ThemeContext";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDocument = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeUserDocument) {
        unsubscribeUserDocument();
        unsubscribeUserDocument = null;
      }

      setUser(currentUser);

      if (!currentUser) {
        setIsOnboardingComplete(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      unsubscribeUserDocument = onSnapshot(
        doc(db, "users", currentUser.uid),
        (snapshot) => {
          const userData = snapshot.exists() ? snapshot.data() : null;

          setIsOnboardingComplete(userData?.leanV2OnboardingComplete === true);

          setIsLoading(false);
        },
        (error) => {
          console.error("Error loading Lean V2 user profile:", error);

          setIsOnboardingComplete(false);
          setIsLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeUserDocument) {
        unsubscribeUserDocument();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          key={
            user
              ? isOnboardingComplete
                ? "authenticated"
                : "onboarding"
              : "unauthenticated"
          }
          screenOptions={{ headerShown: false }}
        >
          {user ? (
            isOnboardingComplete ? (
              <>
                <Stack.Screen name="Dashboard" component={DashboardScreen} />

                <Stack.Screen
                  name="AddTransaction"
                  component={AddTransactionScreen}
                />

                <Stack.Screen
                  name="MonthlyPlan"
                  component={MonthlyPlanScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen name="Analytics" component={AnalyticsScreen} />

                <Stack.Screen
                  name="SavingsGoals"
                  component={SavingsGoalsScreen}
                />

                <Stack.Screen
                  name="BudgetSettings"
                  component={BudgetSettingsScreen}
                />

                <Stack.Screen name="Accounts" component={AccountsScreen} />

                <Stack.Screen
                  name="AccountActivity"
                  component={AccountActivityScreen}
                />

                <Stack.Screen name="Profile" component={ProfileScreen} />
              </>
            ) : (
              <Stack.Screen
                name="LeanV2Onboarding"
                component={LeanV2OnboardingScreen}
              />
            )
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
