import {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Função para formatar telefone no formato (00) 00000-0000
const formatPhone = (text: string): string => {
  // Remove tudo que não é número
  const numbers = text.replace(/\D/g, '');

  // Aplica a máscara conforme o tamanho
  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : '';
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11,
    )}`;
  }
};

export default function Login({navigation}: {navigation: any}) {
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 768;

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
  };

  const onSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        'https://app-pdv-4d4c073422f8.herokuapp.com/api/v1/login/sign_in',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({email: email, telefone: phone}),
        },
      );

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('@SkallApp:filiaId', String(data.id));
        await AsyncStorage.setItem('@SkallApp:filiaNome', data.nome_fantasia);
        await AsyncStorage.setItem('@SkallApp:email', email);
        navigation.replace('Loading');
      } else {
        Alert.alert('Erro de login', data.message ?? 'Tente novamente');
      }
    } catch (e: any) {
      Alert.alert('Erro de login', e?.message ?? 'Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || (!email && !phone);

  const dynamicStyles = {
    maxFormWidth: isTablet ? (isLandscape ? 560 : 480) : 380,
    horizPadding: isTablet ? (isLandscape ? 48 : 32) : 24,
    titleSize: isTablet ? (isLandscape ? 34 : 32) : 28,
    cardPadding: isTablet ? 28 : 20,
    scrollPadding: isLandscape ? 16 : 32,
    titleMarginTop: isLandscape ? 4 : 8,
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: dynamicStyles.horizPadding,
                paddingTop: dynamicStyles.scrollPadding,
                paddingBottom: dynamicStyles.scrollPadding,
              },
            ]}
            bounces={false}>
            <View
              style={[
                styles.card,
                {
                  maxWidth: dynamicStyles.maxFormWidth,
                  padding: dynamicStyles.cardPadding,
                },
              ]}>
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: dynamicStyles.titleSize,
                    marginTop: dynamicStyles.titleMarginTop,
                  },
                ]}>
                Bem-vindo 👋
              </Text>
              <Text style={styles.subtitle}>
                Entre com seu E-mail e Telefone
              </Text>

              <View style={styles.formContainer}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                  style={styles.input}
                />
                <Text style={[styles.label, styles.labelMargin]}>Telefone</Text>
                <TextInput
                  ref={phoneInputRef}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                  maxLength={15}
                  style={styles.input}
                />
              </View>

              <Pressable
                onPress={onSubmit}
                disabled={disabled}
                style={({pressed}) => [
                  styles.button,
                  {
                    opacity: disabled ? 0.6 : pressed ? 0.9 : 1,
                  },
                ]}>
                <Text style={styles.buttonText}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    gap: 20,
    backgroundColor: 'rgba(31,41,55,0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  title: {
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    color: '#cbd5e1',
    textAlign: 'center',
  },
  formContainer: {
    gap: 10,
    marginTop: 8,
  },
  label: {
    color: '#e5e7eb',
  },
  labelMargin: {
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1f2937',
    color: 'white',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
});
