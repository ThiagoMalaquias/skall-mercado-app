import {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {DeviceEventEmitter} from 'react-native';
import {FormatCentToBRL} from '../utils/formart_brl';
import PrinterService from '../services/service_printer';
import SitefReturn from '../services/services_tef/sitefReturn';
import SitefController from '../services/services_tef/sitefController';
import {get, post} from '../utils/request';

const printerService = new PrinterService();
const sitefController = new SitefController();
const sitefReturn = new SitefReturn();

type PaymentMethod = 'Crédito' | 'Débito' | 'PIX';

type CartItem = {product: any; qty: number};
type ResultItem = {
  id: string;
  time: string;
  text: string;
};

export default function Checkout({navigation}: {navigation: any}) {
  const [processing, setProcessing] = useState<PaymentMethod | null>(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutos em segundos
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [parsedAmount, setParsedAmount] = useState<number>(0);
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const [listOfResults, setListOfResults] = useState<ResultItem[]>([]);
  const [tefToken, setTefToken] = useState<string>('');
  const [tokenLoading, setTokenLoading] = useState(true);

  const paymentMethods: Record<PaymentMethod, string> = {
    Crédito: 'CREDITO',
    Débito: 'DEBITO',
    PIX: 'PIX',
  };

  function startConnectPrinterIntern() {
    printerService.sendStartConnectionPrinterIntern();
  }

  function startActionTEF(
    optionReceived: string,
    paymentMethod: PaymentMethod,
  ) {
    // sendSaleToServer(paymentMethod);
    sendSitefParams(optionReceived, paymentMethod);
  }

  function sendSitefParams(
    optionReceived: string,
    paymentMethod: PaymentMethod,
  ) {
    if (!tefToken) {
      Alert.alert('Alerta', 'Token TEF não disponível. Tente novamente.');
      return;
    }

    if (isIpAdressValid()) {
      sitefController.sitefEntrys.setValue(parsedAmount.toString());
      sitefController.sitefEntrys.setNumberInstallments(parseInt('1', 10));
      sitefController.sitefEntrys.setIp('tls-prod.fiservapp.com');
      sitefController.sitefEntrys.setPaymentMethod(paymentMethod);
      sitefController.sitefEntrys.setInstallmentsMethods('Loja');
      sitefController.sitefEntrys.setEmpresaSitef('24880034');
      sitefController.sitefEntrys.setTokenRegistroTls(tefToken);

      try {
        sitefController.sendParamsSitef(optionReceived);

        let resultReceiveTemp = DeviceEventEmitter.addListener(
          'eventResultSitef',
          event => {
            var actualReturn = event.restultMsitef;

            sitefReturn.receiveResultInJSON(actualReturn);
            optionsReturnMsitef(optionReceived, paymentMethod);
          },
        );

        setTimeout(() => {
          resultReceiveTemp.remove();
        }, 2000);
      } catch (e) {
        //ERRO
      }
    } else {
      Alert.alert('Alerta', 'Verifique seu endereço IP.');
    }
  }

  async function optionsReturnMsitef(
    sitefFunctions: string,
    paymentMethod: PaymentMethod,
  ) {
    if (
      parseInt(sitefReturn.getcODRESP(), 10) < 0 &&
      sitefReturn.getcODAUTORIZACAO() === ''
    ) {
      Alert.alert('Alerta', 'Ocorreu um erro durante a transação.');
    } else {
      if (sitefFunctions === 'SALE') {
        var textToPrinterVIACLIENTE = sitefReturn.vIACLIENTE();

        if (!textToPrinterVIACLIENTE.includes('SiTef')) {
          Alert.alert('Alerta', 'Transação não autorizada');
          return;
        }

        const produtos = Object.values(cart).map(item => ({
          id: item.product.id,
          descricao: item.product.descricao_cupom,
          valor_unitario: item.product.preco,
          valor_total: item.product.preco * item.qty,
          quantidade: item.qty,
        }));

        try {
          const cabecalho = await buildCabecalhoNota();
          await printerService.sendPrinterText(
            cabecalho,
            'Centralizado',
            false,
            false,
            'FONT B',
            0,
          );
          await printerService.jumpLine(1);

          const tableText = buildProdutosTable(produtos);
          await printerService.sendPrinterText(
            tableText,
            'Esquerda',
            false,
            false,
            'FONT B',
            0,
          );

          await printerService.jumpLine(4);

          await printerService.sendPrinterText(
            textToPrinterVIACLIENTE,
            'Centralizado',
            false,
            false,
            'FONT B',
            0,
          );

          await printerService.jumpLine(15);
          await printerService.cutPaper(15);
        } catch (error) {
          console.error('Erro ao imprimir:', error);
        }

        updateListOfResults(textToPrinterVIACLIENTE);
        sendSaleToServer(paymentMethod, produtos);
      }
    }
  }

  function isIpAdressValid() {
    return true;
  }

  async function buildCabecalhoNota(): Promise<string> {
    const L_NOTECAB = 32;
    const nomeLoja =
      (await AsyncStorage.getItem('@SkallApp:filiaNome')) ||
      'Skall Mercadinho 24h';
    const dataHora = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const center = (s: string) => {
      const n = Math.max(0, L_NOTECAB - s.length);
      const left = Math.floor(n / 2);
      return ' '.repeat(left) + s.trim() + ' '.repeat(n - left);
    };

    const sep = '='.repeat(L_NOTECAB);
    const line = '-'.repeat(L_NOTECAB);

    const lines = [
      sep,
      center(nomeLoja),
      '',
      center('COMPROVANTE DE VENDA'),
      center(dataHora),
      line,
    ];

    return lines.join('\n');
  }

  function buildProdutosTable(
    produtos: Array<{
      quantidade: number;
      descricao: string;
      valor_unitario: number;
      valor_total: number;
    }>,
  ) {
    const L = 32;
    const qtdW = 3;
    const descW = 14; // 14 para linha caber em 32 (3+1+14+1+6+1+6=32)
    const vlunW = 6;
    const vltotW = 6;
    const sep = ' ';

    const padR = (s: string, n: number) => s.padStart(n);
    const padL = (s: string, n: number) =>
      s.length > n ? s.slice(0, n - 3) + '...' : s.padEnd(n);

    const line =
      padR('QTD', qtdW) +
      sep +
      padL('DESCRICAO', descW) +
      sep +
      padR('VL.UN', vlunW) +
      sep +
      padR('VL.TOT', vltotW);
    const header = line.slice(0, L);

    const lines: string[] = [header, '-'.repeat(L)];

    let totalCents = 0;
    for (const p of produtos) {
      totalCents += p.valor_total;
      const vlun = FormatCentToBRL(p.valor_unitario);
      const vltot = FormatCentToBRL(p.valor_total);
      const desc = padL(p.descricao || '', descW);
      const row =
        String(Math.min(999, Math.max(0, Number(p.quantidade) || 0))).padStart(
          qtdW,
          '0',
        ) +
        sep +
        desc +
        sep +
        padR(vlun, vlunW) +
        sep +
        padR(vltot, vltotW);
      lines.push(row.slice(0, L));
    }

    lines.push('-'.repeat(L));
    lines.push(padR('TOTAL: R$ ' + FormatCentToBRL(totalCents), L));
    return lines.join('\n');
  }

  function updateListOfResults(textToPrinterVIACLIENTE: string) {
    const copyOfListResultsActual: ResultItem[] = Array.from(listOfResults);

    copyOfListResultsActual.unshift({
      id: Math.floor(Math.random() * 9999999).toString(),
      time: new Date().toLocaleString('pt-BR'),
      text: textToPrinterVIACLIENTE,
    });

    setListOfResults(copyOfListResultsActual);
  }

  async function sendSaleToServer(
    paymentMethod: PaymentMethod,
    produtos: Array<{
      quantidade: number;
      descricao: string;
      valor_unitario: number;
      valor_total: number;
    }>,
  ) {
    const venda = {
      metodo: paymentMethods[paymentMethod],
      valor: parsedAmount,
      produtos: produtos,
    };

    const res = await post('api/v1/vendas', venda);
    if (res.response.status != 201) {
      Alert.alert('Erro ao enviar venda:', res.body.message);
      return;
    }

    setTimeout(() => {
      navigation.navigate('Home');
    }, 3000);
  }

  useEffect(() => {
    const loadTotal = async () => {
      try {
        const total = await AsyncStorage.getItem('@SkallApp:total');
        setParsedAmount(Number(total));
      } catch (error) {
        setParsedAmount(0);
      }
    };
    loadTotal();
  }, []);

  useEffect(() => {
    const loadCart = async () => {
      const cart = await AsyncStorage.getItem('@SkallApp:cart');
      setCart(JSON.parse(cart ?? '{}'));
    };
    loadCart();
  }, []);

  useEffect(() => {
    const loadTefToken = async () => {
      try {
        setTokenLoading(true);
        const usuarioId = await AsyncStorage.getItem('@SkallApp:usuarioId');

        if (!usuarioId) {
          Alert.alert(
            'Erro',
            'Usuário não identificado. Faça login novamente.',
            [{text: 'OK', onPress: () => navigation.goBack()}],
          );
          return;
        }

        const res = await get(`api/v1/filial_usuarios/${usuarioId}`);

        if (res?.response?.ok && res.body?.token) {
          setTefToken(res.body.token);
        } else {
          Alert.alert(
            'Erro',
            res?.body?.error ?? 'Token TEF não encontrado para este usuário.',
          );
        }
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar o token TEF.');
      } finally {
        setTokenLoading(false);
      }
    };

    loadTefToken();
  }, [navigation]);

  useEffect(() => {
    startConnectPrinterIntern();
  }, []);

  const goHome = () => navigation.goBack();

  // useEffect(() => {
  //   intervalRef.current = setInterval(() => {
  //     setTimeLeft((prevTime) => {
  //       if (prevTime <= 1) {
  //         Alert.alert(
  //           "Tempo Expirado",
  //           "O tempo para finalizar o pagamento expirou. Você será redirecionado para a tela inicial.",
  //           [
  //             {
  //               text: "OK",
  //               onPress: () => router.back(),
  //             },
  //           ]
  //         );
  //         return 0;
  //       }
  //       return prevTime - 1;
  //     });
  //   }, 1000);

  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //     }
  //   };
  // }, [router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isTimeLow = timeLeft <= 30;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={goHome}
          style={({pressed}) => [
            styles.backButton,
            {opacity: pressed ? 0.9 : 1},
          ]}>
          <Ionicons name="arrow-back" size={20} color="#0b1220" />
          <Text style={styles.backButtonText}>Voltar para Home</Text>
        </Pressable>

        <View style={styles.timeContainer}>
          <View style={styles.timeContent}>
            <Ionicons
              name="time-outline"
              size={14}
              color={isTimeLow ? '#ef4444' : '#94a3b8'}
            />
            <Text
              style={[
                styles.timeText,
                {color: isTimeLow ? '#ef4444' : '#94a3b8'},
              ]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
      </View>

      {/* 2 blocos (sem scroll horizontal) */}
      <View style={styles.contentContainer}>
        {/* Bloco 1 — Ações (botões Fiserv) */}
        <View style={styles.actionsColumn}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              R$ {String((parsedAmount / 100.0).toFixed(2)).replace('.', ',')}
            </Text>
          </View>
          <Text style={styles.paymentMethodsTitle}>Formas de pagamento</Text>

          {tokenLoading ? (
            <View style={styles.tokenLoadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.tokenLoadingText}>
                Carregando token TEF...
              </Text>
            </View>
          ) : !tefToken ? (
            <Text style={styles.tokenErrorText}>
              Token TEF indisponível. Volte e tente novamente.
            </Text>
          ) : null}

          <BigPayButton
            label="Cartão de Crédito"
            icon="card-outline"
            color="#2563eb"
            loading={tokenLoading}
            disabled={!tefToken || tokenLoading}
            onPress={() => startActionTEF('SALE', 'Crédito')}
          />

          <BigPayButton
            label="Cartão de Débito"
            icon="card"
            color="#0ea5e9"
            loading={tokenLoading}
            disabled={!tefToken || tokenLoading}
            onPress={() => startActionTEF('SALE', 'Débito')}
          />

          <BigPayButton
            label="PIX"
            icon="qr-code-outline"
            color="#16a34a"
            loading={tokenLoading}
            disabled={!tefToken || tokenLoading}
            onPress={() => startActionTEF('SALE', 'PIX')}
          />

          <BigPayButton
            label="Voucher"
            icon="cash-outline"
            color="#16a34a"
            loading={tokenLoading}
            disabled={!tefToken || tokenLoading}
            onPress={() => startActionTEF('SALE', 'Crédito')}
          />

          <View style={styles.fiservInfo}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#94a3b8"
            />
            <Text style={styles.fiservInfoText}>Integração via Fiserv</Text>
          </View>
        </View>

        {/* Bloco 2 — Comprovante da Fiserv */}
        <View style={styles.receiptColumn}>
          <Text style={styles.receiptTitle}>Comprovante da Transação</Text>

          <View
            nativeID="fiserv-receipt-container"
            style={styles.receiptContainer}>
            <FlatList
              data={listOfResults}
              key={index => String(listOfResults)}
              renderItem={({item}, index) => (
                <>
                  <Text key={index} style={styles.receiptText}>
                    {item.time}:
                  </Text>
                  <Text key={index} style={styles.receiptText}>
                    {item.text}
                  </Text>
                  <Text key={index} style={styles.receiptText}>
                    -------------------------------------------
                  </Text>
                </>
              )}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Botão grande reutilizável ---------- */
function BigPayButton({
  label,
  icon,
  color,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  icon: string;
  color: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const isDisabled = !!loading || !!disabled;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.payButton,
        {backgroundColor: color},
        {opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1},
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons name={icon as any} size={22} color="#fff" />
      )}
      <Text style={styles.payButtonText}>
        {loading ? 'Carregando...' : label}
      </Text>
    </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonText: {
    color: '#0b1220',
    fontWeight: '900',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '900',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  actionsColumn: {
    flex: 5,
    minWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#1f2a44',
    padding: 16,
    gap: 16,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  totalValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
  },
  paymentMethodsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  tokenLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenLoadingText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  tokenErrorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  fiservInfo: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fiservInfoText: {
    color: '#94a3b8',
  },
  receiptColumn: {
    flex: 5,
    minWidth: 0,
    padding: 16,
  },
  receiptTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2a44',
    padding: 12,
  },
  receiptText: {
    color: 'white',
  },
  payButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  payButtonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
});
