import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useCart} from '../contexts/CartContext';

export function CheckoutScreen({navigation}: {navigation: any}) {
  const {items, total, clearCart} = useCart();
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
  });

  const handlePayment = () => {
    // Aqui você implementaria a integração com um gateway de pagamento
    Alert.alert('Sucesso!', 'Pagamento realizado com sucesso!', [
      {
        text: 'OK',
        onPress: () => {
          clearCart();
          navigation.navigate('Home');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finalizar Compra</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
        {items.map(item => (
          <View key={item.id} style={styles.summaryItem}>
            <Text>
              {item.name} x {item.quantity}
            </Text>
            <Text>R$ {(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <Text style={styles.total}>Total: R$ {total.toFixed(2)}</Text>
      </View>

      <View style={styles.paymentForm}>
        <Text style={styles.formTitle}>Informações de Pagamento</Text>

        <TextInput
          style={styles.input}
          placeholder="Número do Cartão"
          value={paymentInfo.cardNumber}
          onChangeText={text =>
            setPaymentInfo({...paymentInfo, cardNumber: text})
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Nome no Cartão"
          value={paymentInfo.name}
          onChangeText={text => setPaymentInfo({...paymentInfo, name: text})}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Validade (MM/AA)"
            value={paymentInfo.expiryDate}
            onChangeText={text =>
              setPaymentInfo({...paymentInfo, expiryDate: text})
            }
          />

          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="CVV"
            value={paymentInfo.cvv}
            onChangeText={text => setPaymentInfo({...paymentInfo, cvv: text})}
          />
        </View>

        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Text style={styles.payButtonText}>Pagar R$ {total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  summary: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  paymentForm: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  payButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  payButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
