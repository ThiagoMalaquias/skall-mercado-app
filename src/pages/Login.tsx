import {useState} from 'react';
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

export default function Login({navigation}: {navigation: any}) {
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 768;
  const maxFormWidth = isTablet ? (isLandscape ? 560 : 480) : 380;
  const horizPadding = isTablet ? (isLandscape ? 48 : 32) : 24;
  const titleSize = isTablet ? (isLandscape ? 34 : 32) : 28;

  // const { signIn } = useAuth();
  // const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      // await signIn(email.trim(), password);
      navigation.navigate('Home');
    } catch (e: any) {
      Alert.alert('Erro de login', e?.message ?? 'Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !email || !password;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ios: 'padding', android: undefined})}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizPadding,
              paddingVertical: isLandscape ? 16 : 32,
            },
          ]}>
          <View
            style={[
              styles.formContainer,
              {
                maxWidth: maxFormWidth,
                padding: isTablet ? 28 : 20,
              },
            ]}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: titleSize,
                  marginTop: isLandscape ? 4 : 8,
                },
              ]}>
              Bem-vindo 👋
            </Text>
            <Text style={styles.subtitle}>Entre para acessar o sistema</Text>

            <View style={styles.formFields}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <Text style={styles.labelWithMargin}>Senha</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={disabled}
              style={({pressed}) => [
                styles.button,
                disabled && styles.buttonDisabled,
                pressed && !disabled && styles.buttonPressed,
              ]}>
              <Text style={styles.buttonText}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    gap: 20,
    backgroundColor: 'rgba(31,41,55,0.8)',
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
  formFields: {
    gap: 10,
    marginTop: 8,
  },
  label: {
    color: '#e5e7eb',
  },
  labelWithMargin: {
    color: '#e5e7eb',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
});