// app/checkout.tsx
import React, {useMemo, useState, useEffect, useRef} from 'react';
import {View, Text, Pressable, Alert, ActivityIndicator} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // RN puro; em Expo: '@expo/vector-icons/Ionicons'

type PaymentMethod = 'credit' | 'debit' | 'pix';

export default function Checkout({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutos em segundos
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {amount} = route.params || {}; // ✅ Correção: usar route.params em vez de navigation.state.params
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

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          Alert.alert(
            'Tempo Expirado',
            'O tempo para finalizar o pagamento expirou. Você será redirecionado para a tela inicial.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ],
          );
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [navigation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{flex: 1, backgroundColor: '#0b1220'}}>
      {/* Cabeçalho com "Voltar" em destaque e Total em destaque */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#1f2a44',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
        <Pressable
          onPress={goHome}
          style={({pressed}) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#f59e0b', // destaque
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 3,
          })}>
          <Ionicons name="arrow-back" size={20} color="#0b1220" />
          <Text style={{color: '#0b1220', fontWeight: '900'}}>
            Voltar para Home
          </Text>
        </Pressable>

        <View style={{alignItems: 'flex-end'}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
            }}>
            <Ionicons
              name="time-outline"
              size={14}
              color={timeLeft <= 30 ? '#ef4444' : '#94a3b8'}
            />
            <Text
              style={{
                color: timeLeft <= 30 ? '#ef4444' : '#94a3b8',
                fontSize: 24,
                fontWeight: '900',
              }}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
      </View>

      {/* 2 blocos (sem scroll horizontal) */}
      <View style={{flex: 1, flexDirection: 'row'}}>
        {/* Bloco 1 — Ações (botões Fiserv) */}
        <View
          style={{
            flex: LEFT_FLEX,
            minWidth: 0,
            borderRightWidth: 1,
            borderRightColor: '#1f2a44',
            padding: 16,
            gap: 16,
          }}>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={{color: '#94a3b8', fontSize: 12}}>Total</Text>
            <Text style={{color: 'white', fontSize: 24, fontWeight: '900'}}>
              R$ {parsedAmount.toFixed(2)}
            </Text>
          </View>
          <Text style={{color: 'white', fontSize: 16, fontWeight: '700'}}>
            Formas de pagamento
          </Text>

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

          <View
            style={{
              marginTop: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#94a3b8"
            />
            <Text style={{color: '#94a3b8'}}>Integração via Fiserv</Text>
          </View>
        </View>

        {/* Bloco 2 — Comprovante da Fiserv */}
        <View style={{flex: RIGHT_FLEX, minWidth: 0, padding: 16}}>
          <Text
            style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 12,
            }}>
            Comprovante da Transação
          </Text>

          {/* 🔹 Container onde a Fiserv renderiza o comprovante */}
          <View
            nativeID="fiserv-receipt-container" // use este id conforme o SDK precisar
            // testID="fiserv-receipt-container"
            style={{
              flex: 1,
              backgroundColor: '#0f172a',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#1f2a44',
              padding: 12,
            }}>
            {/* Deixe vazio para Fiserv injetar o conteúdo */}
          </View>

          {/* Caso a Fiserv use WebView, substitua o bloco acima por: */}
          {/* 
          <WebView
            source={{ uri: fiservReceiptUrl }} // ou html/código base64 fornecido pela Fiserv
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
      style={({pressed}) => ({
        backgroundColor: color,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        opacity: loading ? 0.7 : pressed ? 0.9 : 1,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
      })}>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons name={icon as any} size={22} color="#fff" />
      )}
      <Text style={{color: 'white', fontWeight: '900', fontSize: 16}}>
        {loading ? 'Processando...' : label}
      </Text>
    </Pressable>
  );
}

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
