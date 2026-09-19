import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AddTransactionScreen from "./screens/AddTransactionScreen";
import BudgetSettingsScreen from "./screens/BudgetSettingsScreen";
import AccountsScreen from "./screens/AccountsScreen";
import { auth } from "./services/firebaseConfig";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={user ? "authenticated" : "unauthenticated"}
        screenOptions={{ headerShown: false }}
      >
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
            />
            <Stack.Screen
              name="BudgetSettings"
              component={BudgetSettingsScreen}
            />
            <Stack.Screen name="Accounts" component={AccountsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});