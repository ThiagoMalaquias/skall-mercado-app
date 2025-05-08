import React, {useLayoutEffect} from 'react';
import {View, FlatList, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {ProductCard} from '../components/ProductCard';
import {Product} from '../types/product';
import {useCart} from '../contexts/CartContext';

// Dados de exemplo - você pode substituir por dados reais da sua API
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Arroz Integral',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
    description: 'Arroz integral tipo 1, pacote 1kg',
    category: 'Grãos',
  },
  {
    id: '2',
    name: 'Leite Desnatado',
    price: 4.5,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500',
    description: 'Leite desnatado, caixa 1L',
    category: 'Laticínios',
  },
  {
    id: '3',
    name: 'Maçã Gala',
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500',
    description: 'Maçã gala, pacote 1kg',
    category: 'Frutas',
  },
  // Adicione mais produtos conforme necessário
];

export function HomeScreen({navigation}: {navigation: any}) {
  const {items} = useCart(); // Obtém os itens do carrinho
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0); // Calcula o total de itens

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          style={styles.cartButton}>
          <Text style={styles.cartIcon}>🛒</Text>
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, items, totalItems]);

  const handleProductPress = (product: Product) => {
    navigation.navigate('Details', {product});
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={mockProducts}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  cartButton: {
    marginRight: 16,
    position: 'relative',
  },
  cartIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    right: 8,
    top: -8,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 30,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
