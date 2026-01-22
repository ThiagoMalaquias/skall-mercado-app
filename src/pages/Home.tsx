// app/home.tsx
import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  useWindowDimensions,
  Alert,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Category = {id: string; name: string};
type Product = {id: string; name: string; price: number; categoryId: string};
type CartItem = {product: Product; qty: number};

const CATEGORIES: Category[] = [
  {id: 'all', name: 'Todas'},
  {id: '1', name: 'Bebidas'},
  {id: '2', name: 'Lanches'},
  {id: '3', name: 'Doces'},
  {id: '4', name: 'Higiene'},
  {id: '5', name: 'Limpeza'},
];

const PRODUCTS: Product[] = Array.from({length: 60}).map((_, i) => ({
  id: String(i + 1),
  name: `Produto ${i + 1}`,
  price: Number((Math.random() * 90 + 5).toFixed(2)),
  categoryId: CATEGORIES[(i % (CATEGORIES.length - 1)) + 1].id,
}));



export default function Home({navigation}: {navigation: any}) {
  const {width, height} = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 768;

  // Proporções fixas (ajuste se quiser)
  // const LEFT_FLEX = 2; // categorias
  // const CENTER_FLEX = 5; // busca + produtos
  // const RIGHT_FLEX = 3; // carrinho

  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [centerWidth, setCenterWidth] = useState<number>(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter(p => {
      const okCat = selectedCat === 'all' || p.categoryId === selectedCat;
      const okTxt = !q || p.name.toLowerCase().includes(q);
      return okCat && okTxt;
    });
  }, [query, selectedCat]);

  // Grid dinâmico conforme a largura da coluna central
  const CARD_MIN = isTablet ? 180 : 140;
  const numColumns = Math.max(
    1,
    Math.min(6, Math.floor(centerWidth / CARD_MIN)),
  );

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

  const clearCart = () => setCart({});
  const total = useMemo(
    () => Object.values(cart).reduce((s, i) => s + i.product.price * i.qty, 0),
    [cart],
  );
  const checkout = () => {
    navigation.navigate('Checkout');
    if (!Object.keys(cart).length) return Alert.alert('Carrinho vazio');
    Alert.alert('Finalizar', `Total: R$ ${total.toFixed(2)}`);
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PDV</Text>
        <Text style={styles.headerSubtitle}>
          3 colunas ajustadas à tela (sem scroll horizontal)
        </Text>
      </View>

      {/* 3 colunas em row, sem Scroll horizontal */}
      <View style={styles.columnsContainer}>
        {/* Coluna 1 — Categorias */}
        <View style={styles.categoriesColumn}>
          <Text style={styles.categoriesTitle}>Categorias</Text>
          <FlatList
            data={CATEGORIES}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.categoriesList}
            renderItem={({item: c}) => {
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
                    {c.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Coluna 2 — Busca + Produtos */}
        <View
          style={styles.centerColumn}
          onLayout={e => setCenterWidth(e.nativeEvent.layout.width - 24)}>
          {/* Grid de produtos (ajusta colunas automaticamente) */}
          <FlatList
            data={filtered}
            key={numColumns}
            numColumns={numColumns}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.productsList}
            columnWrapperStyle={numColumns > 1 ? {gap: 12} : undefined}
            renderItem={({item}) => (
              <View
                style={[
                  styles.productCard,
                  {flex: 1 / numColumns},
                ]}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>
                  R$ {item.price.toFixed(2)}
                </Text>
                <Pressable
                  onPress={() => addToCart(item)}
                  style={({pressed}) => [
                    styles.addButton,
                    pressed && styles.addButtonPressed,
                  ]}>
                  <Text style={styles.addButtonText}>Adicionar</Text>
                </Pressable>
              </View>
            )}
          />
        </View>

        {/* Coluna 3 — Carrinho */}
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
                  {ci.product.name}
                </Text>
                <Text style={styles.cartItemPrice}>
                  R$ {(ci.product.price * ci.qty).toFixed(2)} ({ci.qty}x)
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
              <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
            </View>

            <Pressable
              onPress={checkout}
              style={({pressed}) => [
                styles.checkoutButton,
                pressed && styles.checkoutButtonPressed,
              ]}>
              <Text style={styles.checkoutButtonText}>Finalizar</Text>
            </Pressable>

            <Pressable
              onPress={clearCart}
              style={({pressed}) => [
                styles.clearButton,
                pressed && styles.clearButtonPressed,
              ]}>
              <Text style={styles.clearButtonText}>Limpar</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2a44',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#94a3b8',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  // Coluna 1 - Categorias
  categoriesColumn: {
    flex: 2,
    minWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#1f2a44',
  },
  categoriesTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    padding: 16,
  },
  categoriesList: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
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
  },
  categoryTextActive: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  categoryTextInactive: {
    color: '#94a3b8',
  },
  // Coluna 2 - Busca + Produtos
  centerColumn: {
    flex: 5,
    minWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#1f2a44',
  },
  searchContainer: {
    padding: 16,
    gap: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2a44',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  searchInfo: {
    color: '#94a3b8',
  },
  productsList: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2a44',
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  productName: {
    color: 'white',
    fontWeight: '700',
  },
  productPrice: {
    color: '#93c5fd',
    fontWeight: '700',
  },
  addButton: {
    marginTop: 6,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  addButtonPressed: {
    opacity: 0.9,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  // Coluna 3 - Carrinho
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