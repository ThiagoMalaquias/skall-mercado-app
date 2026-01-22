// app/home.tsx
import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  useWindowDimensions,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { get } from '../utils/request';

type Category = {id: string; nome: string};
type Product = {id: string; descricao_cupom: string; preco: number; grupo_produto_id: string, imagem: string, codigo_venda: string};
type CartItem = {product: Product; qty: number};


export default function Home({navigation}: {navigation: any}) {
  const {width, height} = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 768;

  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => ({...prev, [itemId]: true}));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(p => {
      const okCat = selectedCat === 'all' || p.grupo_produto_id === selectedCat;
      const okTxt = !q || p.descricao_cupom.toLowerCase().includes(q);
      return okCat && okTxt;
    });
  }, [query, selectedCat, products]);

  // Fixo em 3 colunas
  const numColumns = 3;

  const addToCart = (product: Product) =>
    setCart(prev => {
      const it = prev[product.id];
      const qty = it ? it.qty + 1 : 1;
      return {...prev, [product.id]: {product, qty}};
    });

  const inc = (id: string) =>
    setCart(prev => {
      const it = prev[id];
      if (!it) return prev;
      return {...prev, [id]: {...it, qty: it.qty + 1}};
    });

  const dec = (id: string) =>
    setCart(prev => {
      const it = prev[id];
      if (!it) return prev;
      const qty = it.qty - 1;
      const next = {...prev};
      if (qty <= 0) delete next[id];
      else next[id] = {...it, qty};
      return next;
    });

  const total = useMemo(
    () => Object.values(cart).reduce((s, i) => s + i.product.preco * i.qty, 0),
    [cart],
  );
  
  const checkout = async () => {
    if (Object.keys(cart).length === 0) {
      Alert.alert('Atenção', 'Nenhum item no carrinho');
      return;
    }

    await AsyncStorage.setItem('@SkallApp:cart', JSON.stringify(cart));
    await AsyncStorage.setItem('@SkallApp:total', total.toString());
    navigation.navigate('Checkout');
  };

  const getProducts = async () => {
    try {
      const data = await get('api/v1/produtos');
      setProducts(data.body);
    } catch (error) {
      Alert.alert('Erro ao buscar produtos', 'Tente novamente mais tarde');
    }
  };

  const getCategories = async () => {
    try {
      const data = await get('api/v1/grupo_produtos');
      setCategories([{id: 'all', nome: 'Todas'}, ...data.body]);
    } catch (error) {
      Alert.alert('Erro ao buscar produtos', 'Tente novamente mais tarde');
    }
  };

  useEffect(() => {
    getProducts();
    getCategories();

    const intervalId = setInterval(() => {
      getProducts();
      getCategories();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="storefront" size={24} color="#2563eb" />
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Skall Mercado</Text>
              <Text style={styles.headerSubtitle}>PDV - Ponto de Venda</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerInfo}>
              {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* 2 colunas em row */}
      <View style={styles.columnsContainer}>
        {/* Coluna 1 — Categorias (horizontal) + Produtos */}
        <View style={styles.productsColumn}>
          {/* Categorias em linha horizontal */}
          <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContent}>
              {categories.map(c => {
                const active = selectedCat === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedCat(c.id)}
                    style={({pressed}) => [
                      styles.categoryButton,
                      active
                        ? styles.categoryButtonActive
                        : styles.categoryButtonInactive,
                      pressed && styles.categoryButtonPressed,
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.categoryText,
                        active
                          ? styles.categoryTextActive
                          : styles.categoryTextInactive,
                      ]}>
                      {c.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Grid de produtos - 3 colunas fixas */}
          <FlatList
            data={filtered}
            numColumns={numColumns}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.productsList}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({item}) => (
              <View style={styles.productCard}>
                {!imageErrors[item.id] ? (
                  <Image
                    source={{uri: item.imagem}}
                    style={styles.productImage}
                    resizeMode="cover"
                    onError={() => handleImageError(item.id)}
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#64748b" />
                  </View>
                )}
                <Text style={styles.productName} numberOfLines={2}>
                  {item.descricao_cupom}
                </Text>
                <Text style={styles.productPrice}>
                  R$ {String((item.preco / 100.0).toFixed(2)).replace('.', ',')}
                </Text>
                <Pressable
                  onPress={() => addToCart(item)}
                  style={({pressed}) => [
                    styles.addButton,
                    pressed && styles.addButtonPressed,
                  ]}>
                  <Text style={styles.addButtonText}>+</Text>
                </Pressable>
              </View>
            )}
          />
        </View>

        {/* Coluna 2 — Carrinho */}
        <View style={styles.cartColumn}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Carrinho</Text>
            <Text style={styles.cartSubtitle}>
              {Object.keys(cart).length} item(ns)
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.cartScrollContent}>
            {Object.values(cart).length === 0 && (
              <Text style={styles.emptyCartText}>Nenhum item no carrinho</Text>
            )}

            {Object.values(cart).map(ci => (
              <View key={ci.product.id} style={styles.cartItem}>
                <Text style={styles.cartItemName} numberOfLines={2}>
                  {ci.product.descricao_cupom}
                </Text>
                <Text style={styles.cartItemPrice}>
                  R$ {String(((ci.product.preco * ci.qty) / 100.0).toFixed(2)).replace('.', ',')} ({ci.qty}x)
                </Text>

                <View style={styles.cartItemControls}>
                  <Pressable
                    onPress={() => dec(ci.product.id)}
                    style={({pressed}) => [
                      styles.cartControlButton,
                      pressed && styles.cartControlButtonPressed,
                    ]}>
                    <Ionicons name="remove" size={18} color="#e2e8f0" />
                  </Pressable>
                  <Pressable
                    onPress={() => inc(ci.product.id)}
                    style={({pressed}) => [
                      styles.cartControlButton,
                      pressed && styles.cartControlButtonPressed,
                    ]}>
                    <Ionicons name="add" size={18} color="#e2e8f0" />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.cartFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {String((total / 100.0).toFixed(2)).replace('.', ',')}</Text>
            </View>

            <Pressable
              onPress={checkout}
              style={({pressed}) => [
                styles.checkoutButton,
                pressed && styles.checkoutButtonPressed,
              ]}>
              <Text style={styles.checkoutButtonText}>Finalizar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2a44',
    backgroundColor: '#0f172a',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleContainer: {
    gap: 2,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerInfo: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '600',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  // Coluna 1 - Produtos (com categorias no topo)
  productsColumn: {
    flex: 7,
    minWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#1f2a44',
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#1f2a44',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#1f2a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f2a44',
    paddingVertical: 12,
  },
  categoriesScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#1f2a44',
    borderColor: '#334155',
  },
  categoryButtonInactive: {
    backgroundColor: '#0f172a',
    borderColor: '#1f2a44',
  },
  categoryButtonPressed: {
    opacity: 0.9,
  },
  categoryText: {
    fontWeight: '500',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  categoryTextInactive: {
    color: '#94a3b8',
  },
  productsList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  columnWrapper: {
    gap: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2a44',
    padding: 8,
    marginBottom: 12,
    gap: 6,
    maxWidth: '31%',
  },
  productName: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  productPrice: {
    color: '#93c5fd',
    fontWeight: '700',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignSelf: 'flex-end',
  },
  addButtonPressed: {
    opacity: 0.9,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  // Coluna 2 - Carrinho
  cartColumn: {
    flex: 3,
    minWidth: 0,
  },
  cartHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2a44',
  },
  cartTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cartSubtitle: {
    color: '#94a3b8',
  },
  cartScrollContent: {
    padding: 12,
    gap: 10,
  },
  emptyCartText: {
    color: '#64748b',
    padding: 8,
  },
  cartItem: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2a44',
    padding: 12,
    gap: 6,
  },
  cartItemName: {
    color: 'white',
    fontWeight: '600',
  },
  cartItemPrice: {
    color: '#93c5fd',
    fontWeight: '700',
  },
  cartItemControls: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  cartControlButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1f2a44',
  },
  cartControlButtonPressed: {
    opacity: 0.9,
  },
  cartFooter: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1f2a44',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: '#94a3b8',
  },
  totalValue: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
  checkoutButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonPressed: {
    opacity: 0.9,
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: '800',
  },
  clearButton: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonPressed: {
    opacity: 0.9,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});