import React, {useEffect, useRef} from 'react';
import {Animated, Dimensions, StyleSheet, Text} from 'react-native';

interface AddToCartAnimationProps {
  startPosition: {x: number; y: number};
  onComplete: () => void;
}

export function AddToCartAnimation({
  startPosition,
  onComplete,
}: AddToCartAnimationProps) {
  const position = useRef(new Animated.ValueXY(startPosition)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Coordenadas do ícone do carrinho (ajuste conforme necessário)
    const cartIconPosition = {
      x: Dimensions.get('window').width - 50, // Posição X do ícone do carrinho
      y: 50, // Posição Y do ícone do carrinho
    };

    Animated.parallel([
      // Anima a posição
      Animated.timing(position, {
        toValue: cartIconPosition,
        duration: 800,
        useNativeDriver: true,
      }),
      // Anima a escala
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.5,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Anima a opacidade
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.animatedItem,
        {
          transform: [
            {translateX: position.x},
            {translateY: position.y},
            {scale},
          ],
          opacity,
        },
      ]}>
      <Text style={styles.itemText}>🛍️</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedItem: {
    position: 'absolute',
    zIndex: 1000,
  },
  itemText: {
    fontSize: 24,
  },
});
