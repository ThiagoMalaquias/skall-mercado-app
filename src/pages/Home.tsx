import {useEffect, useMemo, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {get} from '../utils/request';

type Category = {id: string; nome: string};
type Product = {
  id: string;
  descricao_cupom: string;
  preco: number;
  grupo_produto_id: string;
  imagem: string;
  codigo_venda: string;
};
type CartItem = {product: Product; qty: number; addedAt: number};

type ToastType = 'success' | 'error' | 'info';

function Toast({
  message,
  type,
  visible,
}: {
  message: string;
  type: ToastType;
  visible: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      // Anima entrada
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss após 2 segundos
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Reset quando não visível
      opacity.setValue(0);
      translateY.setValue(-50);
    }
  }, [visible, opacity, translateY]);

  if (!visible) return null;

  const backgroundColor =
    type === 'success' ? '#16a34a' : type === 'error' ? '#ef4444' : '#2563eb';
  const iconName =
    type === 'success'
      ? 'checkmark-circle'
      : type === 'error'
      ? 'close-circle'
      : 'information-circle';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity,
          transform: [{translateY}],
        },
      ]}>
      <View style={[styles.toastContent, {backgroundColor}]}>
        <Ionicons name={iconName} size={20} color="white" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

export default function Home({navigation}: {navigation: any}) {
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(9);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<TextInput>(null);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBarcodeRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const cartScrollViewRef = useRef<ScrollView>(null);

  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  const [cpfModalVisible, setCpfModalVisible] = useState(false);
  const [cpfDigits, setCpfDigits] = useState('');
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [cpfValidated, setCpfValidated] = useState(false);
  const [cpfLoading, setCpfLoading] = useState(false);
  const [bebidasGrupoIds, setBebidasGrupoIds] = useState<string[] | null>(
    null,
  );
  const [bebidasLoading, setBebidasLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  const isBusy = finalizeLoading || bebidasLoading || cpfLoading;

  const formatCPFInput = (digits: string) => {
    const d = digits.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  const normalizeText = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const isValidCPF = (digits: string) => {
    const cpf = digits.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    const calcCheckDigit = (base: string, factor: number) => {
      let total = 0;
      for (let i = 0; i < base.length; i++) {
        total += parseInt(base[i], 10) * factor--;
      }
      const mod = total % 11;
      return mod < 2 ? 0 : 11 - mod;
    };

    const base = cpf.slice(0, 9);
    const digit1 = calcCheckDigit(base, 10);
    const digit2 = calcCheckDigit(base + digit1, 11);

    return cpf.endsWith(`${digit1}${digit2}`);
  };

  const ensureBebidasGrupoIds = async () => {
    if (bebidasGrupoIds) return bebidasGrupoIds;

    setBebidasLoading(true);
    try {
      const res = await get('api/v1/grupo_produtos');
      const groups = res?.body ?? [];

      const ids = groups
        .filter((g: any) => {
          const nome = normalizeText(String(g?.nome ?? ''));
          return (
            nome.includes('bebidas') &&
            (nome.includes('alcool') || nome.includes('alcoolicas'))
          );
        })
        .map((g: any) => String(g?.id));

      setBebidasGrupoIds(ids);
      return ids;
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível identificar o grupo de bebidas no momento.',
      );
      setBebidasGrupoIds([]);
      return [];
    } finally {
      setBebidasLoading(false);
    }
  };

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    // Auto-hide após animação
    setTimeout(() => {
      setToastVisible(false);
    }, 2300);
  }, []);

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => ({...prev, [itemId]: true}));
  };

  const filtered = products;

  const numColumns = 3;

  const addToCart = (product: Product) => {
    setCart(prev => {
      const it = prev[product.id];
      const isNewProduct = !it;
      const qty = it ? it.qty + 1 : 1;
      const addedAt = it ? it.addedAt : Date.now();

      if (isNewProduct) {
        setTimeout(() => {
          cartScrollViewRef.current?.scrollToEnd({animated: true});
        }, 100);
      }

      return {...prev, [product.id]: {product, qty, addedAt}};
    });
  };

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

  const clearCart = () => {
    if (Object.keys(cart).length === 0) {
      return;
    }

    Alert.alert(
      'Limpar carrinho',
      'Tem certeza que deseja remover todos os itens do carrinho?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            setCart({});
            setCpfValidated(false);
            setCpfDigits('');
            setCpfError(null);
            setCpfModalVisible(false);
            AsyncStorage.removeItem('@SkallApp:cart');
            AsyncStorage.removeItem('@SkallApp:total');
            AsyncStorage.removeItem('@SkallApp:cpf');
          },
        },
      ],
    );
  };

  const findProductByBarcode = useCallback(
    async (barcode: string) => {
      if (isProcessingRef.current) {
        return;
      }

      try {
        const cleanBarcode = barcode.trim();

        if (cleanBarcode.length < 8) {
          return;
        }

        if (lastBarcodeRef.current === cleanBarcode) {
          return;
        }

        isProcessingRef.current = true;
        lastBarcodeRef.current = cleanBarcode;

        const data = await get(`api/v1/produtos?codigo_barras=${cleanBarcode}`);

        if (data.body && data.body.length > 0) {
          const product = data.body[0];
          addToCart(product);
          showToast(`✓ ${product.descricao_cupom} adicionado`, 'success');
        } else {
          showToast(`Produto não encontrado: ${cleanBarcode}`, 'error');
        }
      } catch (error) {
        showToast('Erro ao buscar produto', 'error');
      } finally {
        setBarcodeInput('');
        setTimeout(() => {
          isProcessingRef.current = false;
          lastBarcodeRef.current = '';

          setTimeout(() => {
            barcodeInputRef.current?.focus();
          }, 500); // Reduzido para 500ms já que não precisa fechar alert
        }, 300); // Reduzido para 300ms
      }
    },
    [showToast],
  );

  const handleBarcodeChange = useCallback(
    (text: string) => {
      setBarcodeInput(text);

      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }

      barcodeTimeoutRef.current = setTimeout(() => {
        if (text.length >= 8 && !isProcessingRef.current) {
          findProductByBarcode(text);
        }
      }, 500);
    },
    [findProductByBarcode],
  );

  const proceedCheckout = async () => {
    if (Object.keys(cart).length === 0) {
      Alert.alert('Atenção', 'Nenhum item no carrinho');
      return;
    }

    setFinalizeLoading(true);
    try {
      await AsyncStorage.setItem('@SkallApp:cart', JSON.stringify(cart));
      await AsyncStorage.setItem('@SkallApp:total', total.toString());

      if (cpfValidated && cpfDigits.length === 11) {
        await AsyncStorage.setItem('@SkallApp:cpf', cpfDigits);
      } else {
        await AsyncStorage.removeItem('@SkallApp:cpf');
      }

      navigation.navigate('Checkout');
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
      Alert.alert('Erro', 'Não foi possível finalizar. Tente novamente.');
    } finally {
      setFinalizeLoading(false);
    }
  };

  const checkout = async () => {
    if (isBusy) return;

    if (Object.keys(cart).length === 0) {
      Alert.alert('Atenção', 'Nenhum item no carrinho');
      return;
    }

    const ids = await ensureBebidasGrupoIds();
    const cartItems = Object.values(cart);
    const temBebida = ids.length
      ? cartItems.some(ci =>
          ids.includes(String(ci.product.grupo_produto_id)),
        )
      : false;

    if (temBebida && !cpfValidated) {
      setCpfError(null);
      setCpfModalVisible(true);
      return;
    }

    await proceedCheckout();
  };

  const onConfirmCPF = async () => {
    setCpfError(null);

    if (!isValidCPF(cpfDigits)) {
      setCpfError('CPF inválido. Verifique e tente novamente.');
      return;
    }

    setCpfLoading(true);
    try {
      setCpfValidated(true);
      setCpfModalVisible(false);
      await proceedCheckout();
    } finally {
      setCpfLoading(false);
    }
  };

  const getCategories = async () => {
    try {
      const data = await get('api/v1/grupo_produtos');
      setCategories([{id: 'all', nome: 'TODAS'}, ...data.body]);
    } catch (error) {
      Alert.alert('Erro ao buscar produtos', 'Tente novamente mais tarde');
    }
  };

  const getProducts = async (
    pageNumber: number = 1,
    append: boolean = false,
  ) => {
    try {
      if (!append) {
        setLoadingMore(true);
      }

      let url = `api/v1/produtos?page=${pageNumber}&per_page=${perPage}`;

      if (selectedCat && selectedCat !== 'all') {
        url += `&grupo_produto_id=${selectedCat}`;
      }

      if (query && query.trim()) {
        url += `&search=${encodeURIComponent(query.trim())}`;
      }

      const data = await get(url);

      if (append) {
        setProducts(prev => [...prev, ...data.body]);
      } else {
        setProducts(data.body);
      }

      setHasMore(data.body.length === perPage);
    } catch (error) {
      Alert.alert('Erro ao buscar produtos', 'Tente novamente mais tarde');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    setPage(nextPage);
    await getProducts(nextPage, true);
  };

  useEffect(() => {
    ensureBebidasGrupoIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCpfValidated(false);
    setCpfDigits('');
    setCpfError(null);
    setCpfModalVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(cart).join('|')]);

  useEffect(() => {
    getProducts(1, false);
    getCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    getProducts(1, false);
  }, [selectedCat, query]);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 150);

      return () => clearTimeout(t);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      isProcessingRef.current = false;
      lastBarcodeRef.current = '';
      setBarcodeInput('');

      const t = setTimeout(() => barcodeInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }, []),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    getProducts(1, false);
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
      <Toast message={toastMessage} type={toastType} visible={toastVisible} />

      <Modal
        visible={cpfModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCpfModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>CPF obrigatório</Text>
            <Text style={styles.modalSubtitle}>
              Bebidas alcoólicas. Digite um CPF válido para continuar.
            </Text>

            <TextInput
              value={formatCPFInput(cpfDigits)}
              onChangeText={text => {
                const digits = text.replace(/\D/g, '').slice(0, 11);
                setCpfDigits(digits);
                setCpfError(null);
              }}
              placeholder="000.000.000-00"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              autoFocus
              style={styles.modalInput}
              maxLength={14}
            />

            {!!cpfError && <Text style={styles.modalError}>{cpfError}</Text>}

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setCpfModalVisible(false)}
                style={({pressed}) => [
                  styles.modalButtonSecondary,
                  pressed && styles.modalButtonSecondaryPressed,
                ]}
                disabled={cpfLoading}>
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={onConfirmCPF}
                style={({pressed}) => [
                  styles.modalButtonPrimary,
                  pressed && styles.modalButtonPrimaryPressed,
                ]}
                disabled={cpfLoading}>
                <Text style={styles.modalButtonTextPrimary}>
                  {cpfLoading ? 'Validando...' : 'Confirmar CPF'}
                </Text>
              </Pressable>
            </View>

            {bebidasLoading && (
              <Text style={styles.modalHint}>Carregando...</Text>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.barcodeInputWrapper} pointerEvents="auto">
        <TextInput
          ref={barcodeInputRef}
          value={barcodeInput}
          onChangeText={handleBarcodeChange}
          style={styles.barcodeInput}
          showSoftInputOnFocus={false}
          blurOnSubmit={false}
          caretHidden
          contextMenuHidden
        />
      </View>

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
            <Pressable
              onPress={clearCart}
              style={({pressed}) => [
                styles.clearCartButton,
                pressed && styles.clearCartButtonPressed,
                Object.keys(cart).length === 0 &&
                  styles.clearCartButtonDisabled,
              ]}
              disabled={Object.keys(cart).length === 0}>
              <Ionicons
                name="trash-outline"
                size={20}
                color={Object.keys(cart).length === 0 ? '#475569' : '#ef4444'}
              />
              <Text
                style={[
                  styles.clearCartText,
                  Object.keys(cart).length === 0 &&
                    styles.clearCartTextDisabled,
                ]}>
                Limpar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.columnsContainer}>
        <View style={styles.productsColumn}>
          <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              keyboardShouldPersistTaps="always"
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

          <FlatList
            data={filtered}
            numColumns={numColumns}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.productsList}
            columnWrapperStyle={styles.columnWrapper}
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text style={styles.loadingText}>
                    Carregando mais produtos...
                  </Text>
                </View>
              ) : null
            }
            renderItem={({item}) => (
              <View style={styles.productCard}>
                {/* Container da imagem com botão sobreposto */}
                <View style={styles.imageContainer}>
                  {!imageErrors[item.id] ? (
                    <Image
                      source={{uri: item.imagem}}
                      style={styles.productImage}
                      resizeMode="cover"
                      onError={() => handleImageError(item.id)}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons
                        name="image-outline"
                        size={40}
                        color="#64748b"
                      />
                    </View>
                  )}
                  <Pressable
                    onPress={() => addToCart(item)}
                    style={({pressed}) => [
                      styles.addButton,
                      pressed && styles.addButtonPressed,
                    ]}>
                    <Text style={styles.addButtonText}>+</Text>
                  </Pressable>
                </View>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.descricao_cupom}
                </Text>
                <Text style={styles.productPrice}>
                  R$ {String((item.preco / 100.0).toFixed(2)).replace('.', ',')}
                </Text>
              </View>
            )}
          />
        </View>

        <View style={styles.cartColumn}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Carrinho</Text>
            <Text style={styles.cartSubtitle}>
              {Object.keys(cart).length} item(ns)
            </Text>
          </View>

          <ScrollView
            ref={cartScrollViewRef}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.cartScrollContent}>
            {Object.values(cart).length === 0 && (
              <Text style={styles.emptyCartText}>Nenhum item no carrinho</Text>
            )}

            {Object.values(cart)
              .sort((a, b) => a.addedAt - b.addedAt)
              .map(ci => (
                <View key={ci.product.id} style={styles.cartItem}>
                  <Text style={styles.cartItemName} numberOfLines={2}>
                    {ci.product.descricao_cupom}
                  </Text>
                  <Text style={styles.cartItemPrice}>
                    R${' '}
                    {String(
                      ((ci.product.preco * ci.qty) / 100.0).toFixed(2),
                    ).replace('.', ',')}{' '}
                    ({ci.qty}x)
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
              <Text style={styles.totalValue}>
                R$ {String((total / 100.0).toFixed(2)).replace('.', ',')}
              </Text>
            </View>

            <Pressable
              onPress={checkout}
              disabled={isBusy}
              style={({pressed}) => [
                styles.checkoutButton,
                pressed && styles.checkoutButtonPressed,
                isBusy && styles.checkoutButtonDisabled,
              ]}>
              {isBusy ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.checkoutButtonText}>Finalizar</Text>
              )}
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
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    maxWidth: '90%',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  barcodeInputWrapper: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: 0,
    left: 0,
  },
  barcodeInput: {
    width: 1,
    height: 1,
    fontSize: 1,
    padding: 0,
    margin: 0,
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
  clearCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1f2a44',
    borderWidth: 1,
    borderColor: '#334155',
  },
  clearCartButtonPressed: {
    opacity: 0.8,
  },
  clearCartButtonDisabled: {
    opacity: 0.5,
  },
  clearCartText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  clearCartTextDisabled: {
    color: '#475569',
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
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#1f2a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonPressed: {
    opacity: 0.9,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
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
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2a44',
    gap: 12,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#111c33',
    color: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  modalError: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondaryPressed: {
    opacity: 0.9,
  },
  modalButtonPrimary: {
    flex: 2,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimaryPressed: {
    opacity: 0.9,
  },
  modalButtonTextSecondary: {
    color: 'white',
    fontWeight: '900',
    fontSize: 14,
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontWeight: '900',
    fontSize: 14,
  },
  modalHint: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
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
