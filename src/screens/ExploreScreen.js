import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  RefreshControl
} from 'react-native';
import { auth, db } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { Cloud, CloudRain, Sun, CloudSnow, CloudDrizzle, Tag } from 'lucide-react-native';

const sampleHotels = [
  {
    id: '1',
    name: 'Grand Plaza Hotel',
    location: 'New York',
    country: 'US',
    rating: 4.5,
    price: 299,
    description: 'Luxury hotel in the heart of Manhattan with stunning city views and premium amenities.',
    amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Restaurant', 'Fitness Center'],
    reviews: 1247
  },
  {
    id: '2',
    name: 'Seaside Resort',
    location: 'Miami',
    country: 'US',
    rating: 4.8,
    price: 459,
    description: 'Beachfront resort with private beach access, multiple pools, and tropical gardens.',
    amenities: ['Private Beach', 'Pool', 'Spa', '3 Restaurants', 'Water Sports'],
    reviews: 892
  },
  {
    id: '3',
    name: 'Mountain View Lodge',
    location: 'Aspen',
    country: 'US',
    rating: 4.3,
    price: 389,
    description: 'Cozy mountain lodge with fireplace, ski-in/ski-out access, and panoramic mountain views.',
    amenities: ['Ski Access', 'Fireplace', 'Hot Tub', 'Restaurant', 'Bar'],
    reviews: 567
  }
];

const WEATHER_API_KEY = '5ee6ada5a4cda7c857656fd1b69b544d';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FAKE_STORE_API = 'https://fakestoreapi.com/products';

