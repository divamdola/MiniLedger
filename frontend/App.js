import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from './src/AuthContext';
import LoginScreen from './src/LoginScreen';
import HomeScreen from './src/HomeScreen';

const AppContent = () => {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      {user ? <HomeScreen /> : <LoginScreen />}
      <StatusBar style="auto" />
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
