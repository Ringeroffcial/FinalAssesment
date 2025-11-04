import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { auth, db } from '../../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

const HotelDetailsScreen = ({ route, navigation }) => {
  const { hotel } = route.params;
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [tempRating, setTempRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  const user = auth.currentUser;

  // Load reviews from Firebase
  useEffect(() => {
    if (!hotel?.id) return;

    const q = query(
      collection(db, 'reviews'),
      where('hotelId', '==', hotel.id),
      orderBy('createdAt', 'desc')
    );
    
    setIsLoadingReviews(true);
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const reviewsData = [];
        let userHasReviewed = false;
        
        querySnapshot.forEach((doc) => {
          const reviewData = { id: doc.id, ...doc.data() };
          reviewsData.push(reviewData);
          
          // Check if current user has already reviewed
          if (user && reviewData.userId === user.uid) {
            userHasReviewed = true;
          }
        });
        
        setReviews(reviewsData);
        setHasUserReviewed(userHasReviewed);
        setIsLoadingReviews(false);
      },
      (error) => {
        console.error('Error loading reviews:', error);
        setIsLoadingReviews(false);
        Alert.alert('Error', 'Failed to load reviews. Please try again.');
      }
    );

    // Cleanup subscription
    return unsubscribe;
  }, [hotel?.id, user]);

  const renderStars = (rating, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={{ fontSize: size, color: i <= rating ? '#FFD700' : '#DDD' }}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const handleAddReview = () => {
    // Check if user is logged in
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to add a review.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('SignIn') }
        ]
      );
      return;
    }

    // Check if user already reviewed
    if (hasUserReviewed) {
      Alert.alert('Already Reviewed', 'You have already submitted a review for this hotel.');
      return;
    }

    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (newReview.rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }

    if (newReview.comment.trim().length < 10) {
      Alert.alert('Comment Too Short', 'Please write a review with at least 10 characters.');
      return;
    }

    setIsSubmittingReview(true);

    try {
      const reviewData = {
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelLocation: hotel.location,
        userName: user.displayName || user.email.split('@')[0],
        userEmail: user.email,
        userId: user.uid,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save review to Firebase
      await addDoc(collection(db, 'reviews'), reviewData);
      
      // Success - modal will close and real-time listener will update the list
      setShowReviewModal(false);
      setNewReview({ rating: 0, comment: '' });
      setTempRating(0);
      
      Alert.alert('Thank You!', 'Your review has been submitted successfully.');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View>
          <Text style={styles.reviewerName}>{item.userName}</Text>
          <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
        </View>
        {renderStars(item.rating)}
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      
      {/* Show "Your Review" badge if it's the current user's review */}
      {user && item.userId === user.uid && (
        <View style={styles.userReviewBadge}>
          <Text style={styles.userReviewBadgeText}>Your Review</Text>
        </View>
      )}
    </View>
  );

  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => {
            setNewReview(prev => ({ ...prev, rating: i }));
            setTempRating(i);
          }}
          onPressIn={() => setTempRating(i)}
        >
          <Text style={{ fontSize: 32, color: i <= tempRating ? '#FFD700' : '#DDD' }}>
            ⭐
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingSelector}>{stars}</View>;
  };

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      
        {/* <Image source={hotel.image} style={styles.hotelImage} /> */}
        
       
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.hotelName}>{hotel.name}</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {hotel.rating}</Text>
              </View>
            </View>
            <Text style={styles.location}>📍 {hotel.location}</Text>
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>R{hotel.price}</Text>
            <Text style={styles.pricePeriod}>/ night</Text>
          </View>

          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{hotel.description}</Text>
          </View>

          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {hotel.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Guest Reviews ({reviews.length})
                </Text>
                {reviews.length > 0 && (
                  <Text style={styles.averageRating}>
                    Average Rating: {averageRating} ⭐
                  </Text>
                )}
              </View>
              {!hasUserReviewed && user && (
                <TouchableOpacity 
                  style={styles.addReviewButton}
                  onPress={handleAddReview}
                >
                  <Text style={styles.addReviewButtonText}>Add Review</Text>
                </TouchableOpacity>
              )}
            </View>

            {hasUserReviewed && (
              <View style={styles.thankYouMessage}>
                <Text style={styles.thankYouText}>✓ Thanks for your review!</Text>
              </View>
            )}

            {isLoadingReviews ? (
              <View style={styles.loadingReviews}>
                <ActivityIndicator size="small" color="#4A90E2" />
                <Text style={styles.loadingReviewsText}>Loading reviews...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.noReviews}>
                <Text style={styles.noReviewsText}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtext}>
                  Be the first to share your experience!
                </Text>
                {user && !hasUserReviewed && (
                  <TouchableOpacity 
                    style={styles.addFirstReviewButton}
                    onPress={handleAddReview}
                  >
                    <Text style={styles.addFirstReviewButtonText}>Write First Review</Text>
                  </TouchableOpacity>
                )}
                {!user && (
                  <TouchableOpacity 
                    style={styles.addFirstReviewButton}
                    onPress={() => navigation.navigate('SignIn')}
                  >
                    <Text style={styles.addFirstReviewButtonText}>Sign In to Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={reviews}
                renderItem={renderReviewItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}

            {reviews.length > 0 && !hasUserReviewed && user && (
              <TouchableOpacity 
                style={styles.addReviewBottomButton}
                onPress={handleAddReview}
              >
                <Text style={styles.addReviewBottomButtonText}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Book Button */}
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => navigation.navigate('Booking', { hotel })}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!isSubmittingReview) {
            setShowReviewModal(false);
            setNewReview({ rating: 0, comment: '' });
            setTempRating(0);
          }
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <TouchableOpacity 
              onPress={() => {
                if (!isSubmittingReview) {
                  setShowReviewModal(false);
                  setNewReview({ rating: 0, comment: '' });
                  setTempRating(0);
                }
              }}
              disabled={isSubmittingReview}
            >
              <Text style={[styles.closeButton, isSubmittingReview && styles.closeButtonDisabled]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>How would you rate your experience?</Text>
              {renderStarRating()}
              {newReview.rating > 0 && (
                <Text style={styles.ratingText}>
                  {newReview.rating} {newReview.rating === 1 ? 'star' : 'stars'}
                </Text>
              )}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Share your experience</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="What did you like about your stay? What could be improved?"
                value={newReview.comment}
                onChangeText={(text) => setNewReview(prev => ({ ...prev, comment: text }))}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
                editable={!isSubmittingReview}
              />
              <Text style={styles.charCount}>
                {newReview.comment.length}/500 characters
              </Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                (newReview.rating === 0 || newReview.comment.length < 10 || isSubmittingReview) && 
                styles.submitButtonDisabled
              ]}
              onPress={handleSubmitReview}
              disabled={newReview.rating === 0 || newReview.comment.length < 10 || isSubmittingReview}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  hotelImage: {
    width: '100%',
    height: 300,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  ratingBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  amenityText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Reviews Styles
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  averageRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addReviewButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  userReviewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  userReviewBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingReviewsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  noReviews: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  noReviewsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  addFirstReviewButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFirstReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addReviewBottomButton: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addReviewBottomButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  thankYouMessage: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  thankYouText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  closeButtonDisabled: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HotelDetailsScreen;