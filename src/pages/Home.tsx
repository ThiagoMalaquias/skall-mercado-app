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
  const LEFT_FLEX = 2; // categorias
  const CENTER_FLEX = 5; // busca + produtos
  const RIGHT_FLEX = 3; // carrinho

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
    <View style={{flex: 1, backgroundColor: '#0b1220'}}>
      {/* Cabeçalho */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#1f2a44',
        }}>
        <Text style={{color: 'white', fontSize: 18, fontWeight: '700'}}>
          PDV
        </Text>
        <Text style={{color: '#94a3b8'}}>
          3 colunas ajustadas à tela (sem scroll horizontal)
        </Text>
      </View>

      {/* 3 colunas em row, sem Scroll horizontal */}
      <View style={{flex: 1, flexDirection: 'row'}}>
        {/* Coluna 1 — Categorias */}
        <View
          style={{
            flex: LEFT_FLEX,
            minWidth: 0,
            borderRightWidth: 1,
            borderRightColor: '#1f2a44',
          }}>
          <Text
            style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '700',
              padding: 16,
            }}>
            Categorias
          </Text>
          <FlatList
            data={CATEGORIES}
            keyExtractor={item => item.id}
            contentContainerStyle={{paddingHorizontal: 12, paddingBottom: 24}}
            renderItem={({item: c}) => {
              const active = selectedCat === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCat(c.id)}
                  style={({pressed}) => ({
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor: active ? '#1f2a44' : '#0f172a',
                    borderWidth: 1,
                    borderColor: active ? '#334155' : '#1f2a44',
                    opacity: pressed ? 0.9 : 1,
                  })}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: active ? '#e2e8f0' : '#94a3b8',
                      fontWeight: active ? '700' : '500',
                    }}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Coluna 2 — Busca + Produtos */}
        <View
          style={{
            flex: CENTER_FLEX,
            minWidth: 0,
            borderRightWidth: 1,
            borderRightColor: '#1f2a44',
          }}
          onLayout={e => setCenterWidth(e.nativeEvent.layout.width - 24)} // padding compensado
        >
          {/* Busca */}
          <View style={{padding: 16, gap: 10}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#0f172a',
                borderWidth: 1,
                borderColor: '#1f2a44',
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 44,
              }}>
              <Ionicons name="search" size={18} color="#93c5fd" />
              <TextInput
                placeholder="Buscar produtos..."
                placeholderTextColor="#64748b"
                value={query}
                onChangeText={setQuery}
                style={{color: 'white', marginLeft: 8, flex: 1}}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </Pressable>
              )}
            </View>
            <Text style={{color: '#94a3b8'}}>
              {filtered.length} produto(s) ·{' '}
              {selectedCat === 'all'
                ? 'Todas categorias'
                : `Cat. ${selectedCat}`}
            </Text>
          </View>

          {/* Grid de produtos (ajusta colunas automaticamente) */}
          <FlatList
            data={filtered}
            key={numColumns}
            numColumns={numColumns}
            keyExtractor={item => item.id}
            contentContainerStyle={{paddingHorizontal: 12, paddingBottom: 24}}
            columnWrapperStyle={numColumns > 1 ? {gap: 12} : undefined}
            renderItem={({item}) => (
              <View
                style={{
                  flex: 1 / numColumns,
                  backgroundColor: '#0f172a',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#1f2a44',
                  padding: 12,
                  marginBottom: 12,
                  gap: 8,
                }}>
                <Text
                  style={{color: 'white', fontWeight: '700'}}
                  numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={{color: '#93c5fd', fontWeight: '700'}}>
                  R$ {item.price.toFixed(2)}
                </Text>
                <Pressable
                  onPress={() => addToCart(item)}
                  style={({pressed}) => ({
                    marginTop: 6,
                    backgroundColor: '#2563eb',
                    borderRadius: 10,
                    alignItems: 'center',
                    paddingVertical: 10,
                    opacity: pressed ? 0.9 : 1,
                  })}>
                  <Text style={{color: 'white', fontWeight: '700'}}>
                    Adicionar
                  </Text>
                </Pressable>
              </View>
            )}
          />
        </View>

        {/* Coluna 3 — Carrinho */}
        <View style={{flex: RIGHT_FLEX, minWidth: 0}}>
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#1f2a44',
            }}>
            <Text style={{color: 'white', fontSize: 16, fontWeight: '700'}}>
              Carrinho
            </Text>
            <Text style={{color: '#94a3b8'}}>
              {Object.keys(cart).length} item(ns)
            </Text>
          </View>

          <ScrollView contentContainerStyle={{padding: 12, gap: 10}}>
            {Object.values(cart).length === 0 && (
              <Text style={{color: '#64748b', padding: 8}}>
                Nenhum item no carrinho
              </Text>
            )}

            {Object.values(cart).map(ci => (
              <View
                key={ci.product.id}
                style={{
                  backgroundColor: '#0f172a',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#1f2a44',
                  padding: 12,
                  gap: 6,
                }}>
                <Text
                  style={{color: 'white', fontWeight: '600'}}
                  numberOfLines={2}>
                  {ci.product.name}
                </Text>
                <Text style={{color: '#93c5fd', fontWeight: '700'}}>
                  R$ {(ci.product.price * ci.qty).toFixed(2)} ({ci.qty}x)
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    alignItems: 'center',
                  }}>
                  <Pressable
                    onPress={() => dec(ci.product.id)}
                    style={({pressed}) => ({
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      backgroundColor: '#1f2a44',
                      opacity: pressed ? 0.9 : 1,
                    })}>
                    <Ionicons name="remove" size={18} color="#e2e8f0" />
                  </Pressable>
                  <Pressable
                    onPress={() => inc(ci.product.id)}
                    style={({pressed}) => ({
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      backgroundColor: '#1f2a44',
                      opacity: pressed ? 0.9 : 1,
                    })}>
                    <Ionicons name="add" size={18} color="#e2e8f0" />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          <View
            style={{
              padding: 16,
              gap: 10,
              borderTopWidth: 1,
              borderTopColor: '#1f2a44',
            }}>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={{color: '#94a3b8'}}>Total</Text>
              <Text style={{color: 'white', fontWeight: '800', fontSize: 16}}>
                R$ {total.toFixed(2)}
              </Text>
            </View>

            <Pressable
              onPress={checkout}
              style={({pressed}) => ({
                backgroundColor: '#16a34a',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
              })}>
              <Text style={{color: 'white', fontWeight: '800'}}>Finalizar</Text>
            </Pressable>

            <Pressable
              onPress={clearCart}
              style={({pressed}) => ({
                backgroundColor: '#334155',
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
              })}>
              <Text style={{color: 'white', fontWeight: '700'}}>Limpar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
