import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet, FlatList } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';


import {DeviceEventEmitter} from 'react-native';

import PrinterService from '../services/service_printer';
import SitefReturn from '../services/services_tef/sitefReturn';
import SitefController from '../services/services_tef/sitefController';
import { post } from "../utils/request";

const printerService = new PrinterService();
const sitefController = new SitefController();
const sitefReturn = new SitefReturn();

type PaymentMethod = "Crédito" | "Débito" | "PIX";

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
  const [numParcelas, setNumParcelas] = useState('1');
  const [numIP, setNumIP] = useState('tls-prod.fiservapp.com');
  const [installmentType, setInstallmentType] = useState('Loja');
  const [empresaSitef, setEmpresaSitef] = useState('24880034');

  const paymentMethods: Record<PaymentMethod, string> = {
    'Crédito': 'CREDITO',
    'Débito': 'DEBITO',
    'PIX': 'PIX',
  };


  function startConnectPrinterIntern() {
    printerService.sendStartConnectionPrinterIntern();
  }

  function startActionTEF(optionReceived: string, paymentMethod: PaymentMethod) {
    // sendSaleToServer(paymentMethod);
    sendSitefParams(optionReceived, paymentMethod);
  }

  function sendSitefParams(optionReceived: string, paymentMethod: PaymentMethod) {
    if (isIpAdressValid()) {
      sitefController.sitefEntrys.setValue(parsedAmount.toString());
      // sitefController.sitefEntrys.setValue('100');
      sitefController.sitefEntrys.setNumberInstallments(
        parseInt(numParcelas, 10),
      );
      sitefController.sitefEntrys.setIp(numIP);
      sitefController.sitefEntrys.setPaymentMethod(paymentMethod);
      sitefController.sitefEntrys.setInstallmentsMethods(installmentType);
      sitefController.sitefEntrys.setEmpresaSitef(empresaSitef);

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

  function optionsReturnMsitef(sitefFunctions: string, paymentMethod: PaymentMethod) {
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

        printerService.sendPrinterText(
          textToPrinterVIACLIENTE,
          'Centralizado',
          false,
          false,
          'FONT B',
          0,
        );
        printerService.jumpLine(10);
        printerService.cutPaper(10);

        updateListOfResults(textToPrinterVIACLIENTE);
        sendSaleToServer(paymentMethod);
      }
    }
  }

  function isIpAdressValid() {
    return true;
  }

  function updateListOfResults(
    textToPrinterVIACLIENTE: string,
  ) {
    const copyOfListResultsActual: ResultItem[] = Array.from(listOfResults);

    copyOfListResultsActual.unshift({
      id: Math.floor(Math.random() * 9999999).toString(),
      time: new Date().toLocaleString('pt-BR'),
      text: textToPrinterVIACLIENTE,
    });

    setListOfResults(copyOfListResultsActual);
  }

  async function sendSaleToServer(paymentMethod: PaymentMethod) {
    const produtos = Object.values(cart).map(item => ({
      id: item.product.id,
      descricao: item.product.descricao_cupom,
      valor_unitario: item.product.preco,
      valor_total: item.product.preco * item.qty,
      quantidade: item.qty,
    }));

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
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const isTimeLow = timeLeft <= 30;

  return (
    <View style={styles.container}>
      {/* Cabeçalho com "Voltar" em destaque e Total em destaque */}
      <View style={styles.header}>
        <Pressable
          onPress={goHome}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color="#0b1220" />
          <Text style={styles.backButtonText}>
            Voltar para Home
          </Text>
        </Pressable>

        <View style={styles.timeContainer}>
          <View style={styles.timeContent}>
            <Ionicons
              name="time-outline"
              size={14}
              color={isTimeLow ? "#ef4444" : "#94a3b8"}
            />
            <Text style={[styles.timeText, { color: isTimeLow ? "#ef4444" : "#94a3b8" }]}>
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
          <Text style={styles.paymentMethodsTitle}>
            Formas de pagamento
          </Text>

          <BigPayButton
            label="Cartão de Crédito"
            icon="card-outline"
            color="#2563eb"
            loading={processing === "Crédito"}
            onPress={() => startActionTEF('SALE', 'Crédito')}
          />

          <BigPayButton
            label="Cartão de Débito"
            icon="card"
            color="#0ea5e9"
            loading={processing === "Débito"}
            onPress={() => startActionTEF('SALE', 'Débito')}
          />

          <BigPayButton
            label="PIX"
            icon="qr-code-outline"
            color="#16a34a"
            loading={processing === "PIX"}
            onPress={() => startActionTEF('SALE', 'PIX')}
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
          <Text style={styles.receiptTitle}>
            Comprovante da Transação
          </Text>

          <View
            nativeID="fiserv-receipt-container"
            style={styles.receiptContainer}
          >
            <FlatList
              data={listOfResults}
              key={index => String(listOfResults)}
              renderItem={({item}, index) => (
                <>
                  <Text key={index} style={styles.receiptText}>{item.time}:</Text>
                  <Text key={index} style={styles.receiptText}>{item.text}</Text>
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
  onPress,
}: {
  label: string;
  icon: string;
  color: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={!!loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.payButton,
        { backgroundColor: color },
        { opacity: loading ? 0.7 : pressed ? 0.9 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons name={icon as any} size={22} color="#fff" />
      )}
      <Text style={styles.payButtonText}>
        {loading ? "Processando..." : label}
      </Text>
    </Pressable>
  );
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2a44",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f59e0b",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonText: {
    color: "#0b1220",
    fontWeight: "900",
  },
  timeContainer: {
    alignItems: "flex-end",
  },
  timeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 24,
    fontWeight: "900",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
  },
  actionsColumn: {
    flex: 5,
    minWidth: 0,
    borderRightWidth: 1,
    borderRightColor: "#1f2a44",
    padding: 16,
    gap: 16,
  },
  totalContainer: {
    alignItems: "flex-end",
  },
  totalLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  totalValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },
  paymentMethodsTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  fiservInfo: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fiservInfoText: {
    color: "#94a3b8",
  },
  receiptColumn: {
    flex: 5,
    minWidth: 0,
    padding: 16,
  },
  receiptTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2a44",
    padding: 12,
  },
  receiptText: {
    color: 'white',
  },
  payButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  payButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
});