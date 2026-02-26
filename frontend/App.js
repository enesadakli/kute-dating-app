import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HomeIcon, ChatBubbleLeftRightIcon, UserCircleIcon } from 'react-native-heroicons/outline';

import LoginScreen      from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen       from './screens/HomeScreen';
import MatchesScreen    from './screens/MatchesScreen';
import ChatScreen       from './screens/ChatScreen';
import ProfileScreen    from './screens/ProfileScreen';
import SettingsScreen   from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs({ route }) {
    const { user } = route.params || {};

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopColor: 'rgba(255,255,255,0.08)',
                    borderTopWidth: 1,
                    paddingBottom: 6,
                    paddingTop: 6,
                    height: 58,
                    position: 'absolute',
                },
                tabBarBackground: () => (
                    <BlurView
                        intensity={40}
                        tint="dark"
                        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,8,22,0.60)' }]}
                    />
                ),
                tabBarActiveTintColor: '#00E1FF',
                tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            <Tab.Screen
                name="Discover"
                component={HomeScreen}
                initialParams={{ user }}
                options={{
                    tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Matches"
                component={MatchesScreen}
                initialParams={{ user }}
                options={{
                    tabBarIcon: ({ color, size }) => <ChatBubbleLeftRightIcon size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                initialParams={{ user }}
                options={{
                    tabBarIcon: ({ color, size }) => <UserCircleIcon size={size} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <GestureHandlerRootView style={styles.root}>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Onboarding"
                        component={OnboardingScreen}
                        options={{ headerShown: false, animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                        name="Main"
                        component={MainTabs}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Chat"
                        component={ChatScreen}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{ headerShown: false }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
});
