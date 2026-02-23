import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MatchesScreen from './screens/MatchesScreen';
import ChatScreen from './screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Matches"
            component={MatchesScreen}
            options={{
              title: 'Your Matches',
              headerStyle: { backgroundColor: '#7c3aed' },
              headerTitleStyle: { fontWeight: '700', color: '#fff' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
