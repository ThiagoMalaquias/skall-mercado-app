// app/checkout.tsx
import React, {useMemo, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type PaymentMethod = 'credit' | 'debit' | 'pix';

export default function Checkout({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const [timeLeft, setTimeLeft] = useState(180); // 2 minutos em segundos
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {amount} = route.params || {};
  const parsedAmount = useMemo(() => {
    const raw = Array.isArray(amount) ? amount[0] : amount;
    const n = parseFloat(raw ?? '0');
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  // layout: 2 blocos
  const LEFT_FLEX = 5; // Ações (botões)
  const RIGHT_FLEX = 5; // Comprovante (Fiserv)

  const [processing, setProcessing] = useState<PaymentMethod | null>(null);

  const onPay = async (method: PaymentMethod) => {
    try {
      setProcessing(method);
      // 👉 Substitua por sua chamada real Fiserv (POS/PinPad/API)
      await wait(1000);
      Alert.alert(
        'Fiserv',
        `Disparado ${method.toUpperCase()} para R$ ${parsedAmount.toFixed(2)}`,
      );
      // A Fiserv deve renderizar o comprovante no container à direita.
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao processar pagamento.');
    } finally {
      setProcessing(null);
    }
  };

  const goHome = () => navigation.goBack();

  // useEffect(() => {
  //   intervalRef.current = setInterval(() => {
  //     setTimeLeft(prevTime => {
  //       if (prevTime <= 1) {
  //         navigation.goBack();
  //       }
  //       return prevTime - 1;
  //     });
  //   }, 1000);

  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //     }
  //   };
  // }, [navigation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isTimerWarning = timeLeft <= 30;

  return (
    <View style={styles.container}>
      {/* Cabeçalho com "Voltar" em destaque e Total em destaque */}
      <View style={styles.header}>
        <Pressable
          onPress={goHome}
          style={({pressed}) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}>
          <Ionicons name="arrow-back" size={20} color="#0b1220" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <View style={styles.timerContainer}>
          <View style={styles.timerRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={isTimerWarning ? '#ef4444' : '#94a3b8'}
            />
            <Text
              style={[
                styles.timerText,
                isTimerWarning
                  ? styles.timerTextWarning
                  : styles.timerTextNormal,
              ]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
      </View>

      {/* 2 blocos (sem scroll horizontal) */}
      <View style={styles.columnsContainer}>
        {/* Bloco 1 — Ações (botões Fiserv) */}
        <View style={styles.actionsColumn}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              R$ {parsedAmount.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.paymentMethodsTitle}>Formas de pagamento</Text>

          <BigPayButton
            label="Cartão de Crédito"
            icon="card-outline"
            color="#2563eb"
            loading={processing === 'credit'}
            onPress={() => onPay('credit')}
          />

          <BigPayButton
            label="Cartão de Débito"
            icon="card"
            color="#0ea5e9"
            loading={processing === 'debit'}
            onPress={() => onPay('debit')}
          />

          <BigPayButton
            label="PIX"
            icon="qr-code-outline"
            color="#16a34a"
            loading={processing === 'pix'}
            onPress={() => onPay('pix')}
          />

          <BigPayButton
            label="Transferência"
            icon="qr-code-outline"
            color="#d946ef"
            onPress={() => navigation.navigate('Tef')}
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

          {/* 🔹 Container onde a Fiserv renderiza o comprovante */}
          <View
            nativeID="fiserv-receipt-container"
            style={styles.receiptContainer}>
            {/* Deixe vazio para Fiserv injetar o conteúdo */}
          </View>

          {/* Caso a Fiserv use WebView, substitua o bloco acima por: */}
          {/* 
          <WebView
            source={{ uri: fiservReceiptUrl }}
            style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}
          />
          */}
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
      style={({pressed}) => [
        styles.payButton,
        {backgroundColor: color},
        loading && styles.payButtonLoading,
        pressed && !loading && styles.payButtonPressed,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons name={icon as any} size={22} color="#fff" />
      )}
      <Text style={styles.payButtonText}>
        {loading ? 'Processando...' : label}
      </Text>
    </Pressable>
  );
}

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

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
  backButtonPressed: {
    opacity: 0.9,
  },
  backButtonText: {
    color: '#0b1220',
    fontWeight: '900',
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '900',
  },
  timerTextNormal: {
    color: '#94a3b8',
  },
  timerTextWarning: {
    color: '#ef4444',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  // Bloco 1 - Ações
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
  fiservInfo: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fiservInfoText: {
    color: '#94a3b8',
  },
  // Bloco 2 - Comprovante
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
  // BigPayButton
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
  payButtonPressed: {
    opacity: 0.9,
  },
  payButtonLoading: {
    opacity: 0.7,
  },
  payButtonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
});