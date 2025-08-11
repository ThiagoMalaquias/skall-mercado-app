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
    <SafeAreaView style={{flex: 1, backgroundColor: '#0f172a'}}>
      <KeyboardAvoidingView
        behavior={Platform.select({ios: 'padding', android: undefined})}
        style={{flex: 1}}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: horizPadding,
            paddingVertical: isLandscape ? 16 : 32,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: maxFormWidth,
              gap: 20,
              backgroundColor: 'rgba(31,41,55,0.8)', // aumentar opacidade
              borderRadius: 16,
              padding: isTablet ? 28 : 20,
              borderWidth: 1,
              borderColor: '#374151',
            }}>
            <Text
              style={{
                fontSize: titleSize,
                fontWeight: '700',
                color: 'white',
                textAlign: 'center',
                marginTop: isLandscape ? 4 : 8,
              }}>
              Bem-vindo 👋
            </Text>
            <Text style={{color: '#cbd5e1', textAlign: 'center'}}>
              Entre para acessar a Home
            </Text>

            <View style={{gap: 10, marginTop: 8}}>
              <Text style={{color: '#e5e7eb'}}>E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                style={inputStyle}
              />
              <Text style={{color: '#e5e7eb', marginTop: 8}}>Senha</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                style={inputStyle}
              />
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={disabled}
              style={({pressed}) => [
                buttonStyle,
                {opacity: disabled ? 0.6 : pressed ? 0.9 : 1},
              ]}>
              <Text
                style={{
                  color: 'white',
                  fontWeight: '700',
                  textAlign: 'center',
                }}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputStyle = {
  backgroundColor: '#1f2937',
  color: 'white',
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#374151',
};

const buttonStyle = {
  backgroundColor: '#2563eb',
  paddingVertical: 14,
  borderRadius: 12,
  marginTop: 8,
};
