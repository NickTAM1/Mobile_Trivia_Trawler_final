import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import GamePortal from './components/GamePortal.jsx';
import LoginForm from './components/LoginForm.jsx';
import SensorDebug from './components/SensorDebug.jsx';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2e86de',
        tabBarIcon: () => null,
        tabBarItemStyle: { height: 140 },
        tabBarStyle: { height: 140 },
        tabBarLabelStyle: { fontSize: 14, marginBottom: 18 },
      }}>
        <Tab.Screen name="Game" component={GamePortal} options={{ tabBarLabel: 'Game' }} />
        <Tab.Screen name="Sensors" component={SensorDebug} options={{ tabBarLabel: 'Sensors' }} />
        <Tab.Screen name="Login" component={LoginForm} options={{ tabBarLabel: 'Login' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}