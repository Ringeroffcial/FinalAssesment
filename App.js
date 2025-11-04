import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Search, User, Home } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from './components/onBoarding';
import SignInScreen from './src/Auth/SigninScreen';
import SignUpScreen from './src/Auth/SignupScreen';
import ForgotPasswordScreen from './src/Auth/ForgotPasswordScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import HotelDetailsScreen from './src/screens/HotelDetailsScreen';
import BookingScreen from './src/screens/BookingScreen';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { auth, checkOnboardingStatus, completeOnboarding } from './config/firebase';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ONBOARDING_KEY = '@onboarding_completed';
const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Explore') {
            return <Search size={size} color={color} />;
          } else if (route.name === 'Profile') {
            return <User size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{
          title: 'Explore',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          
          const onboardingCompleted = await checkOnboardingStatus(user.uid);
          const localOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
          
          setShowOnboarding(!onboardingCompleted && !localOnboarding);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
          
          const localOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
          setShowOnboarding(!localOnboarding);
        }
        
        setIsLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      
      if (currentUser) {
        await completeOnboarding(currentUser.uid);
      }
      
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <Onboarding 
                {...props}
                onComplete={handleOnboardingComplete}
                userId={currentUser?.uid}
              />
            )}
          </Stack.Screen>
        ) : isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={AppTabs} />
            <Stack.Screen 
              name="HotelDetails" 
              component={HotelDetailsScreen}
              options={{
                headerShown: false,
                presentation: 'card'
              }}
            />
            <Stack.Screen 
              name="Booking" 
              component={BookingScreen}
              options={{
                headerShown: false,
                presentation: 'card'
              }}
            />
            <Stack.Screen 
              name="BookingConfirmation" 
              component={BookingConfirmationScreen}
              options={{
                headerShown: false,
                presentation: 'card'
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="SignIn" 
              component={SignInScreen}
              options={{
                headerShown: false,
                animation: 'fade'
              }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen}
              options={{
                headerShown: false,
                animation: 'fade'
              }}
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen}
              options={{
                headerShown: false,
                presentation: 'card'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default App;