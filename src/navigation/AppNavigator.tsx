import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '../screens/HomeScreen';
import {DetailsScreen} from '../screens/DetailsScreen';
import {CartScreen} from '../screens/CartScreen';
import {CheckoutScreen} from '../screens/CheckoutScreen';
import {TefScreen} from '../screens/TefScreen';
import {CartProvider} from '../contexts/CartContext';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'Mercado'}}
          />
          <Stack.Screen
            name="Details"
            component={DetailsScreen}
            options={{title: 'Detalhes do Produto'}}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{title: 'Carrinho'}}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{title: 'Finalizar Compra'}}
          />
          <Stack.Screen
            name="Tef"
            component={TefScreen}
            options={{title: 'TEF'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}
