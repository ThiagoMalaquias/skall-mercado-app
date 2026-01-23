import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Loading from '../pages/Loading';
import Home from '../pages/Home';
import Checkout from '../pages/Checkout';
import Tef from '../pages/Tef';
import Login from '../pages/Login';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Loading"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Loading" component={Loading} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Checkout" component={Checkout} />
        <Stack.Screen name="Tef" component={Tef} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}