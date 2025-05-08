import React, {useState, useRef} from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import {Product} from '../types/product';
import {useCart} from '../contexts/CartContext';
import {AddToCartAnimation} from './AddToCartAnimation';
import {Vibration} from 'react-native';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const safeVibrate = () => {
  try {
    if (Platform.OS === 'android') {
      const {Vibration} = require('react-native');
      Vibration.vibrate(50);
    }
  } catch (error) {
    console.log('Vibration não disponível:', error);
  }
};

export function ProductCard({product, onPress}: ProductCardProps) {
  const {addToCart} = useCart();
  const [showAnimation, setShowAnimation] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({x: 0, y: 0});
  const buttonRef = useRef<View>(null);

  const handleAddToCart = () => {
    safeVibrate();

    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setButtonPosition({x: pageX, y: pageY});
      setShowAnimation(true);
      addToCart(product);
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress} // Adicionando o onPress aqui para navegar para detalhes
    >
      <Image
        source={{uri: product.image}}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>R$ {product.price.toFixed(2)}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        <View ref={buttonRef}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
            <Text style={styles.addButtonText}>Adicionar ao Carrinho</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showAnimation && (
        <AddToCartAnimation
          startPosition={buttonPosition}
          onComplete={() => setShowAnimation(false)}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#2ecc71',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
