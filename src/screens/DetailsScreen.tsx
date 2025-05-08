import React from 'react';
import {View, Text, Image, StyleSheet, ScrollView} from 'react-native';
import {Product} from '../types/product';

export function DetailsScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const {product} = route.params as {product: Product};

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{uri: product.image}}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>R$ {product.price.toFixed(2)}</Text>
        <Text style={styles.category}>Categoria: {product.category}</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  image: {
    width: '100%',
    height: 300,
  },
  infoContainer: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});
