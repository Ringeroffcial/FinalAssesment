import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BookingScreen = ({ route, navigation }) => {
  const { hotel } = route.params;
  
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  const user = auth.currentUser;

  useEffect(() => {
    calculateTotalCost();
  }, [checkInDate, checkOutDate, numberOfRooms]);

  const calculateTotalCost = () => {
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (numberOfNights > 0) {
      const total = numberOfNights * hotel.price * numberOfRooms;
      setTotalCost(total);
    } else {
      setTotalCost(0);
    }
  };

  const getNumberOfNights = () => {
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const onCheckInChange = (event, selectedDate) => {
    setShowCheckInPicker(false);
    if (selectedDate) {
      setCheckInDate(selectedDate);
      // Auto-adjust checkout date if it becomes invalid
      if (selectedDate >= checkOutDate) {
        const newCheckOut = new Date(selectedDate);
        newCheckOut.setDate(newCheckOut.getDate() + 1);
        setCheckOutDate(newCheckOut);
      }
    }
  };

  const onCheckOutChange = (event, selectedDate) => {
    setShowCheckOutPicker(false);
    if (selectedDate && selectedDate > checkInDate) {
      setCheckOutDate(selectedDate);
    } else if (selectedDate) {
      Alert.alert('Invalid Date', 'Check-out date must be after check-in date.');
    }
  };

  const validateBooking = () => {
    const nights = getNumberOfNights();
    
    if (nights <= 0) {
      Alert.alert('Invalid Dates', 'Check-out date must be after check-in date.');
      return false;
    }
    
    if (numberOfRooms < 1) {
      Alert.alert('Invalid Rooms', 'Please select at least 1 room.');
      return false;
    }
    
    if (numberOfGuests < 1) {
      Alert.alert('Invalid Guests', 'Please select at least 1 guest.');
      return false;
    }

    return true;
  };

  const handleBooking = async () => {
    if (!validateBooking()) return;

    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to complete your booking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('SignIn') }
        ]
      );
      return;
    }

    setIsLoading(true);

    try {
      const bookingData = {
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelLocation: hotel.location,
        hotelPrice: hotel.price,
        // hotelImage: hotel.image,
        userId: user.uid,
        userEmail: user.email,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        numberOfNights: getNumberOfNights(),
        numberOfRooms,
        numberOfGuests,
        totalCost,
        specialRequests,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        bookingReference: `BK${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase()
      };

      // Save to Firebase
      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      setIsLoading(false);
      
      // Navigate to confirmation screen
      navigation.navigate('BookingConfirmation', { 
        booking: { ...bookingData, id: docRef.id }
      });

    } catch (error) {
      setIsLoading(false);
      console.error('Booking error:', error);
      Alert.alert('Booking Failed', 'There was an error processing your booking. Please try again.');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const numberOfNights = getNumberOfNights();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Booking</Text>
          <Text style={styles.hotelName}>{hotel.name}</Text>
          <Text style={styles.hotelLocation}>{hotel.location}</Text>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          
          {/* Check-in Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Check-in Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowCheckInPicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(checkInDate)}</Text>
            </TouchableOpacity>
            {showCheckInPicker && (
              <DateTimePicker
                value={checkInDate}
                mode="date"
                display="default"
                onChange={onCheckInChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Check-out Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Check-out Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowCheckOutPicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(checkOutDate)}</Text>
            </TouchableOpacity>
            {showCheckOutPicker && (
              <DateTimePicker
                value={checkOutDate}
                mode="date"
                display="default"
                onChange={onCheckOutChange}
                minimumDate={new Date(checkInDate.getTime() + 86400000)}
              />
            )}
          </View>

          {/* Number of Rooms */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Rooms</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => numberOfRooms > 1 && setNumberOfRooms(numberOfRooms - 1)}
                disabled={numberOfRooms <= 1}
              >
                <Text style={[styles.counterButtonText, numberOfRooms <= 1 && styles.counterButtonDisabled]}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{numberOfRooms}</Text>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => setNumberOfRooms(numberOfRooms + 1)}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Number of Guests */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Guests</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => numberOfGuests > 1 && setNumberOfGuests(numberOfGuests - 1)}
                disabled={numberOfGuests <= 1}
              >
                <Text style={[styles.counterButtonText, numberOfGuests <= 1 && styles.counterButtonDisabled]}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{numberOfGuests}</Text>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => setNumberOfGuests(numberOfGuests + 1)}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Special Requests */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Special Requests (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any special requirements or requests..."
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>R{hotel.price} × {numberOfNights} nights × {numberOfRooms} rooms</Text>
            <Text style={styles.priceValue}>R{hotel.price * numberOfNights * numberOfRooms}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R{totalCost}</Text>
          </View>
        </View>

        {/* Book Button */}
        <TouchableOpacity 
          style={[styles.bookButton, isLoading && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>
              {user ? `Confirm Booking - $${totalCost}` : 'Sign In to Book'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 4,
    backgroundColor: '#f9f9f9',
  },
  counterButton: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    minWidth: 40,
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  counterButtonDisabled: {
    color: '#ccc',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 80,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  bookButton: {
    backgroundColor: '#4A90E2',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BookingScreen;