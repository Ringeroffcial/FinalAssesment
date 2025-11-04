// src/screens/DealsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';

const DealsScreen = ({ navigation }) => {
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://fakestoreapi.com/products');
      const products = await response.json();
      
      // Transform products into hotel deals
      const hotelDeals = products.map(product => ({
        id: product.id.toString(),
        name: product.title.length > 30 ? product.title.substring(0, 30) + '...' : product.title,
        description: product.description,
        price: Math.round(product.price * 15), // Convert to realistic hotel prices
        originalPrice: Math.round(product.price * 20),
        image: product.image,
        rating: Math.min(5, product.rating.rate), // Cap at 5 stars
        reviewCount: product.rating.count,
        category: product.category,
        discount: Math.round(Math.random() * 30) + 10, // Random discount 10-40%
        location: getRandomLocation(),
        amenities: getRandomAmenities()
      }));
      
      setDeals(hotelDeals);
    } catch (err) {
      setError('Failed to load deals');
      console.error('Error fetching deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRandomLocation = () => {
    const locations = ['Paris, France', 'Tokyo, Japan', 'New York, USA', 'Bali, Indonesia', 'London, UK', 'Dubai, UAE'];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  const getRandomAmenities = () => {
    const allAmenities = ['Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Breakfast'];
    return allAmenities.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading amazing deals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDeals}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Special Deals</Text>
        <Text style={styles.subtitle}>Limited time offers on amazing hotels</Text>
      </View>

      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.dealCard}>
            <Image source={{ uri: item.image }} style={styles.dealImage} />
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{item.discount}%</Text>
            </View>
            <View style={styles.dealInfo}>
              <Text style={styles.dealName}>{item.name}</Text>
              <Text style={styles.dealLocation}>📍 {item.location}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
                <Text style={styles.reviews}>({item.reviewCount} reviews)</Text>
              </View>
              <View style={styles.amenities}>
                {item.amenities.map((amenity, index) => (
                  <Text key={index} style={styles.amenity}>• {amenity}</Text>
                ))}
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.originalPrice}>${item.originalPrice}</Text>
                <Text style={styles.currentPrice}>${item.price}/night</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  dealCard: {
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dealInfo: {
    padding: 15,
  },
  dealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dealLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  reviews: {
    fontSize: 12,
    color: '#999',
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  amenity: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DealsScreen;