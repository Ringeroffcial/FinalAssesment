import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Animated
} from 'react-native';
import { completeOnboarding } from '../config/firebase';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Discover Amazing Hotels',
    description: 'Browse through thousands of hotels worldwide with detailed information and real guest photos',
    image: require('../assets/01-Onboarding Page/Onboarding 1.png'),
    backgroundColor: '#4A90E2'
  },
  {
    id: '2',
    title: 'Easy Booking Process',
    description: 'Book your perfect room in just a few taps with our secure and streamlined booking system',
    image: require('../assets/01-Onboarding Page/Onboarding 2.png'),
    backgroundColor: '#50C878'
  },
  {
    id: '3',
    title: 'Manage Your Stays',
    description: 'Keep track of your bookings, preferences, and special requests all in one place',
    image: require('../assets/01-Onboarding Page/Onboarding 3.png'),
    backgroundColor: '#FF6B6B'
  }
];

const OnboardingScreen = ({ item, currentIndex, scrollX, onGetStarted }) => {
  return (
    <View style={[styles.screen, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.content}>
        <Image 
          source={item.image} // CHANGED: Remove { uri: ... } and use item.image directly
          style={styles.image}
          resizeMode="cover"
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        {currentIndex === onboardingData.length - 1 && (
          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={onGetStarted}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const Paginator = ({ data, scrollX }) => {
  return (
    <View style={styles.paginatorContainer}>
      {data.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 30, 10],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default function Onboarding ({ onComplete, userId }){
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleGetStarted = async () => {
    if (userId) {
      await completeOnboarding(userId);
    }
    onComplete();
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={onboardingData}
        renderItem={({ item, index }) => (
          <OnboardingScreen 
            item={item} 
            currentIndex={currentIndex}
            scrollX={scrollX}
            onGetStarted={handleGetStarted}
          />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />
      
      <Paginator data={onboardingData} scrollX={scrollX} />
      
      {currentIndex < onboardingData.length - 1 && (
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screen: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    borderRadius: 20,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  getStartedButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  paginatorContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    height: 10,
    alignSelf: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 5,
  },
});

