import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';

const BookingConfirmationScreen = ({ route, navigation }) => {
  const { booking } = route.params;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your reservation has been successfully completed
          </Text>
        </View>

        {/* Booking Reference */}
        <View style={styles.referenceContainer}>
          <Text style={styles.referenceLabel}>Booking Reference</Text>
          <Text style={styles.referenceNumber}>{booking.bookingReference}</Text>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hotel</Text>
            <Text style={styles.detailValue}>{booking.hotelName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{booking.hotelLocation}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-in</Text>
            <Text style={styles.detailValue}>{formatDate(booking.checkInDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-out</Text>
            <Text style={styles.detailValue}>{formatDate(booking.checkOutDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{booking.numberOfNights} nights</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rooms</Text>
            <Text style={styles.detailValue}>{booking.numberOfRooms}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guests</Text>
            <Text style={styles.detailValue}>{booking.numberOfGuests}</Text>
          </View>

          {booking.specialRequests && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Special Requests</Text>
              <Text style={styles.detailValue}>{booking.specialRequests}</Text>
            </View>
          )}
        </View>

        {/* Total Cost */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>${booking.totalCost}</Text>
        </View>

        {/* Next Steps */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <Text style={styles.infoText}>
            • You will receive a confirmation email shortly{'\n'}
            • Present your booking reference at check-in{'\n'}
            • Free cancellation up to 24 hours before check-in{'\n'}
            • Contact support for any changes
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Explore')}
          >
            <Text style={styles.primaryButtonText}>Book Another Hotel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('MyBookings')} // You can implement this later
          >
            <Text style={styles.secondaryButtonText}>View My Bookings</Text>
          </TouchableOpacity>
        </View>
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
  successContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fff8',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e8',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  referenceContainer: {
    padding: 20,
    backgroundColor: '#f0f7ff',
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  referenceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    letterSpacing: 1,
  },
  detailsContainer: {
    padding: 20,
    margin: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  totalContainer: {
    padding: 20,
    margin: 20,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
    margin: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingConfirmationScreen;