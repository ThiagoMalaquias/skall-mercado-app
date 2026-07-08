import {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Loading({navigation}: {navigation: any}) {
  useEffect(() => {
    checkAuth(navigation);
  }, [navigation]);

  const checkAuth = async (navigation: any) => {
    try {
      const filiaId = await AsyncStorage.getItem('@SkallApp:filiaId');

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (filiaId && filiaId.trim() !== '') {
        navigation.replace('Home');
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