const ExploreScreen = ({ navigation }) => {
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [weatherData, setWeatherData] = useState({});
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('hotels');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    await Promise.all([loadHotels(), fetchDeals()]);
    setIsLoading(false);
  };

  const loadHotels = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    setHotels(sampleHotels);
    setFilteredHotels(sampleHotels);
    
    if (sampleHotels.length > 0) {
      fetchWeatherForHotels();
    }
  };

  const fetchDeals = async () => {
    setIsLoadingDeals(true);
    try {
      const response = await fetch(`${FAKE_STORE_API}?limit=6`);
      const products = await response.json();
      
      const hotelDeals = products.map(product => ({
        id: `deal-${product.id}`,
        name: product.title.length > 30 ? product.title.substring(0, 30) + '...' : product.title,
        description: product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description,
        price: Math.round(product.price * 15),
        originalPrice: Math.round(product.price * 20),
        rating: Math.min(5, (product.rating?.rate || 4) + Math.random()), 
        reviewCount: product.rating?.count || Math.floor(Math.random() * 500) + 50,
        category: product.category,
        discount: Math.round(Math.random() * 30) + 10,
        location: getRandomLocation(),
        amenities: getRandomAmenities(),
        isDeal: true
      }));
      
      setDeals(hotelDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      setDeals(getFallbackDeals());
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const getRandomLocation = () => {
    const locations = ['Paris, France', 'Tokyo, Japan', 'Bali, Indonesia', 'London, UK', 'Dubai, UAE', 'Rome, Italy'];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  const getRandomAmenities = () => {
    const allAmenities = ['Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Breakfast', 'Ocean View'];
    return allAmenities.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  const getFallbackDeals = () => {
    return [
      {
        id: 'deal-1',
        name: 'Luxury Beach Resort',
        price: 399,
        originalPrice: 599,
        discount: 33,
        location: 'Bali, Indonesia',
        rating: 4.8,
        reviewCount: 234
      },
      {
        id: 'deal-2',
        name: 'Mountain Spa Retreat',
        price: 299,
        originalPrice: 449,
        discount: 25,
        location: 'Swiss Alps',
        rating: 4.6,
        reviewCount: 167
      }
    ];
  };

  const fetchWeatherForHotels = async () => {
    setIsLoadingWeather(true);
    const weatherPromises = hotels.map(hotel => fetchWeather(hotel.location, hotel.country));
    
    try {
      const weatherResults = await Promise.all(weatherPromises);
      const weatherMap = {};
      
      hotels.forEach((hotel, index) => {
        weatherMap[hotel.id] = weatherResults[index];
      });
      
      setWeatherData(weatherMap);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const fetchWeather = async (city, country) => {
    try {
      const response = await fetch(
        `${WEATHER_BASE_URL}?q=${city},${country}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Weather data not available');
      }
      
      const data = await response.json();
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        icon: data.weather[0].icon,
        city: data.name
      };
    } catch (error) {
      console.error(`Error fetching weather for ${city}:`, error);
      return {
        temperature: Math.round(Math.random() * 30) + 10,
        condition: ['Clear', 'Clouds', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
        description: 'Weather data unavailable',
        humidity: Math.round(Math.random() * 50) + 30,
        icon: '02d',
        city: city
      };
    }
  };

  const getWeatherIcon = (condition, size = 20) => {
    const iconProps = { size, color: '#4A90E2' };
    
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun {...iconProps} />;
      case 'clouds':
        return <Cloud {...iconProps} />;
      case 'rain':
        return <CloudRain {...iconProps} />;
      case 'drizzle':
        return <CloudDrizzle {...iconProps} />;
      case 'snow':
        return <CloudSnow {...iconProps} />;
      default:
        return <Cloud {...iconProps} />;
    }
  };
 
  useEffect(() => {
    if (activeTab !== 'hotels') return;

    let results = [...hotels];

    if (searchQuery) {
      results = results.filter(hotel =>
        hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (minRating > 0) {
      results = results.filter(hotel => hotel.rating >= minRating);
    }

    results = results.filter(hotel => 
      hotel.price >= priceRange[0] && hotel.price <= priceRange[1]
    );

    switch (sortBy) {
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredHotels(results);
  }, [hotels, searchQuery, sortBy, priceRange, minRating, activeTab]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleHotelPress = (hotel) => {
    navigation.navigate('HotelDetails', { hotel });
  };

  const handleDealPress = (deal) => {
    navigation.navigate('HotelDetails', { 
      hotel: {
        ...deal,
        id: deal.id.replace('deal-', ''),
        amenities: deal.amenities || ['Special Deal', 'Limited Time Offer']
      }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'hotels') {
      await fetchWeatherForHotels();
    } else {
      await fetchDeals();
    }
    setRefreshing(false);
  };

  const renderHotelCard = ({ item }) => {
    const weather = weatherData[item.id];
    
    return (
      <TouchableOpacity 
        style={styles.hotelCard}
        onPress={() => handleHotelPress(item)}
      >
        {weather && (
          <View style={styles.weatherBadge}>
            {getWeatherIcon(weather.condition, 16)}
            <Text style={styles.weatherText}>{weather.temperature}°C</Text>
          </View>
        )}
        
        <View style={styles.hotelInfo}>
          <View style={styles.hotelHeader}>
            <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {item.rating}</Text>
            </View>
          </View>
          
          <Text style={styles.hotelLocation}>📍 {item.location}</Text>
       
          {weather && (
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherCondition}>
                {getWeatherIcon(weather.condition, 14)}
                <Text style={styles.weatherConditionText}> {weather.description}</Text>
              </Text>
              <Text style={styles.weatherDetail}>Humidity: {weather.humidity}%</Text>
            </View>
          )}
          
          {isLoadingWeather && !weather && (
            <View style={styles.weatherLoading}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.weatherLoadingText}>Loading weather...</Text>
            </View>
          )}
          
          <View style={styles.hotelFooter}>
            <Text style={styles.reviews}>({item.reviews} reviews)</Text>
            <Text style={styles.price}>${item.price}/night</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDealCard = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.dealCard}
        onPress={() => handleDealPress(item)}
      >
        <View style={styles.discountBadge}>
          <Tag size={14} color="#fff" />
          <Text style={styles.discountText}>-{item.discount}%</Text>
        </View>
        
        <View style={styles.dealInfo}>
          <View style={styles.dealHeader}>
            <Text style={styles.dealName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
            </View>
          </View>
          
          <Text style={styles.dealLocation}>📍 {item.location}</Text>
          <Text style={styles.dealDescription} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.dealAmenities}>
            {item.amenities?.map((amenity, index) => (
              <Text key={index} style={styles.amenityText}>• {amenity}</Text>
            ))}
          </View>
          
          <View style={styles.dealFooter}>
            <Text style={styles.reviews}>({item.reviewCount} reviews)</Text>
            <View style={styles.dealPriceContainer}>
              <Text style={styles.originalPrice}>${item.originalPrice}</Text>
              <Text style={styles.dealPrice}>R{item.price}/night</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('default');
    setPriceRange([0, 1000]);
    setMinRating(0);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading amazing hotels...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'hotels' 
              ? `${filteredHotels.length} ${filteredHotels.length === 1 ? 'hotel' : 'hotels'} found`
              : `${deals.length} special deals available`
            }
            {isLoadingWeather && activeTab === 'hotels' && ' • Loading weather...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'hotels' && styles.activeTab]}
          onPress={() => setActiveTab('hotels')}
        >
          <Text style={[styles.tabText, activeTab === 'hotels' && styles.activeTabText]}>
            All Hotels
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'deals' && styles.activeTab]}
          onPress={() => setActiveTab('deals')}
        >
          <View style={styles.dealTab}>
            <Tag size={16} color={activeTab === 'deals' ? '#fff' : '#4A90E2'} />
            <Text style={[styles.tabText, activeTab === 'deals' && styles.activeTabText]}>
              Special Deals
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search and Filter Row */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'hotels' ? "Search hotels or locations..." : "Search deals..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Sort/Filter Buttons - FIXED VISIBILITY */}
      {activeTab === 'hotels' && (
        <View style={styles.sortFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortButtonsContainer}
          >
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'default' && styles.sortButtonActive]}
              onPress={() => setSortBy('default')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'default' && styles.sortButtonTextActive]}>
                Recommended
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'price-low' && styles.sortButtonActive]}
              onPress={() => setSortBy('price-low')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'price-low' && styles.sortButtonTextActive]}>
                Price: Low to High
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'price-high' && styles.sortButtonActive]}
              onPress={() => setSortBy('price-high')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'price-high' && styles.sortButtonTextActive]}>
                Price: High to Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
              onPress={() => setSortBy('rating')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
                Top Rated
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {activeTab === 'hotels' ? (
        filteredHotels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No hotels found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters to find more options.
            </Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredHotels}
            renderItem={renderHotelCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.hotelList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4A90E2']}
                tintColor="#4A90E2"
              />
            }
          />
        )
      ) : (
        isLoadingDeals ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading special deals...</Text>
          </View>
        ) : deals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No deals available</Text>
            <Text style={styles.emptyText}>
              Check back later for special offers and discounts.
            </Text>
          </View>
        ) : (
          <FlatList
            data={deals}
            renderItem={renderDealCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.dealsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4A90E2']}
                tintColor="#4A90E2"
              />
            }
          />
        )
      )}

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.filterSectionTitle}>Coming Soon</Text>
          <Text style={styles.filterDescription}>
            Advanced filters for price range, ratings, and amenities will be available in the next update.
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signOutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  dealTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#1a1a1a',
  },
  filterButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    minWidth: 80,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sortFilterContainer: {
    marginBottom: 16,
  },
  sortButtonsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sortButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  sortButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  hotelList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dealsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  weatherBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  weatherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  discountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  hotelInfo: {
    padding: 20,
  },
  dealInfo: {
    padding: 20,
  },
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  dealName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  ratingContainer: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  hotelLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  dealLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  dealDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
    lineHeight: 20,
  },
  dealAmenities: {
    marginBottom: 12,
  },
  amenityText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weatherInfo: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  weatherCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    marginBottom: 4,
  },
  weatherConditionText: {
    marginLeft: 8,
  },
  weatherDetail: {
    fontSize: 12,
    color: '#666',
  },
  weatherLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealPriceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#999',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  dealPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  filterSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  filterDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default ExploreScreen;