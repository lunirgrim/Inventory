import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import InventoryScreen from './screens/InventoryScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import TotalCostScreen from './screens/TotalCostScreen';

import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'Inventory') iconName = 'cube-outline';
              else if (route.name === 'Analytics') iconName = 'stats-chart-outline';
              else if (route.name === 'Total Cost') iconName = 'cash-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#00ccff',
            tabBarInactiveTintColor: '#888',
            tabBarStyle: { backgroundColor: '#121212', borderTopColor: '#222' },
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          })}
        >
          <Tab.Screen name="Inventory" component={InventoryScreen} />
          <Tab.Screen name="Analytics" component={AnalyticsScreen} />
          <Tab.Screen name="Total Cost" component={TotalCostScreen} />
        </Tab.Navigator>
      </>
    </NavigationContainer>
  );
}

