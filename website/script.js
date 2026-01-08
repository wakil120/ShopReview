// ============================================
// CONSTANTS
// ============================================
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadShops();
  setupEventListeners();
});

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Load all shops from the API
 */
async function loadShops() {
  showLoading();
  clearError();

  try {
    const response = await fetch(`${API_BASE_URL}/shops`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const shops = await response.json();
    displayShops(shops);
  } catch (error) {
    console.error('Error loading shops:', error);
    showError('Failed to load shops. Please make sure the backend server is running.');
  } finally {
    hideLoading();
  }
}

/**
 * Handle search functionality
 */
async function handleSearch() {
  const searchTerm = document.getElementById('searchInput').value.trim();

  if (!searchTerm) {
    loadShops();
    return;
  }

  showLoading();
  clearError();

  try {
    const response = await fetch(`${API_BASE_URL}/shops/search?name=${encodeURIComponent(searchTerm)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const shops = await response.json();
    
    if (shops.length === 0) {
      showError(`No shops found matching "${searchTerm}"`);
      document.getElementById('shopsList').innerHTML = '';
    } else {
      clearError();
      displayShops(shops);
    }
  } catch (error) {
    console.error('Error searching shops:', error);
    showError('Error searching shops. Please try again.');
  } finally {
    hideLoading();
  }
}

/**
 * Display shops in the grid
 */
function displayShops(shops) {
  const shopsList = document.getElementById('shopsList');
  shopsList.innerHTML = '';

  if (shops.length === 0) {
    shopsList.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h2>No shops found</h2>
        <p>Try searching for different shops or reset your search.</p>
      </div>
    `;
    return;
  }

  shops.forEach(shop => {
    const shopCard = createShopCard(shop);
    shopsList.appendChild(shopCard);
  });
}

/**
 * Create a shop card element
 */
function createShopCard(shop) {
  const card = document.createElement('div');
  card.className = 'shop-card';

  const stars = generateStars(shop.averageRating);

  card.innerHTML = `
    <div class="shop-card-header">
      <h3 class="shop-name">${escapeHtml(shop.name)}</h3>
      <span class="shop-category">${escapeHtml(shop.category)}</span>
      <p class="shop-location">📍 ${escapeHtml(shop.location)}</p>
    </div>
    <div class="shop-card-body">
      <div class="rating-section">
        <div class="rating-display">${shop.averageRating.toFixed(1)}</div>
        <div>
          <div class="stars">${stars}</div>
          <div class="review-count">${shop.reviewCount} ${shop.reviewCount === 1 ? 'review' : 'reviews'}</div>
        </div>
      </div>
    </div>
    <div class="shop-card-footer">
      <button class="btn btn-details" onclick="showShopDetails('${shop._id}')">
        👁️ Details
      </button>
      <button class="btn btn-review" onclick="openReviewModal('${shop._id}', '${escapeHtml(shop.name)}')">
        ✍️ Review
      </button>
    </div>
  `;

  return card;
}

/**
 * Generate star display based on rating
 */
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '⭐'.repeat(fullStars);
  if (hasHalfStar && fullStars < 5) {
    stars += '✨';
  }
  return stars;
}

/**
 * Show shop details modal with reviews
 */
async function showShopDetails(shopId) {
  try {
    // Fetch shop details
    const shopResponse = await fetch(`${API_BASE_URL}/shops/${shopId}`);
    if (!shopResponse.ok) throw new Error('Failed to fetch shop details');
    
    const shop = await shopResponse.json();

    // Fetch reviews
    const reviewsResponse = await fetch(`${API_BASE_URL}/reviews/${shopId}`);
    const reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];

    // Display modal
    const detailsDiv = document.getElementById('shopDetails');
    const stars = generateStars(shop.averageRating);

    let reviewsHTML = '';
    if (reviews.length > 0) {
      reviewsHTML = `
        <div class="reviews-container">
          <h3 style="margin-top: 25px; margin-bottom: 15px;">Reviews</h3>
          ${reviews.map(review => `
            <div class="review-item">
              <div class="review-header">
                <span class="review-author">${escapeHtml(review.reviewer)}</span>
                <span class="review-date">${formatDate(review.date)}</span>
              </div>
              <div class="review-rating">${'⭐'.repeat(review.rating)} (${review.rating}/5)</div>
              <p class="review-comment">${escapeHtml(review.comment)}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      reviewsHTML = '<p style="color: #999; margin-top: 20px;">No reviews yet. Be the first to review!</p>';
    }

    detailsDiv.innerHTML = `
      <div>
        <h2 style="color: #667eea; margin-bottom: 20px;">${escapeHtml(shop.name)}</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <p><strong>Category:</strong> ${escapeHtml(shop.category)}</p>
            <p><strong>Location:</strong> ${escapeHtml(shop.location)}</p>
          </div>
          <div>
            <p><strong>Average Rating:</strong> <span style="font-size: 1.3em; color: #f59e0b;">${shop.averageRating.toFixed(1)} ${stars}</span></p>
            <p><strong>Total Reviews:</strong> ${shop.reviewCount}</p>
          </div>
        </div>
        ${reviewsHTML}
      </div>
    `;

    document.getElementById('detailsModal').classList.add('show');
  } catch (error) {
    console.error('Error fetching shop details:', error);
    showError('Failed to load shop details.');
  }
}

/**
 * Open review modal for a shop
 */
function openReviewModal(shopId, shopName) {
  document.getElementById('currentShopId').value = shopId;
  const modal = document.getElementById('reviewModal');
  modal.classList.add('show');
  
  // Reset form
  document.getElementById('reviewForm').reset();
}

/**
 * Close review modal
 */
function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('show');
  document.getElementById('reviewForm').reset();
}

/**
 * Close details modal
 */
function closeDetailsModal() {
  document.getElementById('detailsModal').classList.remove('show');
}

/**
 * Submit review
 */
async function submitReview(event) {
  event.preventDefault();

  const shopId = document.getElementById('currentShopId').value;
  const reviewer = document.getElementById('reviewerName').value.trim();
  const rating = parseInt(document.getElementById('rating').value);
  const comment = document.getElementById('comment').value.trim();

  if (!shopId || !reviewer || !rating || !comment) {
    showError('Please fill in all fields.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shopId,
        rating,
        comment,
        reviewer
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit review');
    }

    closeReviewModal();
    showError('✓ Review submitted successfully!');
    
    // Reload shops to update ratings
    setTimeout(() => {
      clearError();
      loadShops();
    }, 1500);
  } catch (error) {
    console.error('Error submitting review:', error);
    showError('Failed to submit review. Please try again.');
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show loading indicator
 */
function showLoading() {
  document.getElementById('loading').style.display = 'block';
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('errorMsg');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}

/**
 * Clear error message
 */
function clearError() {
  const errorDiv = document.getElementById('errorMsg');
  errorDiv.textContent = '';
  errorDiv.classList.remove('show');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// ============================================
// MODAL CLOSE ON OUTSIDE CLICK
// ============================================
window.onclick = function(event) {
  const reviewModal = document.getElementById('reviewModal');
  const detailsModal = document.getElementById('detailsModal');

  if (event.target === reviewModal) {
    closeReviewModal();
  }
  if (event.target === detailsModal) {
    closeDetailsModal();
  }
};

loadShops();
