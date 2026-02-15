// ============================================
// CONSTANTS
// ============================================
const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// AUTHENTICATION
// ============================================
function isAuthenticated() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return token && user;
}

function getUser() {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function openLogoutModal() {
  document.getElementById('logoutModal').classList.add('show');
}

function closeLogoutModal() {
  document.getElementById('logoutModal').classList.remove('show');
}

async function confirmLogout() {
  try {
    // Call backend logout endpoint
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage and redirect to main page
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('shopReviewSessionId'); // Clear favorites session
    window.location.href = 'index.html';
  }
}

// Session ID for favorites and helpful votes (stored in localStorage)
function getSessionId() {
  let sessionId = localStorage.getItem('shopReviewSessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('shopReviewSessionId', sessionId);
  }
  return sessionId;
}

// ============================================
// DEBOUNCE HELPER (for better performance)
// ============================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication status
  updateAuthSection();

  // Hide comparator section for non-logged-in users
  const comparatorSection = document.getElementById('comparatorSection');
  if (!isAuthenticated() && comparatorSection) {
    comparatorSection.style.display = 'none';
  }

  loadShops();
  setupEventListeners();
  setupAddShopButton();
  loadFilters();
  updateFavoritesCount();
  setupImagePreview();
  setupShopImagePreview();

  // Close details modal when clicking outside
  const detailsModal = document.getElementById('detailsModal');
  detailsModal.addEventListener('click', function (event) {
    if (event.target === detailsModal) {
      closeDetailsModal();
    }
  });
});

function updateAuthSection() {
  const authSection = document.getElementById('authSection');
  if (!authSection) return;

  if (isAuthenticated()) {
    const user = getUser();
    authSection.innerHTML = `
      <div class="user-profile">
        <span class="user-name">👤 ${user.username}</span>
        <span class="user-role">(${user.role})</span>
        <button id="logoutBtn" class="logout-header-btn" onclick="openLogoutModal()">
          Logout
        </button>
      </div>
    `;
  } else {
    authSection.innerHTML = `
      <button id="loginBtn" class="login-header-btn" onclick="window.location.href='login.html'">
        🔐 Login
      </button>
    `;
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    // Add real-time search with debouncing (type-as-you-search)
    const debouncedSearch = debounce(handleSearch, 300);
    searchInput.addEventListener('input', debouncedSearch);

    // Keep Enter key functionality (instant search)
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  // Review form submit
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) reviewForm.addEventListener('submit', submitReview);

  // Add shop form submit
  const addShopForm = document.getElementById('addShopForm');
  if (addShopForm) addShopForm.addEventListener('submit', submitAddShop);
}

// Add Shop modal plus button
function setupAddShopButton() {
  const addShopBtn = document.getElementById('openAddShopModalBtn');
  if (addShopBtn) {
    // Show button only if user is admin
    if (isAdmin()) {
      addShopBtn.style.display = 'block';
      addShopBtn.addEventListener('click', openAddShopModal);
    } else {
      addShopBtn.style.display = 'none';
    }
  }
}

// ============================================
// SHOP FUNCTIONS
// ============================================
async function loadShops() {
  showLoading();
  clearError();
  try {
    const response = await fetch(`${API_BASE_URL}/shops`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const shops = await response.json();
    displayShops(shops);
  } catch (err) {
    console.error(err);
    showError('Failed to load shops. Make sure backend is running.');
  } finally {
    hideLoading();
  }
}

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
      throw new Error(`HTTP ${response.status}`);
    }

    const shops = await response.json();

    if (shops.length === 0) {
      showError(`No shops found matching "${searchTerm}"`);
      document.getElementById('shopsList').innerHTML = '';
    } else {
      displayShops(shops);
    }
  } catch (err) {
    console.error(err);
    showError('Error searching shops.');
  } finally {
    hideLoading();
  }
}

function displayShops(shops) {
  const shopsList = document.getElementById('shopsList');
  shopsList.innerHTML = '';

  if (shops.length === 0) {
    shopsList.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h2>No shops found</h2>
        <p>Try another search or reset.</p>
      </div>
    `;
    return;
  }

  shops.forEach(shop => {
    const shopCard = createShopCard(shop);
    shopsList.appendChild(shopCard);
  });
}

function createShopCard(shop) {
  const card = document.createElement('div');
  card.className = 'shop-card';

  const stars = generateStars(shop.averageRating);

  card.innerHTML = `
    <div class="shop-card-content" onclick="showShopDetails('${shop._id}')">
      <div class="shop-card-header">
        <button class="favorite-btn" id="fav-${shop._id}" onclick="event.stopPropagation(); toggleFavorite('${shop._id}')" title="Add to favorites">
          🤍
        </button>
        <h3 class="shop-name">${escapeHtml(shop.name)}</h3>
        <span class="shop-category">${escapeHtml(shop.category)}</span>
        <p class="shop-location">📍 ${escapeHtml(shop.location)}</p>
      </div>
      ${shop.photos && shop.photos.length > 0 ? `
        <div class="shop-card-photos">
          <div class="shop-photo-preview">
            <img src="${escapeHtml(shop.photos[shop.mainPhotoIndex || 0].url)}" alt="${escapeHtml(shop.name)}" 
                 onerror="this.src='https://via.placeholder.com/150x100?text=No+Image'"
                 style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
          </div>
          ${shop.photos.length > 1 ? `
            <div class="photo-count-badge">+${shop.photos.length - 1} more</div>
          ` : ''}
        </div>
      ` : ''}
      <div class="shop-card-body">
        <div class="rating-section">
          <div class="rating-display">${shop.averageRating.toFixed(1)}</div>
          <div>
            <div class="stars">${stars}</div>
            <div class="review-count">${shop.reviewCount} ${shop.reviewCount === 1 ? 'review' : 'reviews'}</div>
          </div>
        </div>
      </div>
    </div>
     <div class="shop-card-footer">
      ${isAuthenticated() ? `
        <button class="btn btn-review" onclick="event.stopPropagation(); openReviewModal('${shop._id}', '${escapeHtml(shop.name)}')">
          ✍️ Write a Review
        </button>
      ` : ''}
      ${isAdmin() ? `
        <button class="btn btn-danger" onclick="event.stopPropagation(); deleteShop('${shop._id}')">
          🗑️ Delete Shop
        </button>
      ` : ''}
    </div>
  `;

  // Check if favorited and update button state
  checkAndUpdateFavoriteButton(shop._id);

  return card;
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '⭐'.repeat(fullStars);

  if (hasHalfStar && fullStars < 5) {
    stars += '✨';
  }

  return stars;
}

// ============================================
// ENHANCED SHOP DETAILS WITH FILTERS
// ============================================

let currentReviewFilters = {
  sortBy: 'date_new',
  minRating: null
};

let currentShopId = null;

async function showShopDetails(shopId) {
  currentShopId = shopId;
  try {
    // Fetch shop details
    const shopResp = await fetch(`${API_BASE_URL}/shops/${shopId}`);
    if (!shopResp.ok) throw new Error('Failed to fetch shop details');

    const shop = await shopResp.json();

    // Display modal with filter UI
    const detailsDiv = document.getElementById('shopDetails');
    const stars = generateStars(shop.averageRating);

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
            ${isAuthenticated() ? `
              <button onclick="loadReviewStatistics('${shopId}')" style="margin-top: 10px; padding: 8px 15px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer;">
                📊 Show Review Stats
              </button>
            ` : ''}
          </div>
        </div>

        ${createPhotoGallerySection(shopId, shop.photos, shop.mainPhotoIndex)}
        
        <!-- Review Filters Section -->
        <div class="review-filters-section" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 15px; color: #374151;">Reviews</h3>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 10px; color: #4b5563;">Filter & Sort Reviews:</div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
              <div>
                <div style="font-size: 0.9em; margin-bottom: 5px; color: #6b7280;">Filter by Rating:</div>
                <div style="display: flex; gap: 5px;">
                  <button class="filter-btn ${!currentReviewFilters.minRating ? 'active' : ''}" 
                          onclick="applyReviewFilter('${shopId}', null, '${currentReviewFilters.sortBy}')">
                    All
                  </button>
                  ${[5, 4, 3, 2, 1].map(rating => `
                    <button class="filter-btn ${currentReviewFilters.minRating === rating ? 'active' : ''}"
                            onclick="applyReviewFilter('${shopId}', ${rating}, '${currentReviewFilters.sortBy}')">
                      ${rating}+ ⭐
                    </button>
                  `).join('')}
                </div>
              </div>
              
              <div>
                <div style="font-size: 0.9em; margin-bottom: 5px; color: #6b7280;">Sort by:</div>
                <div style="display: flex; gap: 5px;">
                  <button class="sort-btn ${currentReviewFilters.sortBy === 'date_new' ? 'active' : ''}"
                          onclick="applyReviewFilter('${shopId}', ${currentReviewFilters.minRating || 'null'}, 'date_new')">
                    Newest
                  </button>
                  <button class="sort-btn ${currentReviewFilters.sortBy === 'rating_high' ? 'active' : ''}"
                          onclick="applyReviewFilter('${shopId}', ${currentReviewFilters.minRating || 'null'}, 'rating_high')">
                    Highest
                  </button>
                  <button class="sort-btn ${currentReviewFilters.sortBy === 'rating_low' ? 'active' : ''}"
                          onclick="applyReviewFilter('${shopId}', ${currentReviewFilters.minRating || 'null'}, 'rating_low')">
                    Lowest
                  </button>
                </div>
              </div>
            </div>
            
            <div id="filterInfo" style="font-size: 0.9em; color: #6b7280; padding: 8px; background: white; border-radius: 4px;">
              Showing all reviews sorted by newest first
            </div>
          </div>
        </div>
        
        <!-- Reviews Container -->
        <div id="reviewsContainer" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
          <div style="text-align: center; padding: 30px; color: #9ca3af;">
            Loading reviews...
          </div>
        </div>
      </div>
    `;

    // Load initial reviews
    await loadAndDisplayReviews(shopId);
    document.getElementById('detailsModal').classList.add('show');

  } catch (err) {
    console.error('Error fetching shop details:', err);
    showError('Failed to load shop details.');
  }
}

// ============================================
// REVIEW FILTERING FUNCTIONS
// ============================================

async function loadAndDisplayReviews(shopId) {
  const reviewsContainer = document.getElementById('reviewsContainer');
  const filterInfo = document.getElementById('filterInfo');

  try {
    reviewsContainer.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #9ca3af;">
        Loading reviews...
      </div>
    `;

    // Build query parameters
    const params = new URLSearchParams();

    if (currentReviewFilters.minRating) {
      params.append('minRating', currentReviewFilters.minRating);
    }

    if (currentReviewFilters.sortBy) {
      params.append('sortBy', currentReviewFilters.sortBy);
    }

    // Update filter info text
    let filterText = 'Showing ';
    if (currentReviewFilters.minRating) {
      filterText += `${currentReviewFilters.minRating}+ star reviews `;
    } else {
      filterText += 'all reviews ';
    }

    filterText += 'sorted by ';
    switch (currentReviewFilters.sortBy) {
      case 'date_new':
        filterText += 'newest first';
        break;
      case 'rating_high':
        filterText += 'highest rated';
        break;
      case 'rating_low':
        filterText += 'lowest rated';
        break;
      case 'date_old':
        filterText += 'oldest first';
        break;
      default:
        filterText += 'newest first';
    }

    filterInfo.textContent = filterText;

    // Fetch filtered reviews
    const response = await fetch(
      `${API_BASE_URL}/reviews/${shopId}/filter?${params.toString()}`
    );

    if (!response.ok) throw new Error('Failed to load reviews');

    const data = await response.json();

    if (data.reviews.length === 0) {
      reviewsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #9ca3af;">
          <p style="margin-bottom: 10px;">No reviews found</p>
          <p style="font-size: 0.9em;">Try changing your filters or be the first to review this shop!</p>
        </div>
      `;
      return;
    }

    // Display reviews
    let reviewsHTML = '';
    data.reviews.forEach(review => {
      const reviewDate = new Date(review.date);
      const formattedDate = reviewDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Render images if they exist
      let imagesHTML = '';
      if (review.images && review.images.length > 0) {
        imagesHTML = `
          <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
            ${review.images.map(imageUrl => `
              <img src="${escapeHtml(imageUrl)}" alt="Review image" 
                   style="max-width: 100px; max-height: 100px; border-radius: 4px; object-fit: cover;">
            `).join('')}
          </div>
        `;
      }




      const isOwner = isAuthenticated() && String(review.userId) === String(getUser()?._id);
      const canDelete = isAdmin() || isOwner;

      reviewsHTML += `
        <div id="review-${review._id}" class="review-item" style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #667eea;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #374151;">${escapeHtml(review.reviewer)}</span>
            <span style="color: #9ca3af; font-size: 0.85em;">${formattedDate}</span>
          </div>
          <div style="color: #f59e0b; font-weight: 600; margin-bottom: 8px;">
            ${'⭐'.repeat(review.rating)} (${review.rating}/5)
          </div>
          <p style="color: #4b5563; line-height: 1.4; font-size: 0.9em;">${escapeHtml(review.comment)}</p>
          ${imagesHTML}
          ${(isOwner || canDelete) ? `
            <div style="margin-top: 10px; display: flex; gap: 8px;">
              ${isOwner ? `
              <button class="btn btn-secondary" onclick="editReview('${review._id}')">
                ✏️ Edit Review
              </button>
              ` : ''}
              ${canDelete ? `
              <button class="btn btn-danger" onclick="deleteReview('${review._id}')">
                🗑️ Delete Review
              </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    });

    reviewsContainer.innerHTML = reviewsHTML;

  } catch (error) {
    console.error('Error loading reviews:', error);
    reviewsContainer.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #dc2626;">
        Failed to load reviews. Please try again.
      </div>
    `;
  }
}

function applyReviewFilter(shopId, minRating, sortBy) {
  // Update current filters
  currentReviewFilters.minRating = minRating === 'null' ? null : parseInt(minRating);
  currentReviewFilters.sortBy = sortBy;

  // Update button active states
  updateFilterButtonStates(minRating, sortBy);

  // Reload reviews with new filters
  loadAndDisplayReviews(shopId);
}

function updateFilterButtonStates(minRating, sortBy) {
  // Update rating filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Activate the correct rating filter
  if (minRating === 'null') {
    document.querySelector('.filter-btn:first-child').classList.add('active');
  } else {
    const rating = parseInt(minRating);
    const ratingBtn = Array.from(document.querySelectorAll('.filter-btn')).find(btn =>
      btn.textContent.includes(`${rating}+`)
    );
    if (ratingBtn) ratingBtn.classList.add('active');
  }

  // Update sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Activate the correct sort button
  const sortBtn = Array.from(document.querySelectorAll('.sort-btn')).find(btn => {
    if (sortBy === 'date_new') return btn.textContent === 'Newest';
    if (sortBy === 'rating_high') return btn.textContent === 'Highest';
    if (sortBy === 'rating_low') return btn.textContent === 'Lowest';
    return false;
  });
  if (sortBtn) sortBtn.classList.add('active');
}

async function loadReviewStatistics(shopId) {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${shopId}/stats`);
    if (!response.ok) throw new Error('Failed to load statistics');

    const stats = await response.json();
    displayReviewStatistics(stats, shopId);
  } catch (error) {
    console.error('Error loading statistics:', error);
    showError('Failed to load review statistics.');
  }
}

function displayReviewStatistics(stats, shopId) {
  const detailsDiv = document.getElementById('shopDetails');

  let distributionHTML = '';
  for (let rating = 5; rating >= 1; rating--) {
    const count = stats.distribution[rating] || 0;
    const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : 0;

    distributionHTML += `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-weight: 500; color: #374151;">${rating} ⭐</span>
          <span style="color: #6b7280;">${count} reviews (${percentage}%)</span>
        </div>
        <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${percentage}%; 
                background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }

  const modalContent = `
    <div style="max-height: 80vh; overflow-y: auto;">
      <h3 style="color: #667eea; margin-bottom: 20px;">📊 Review Statistics</h3>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 0.9em; color: #6b7280;">Total Reviews</div>
          <div style="font-size: 2em; font-weight: 700; color: #667eea;">${stats.total}</div>
        </div>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 0.9em; color: #6b7280;">Average Rating</div>
          <div style="font-size: 2em; font-weight: 700; color: #f59e0b;">${stats.average.toFixed(1)}</div>
        </div>
      </div>
      
      <h4 style="margin-bottom: 15px; color: #374151;">Rating Distribution</h4>
      ${distributionHTML}
      
      ${stats.recent.length > 0 ? `
        <h4 style="margin-top: 25px; margin-bottom: 15px; color: #374151;">Recent Reviews</h4>
        ${stats.recent.map(review => `
          <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600; color: #374151;">${escapeHtml(review.reviewer)}</span>
              <span style="color: #f59e0b;">${'⭐'.repeat(review.rating)}</span>
            </div>
            <p style="color: #6b7280; margin-top: 5px; font-size: 0.9em;">${escapeHtml(review.comment)}</p>
          </div>
        `).join('')}
      ` : ''}
      
      <button onclick="showShopDetails('${shopId}')" 
              style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%;">
        ← Back to Shop Details
      </button>
    </div>
  `;

  detailsDiv.innerHTML = modalContent;
}

function closeDetailsModal() {
  document.getElementById('detailsModal').classList.remove('show');
}

// ============================================
// REVIEW MODAL
// ============================================
function openReviewModal(shopId, shopName) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('currentShopId').value = shopId;
  const modal = document.getElementById('reviewModal');
  modal.classList.add('show');

  // Reset form
  document.getElementById('reviewForm').reset();
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('show');
  document.getElementById('reviewForm').reset();
}

// Image preview functionality
function setupImagePreview() {
  const fileInput = document.getElementById('reviewImages');
  const previewContainer = document.getElementById('imagePreview');

  if (fileInput && previewContainer) {
    fileInput.addEventListener('change', function (e) {
      previewContainer.innerHTML = '';

      if (e.target.files && e.target.files.length > 0) {
        Array.from(e.target.files).forEach(file => {
          const reader = new FileReader();
          reader.onload = function (event) {
            const imgPreview = document.createElement('div');
            imgPreview.className = 'image-preview-item';
            imgPreview.innerHTML = `
              <img src="${event.target.result}" alt="${file.name}" style="max-width: 100px; max-height: 100px; border-radius: 4px; object-fit: cover; margin-right: 8px; margin-bottom: 8px;">
              <span class="image-preview-name">${file.name}</span>
            `;
            previewContainer.appendChild(imgPreview);
          };
          reader.readAsDataURL(file);
        });
      }
    });
  }
}

async function submitReview(e) {
  e.preventDefault();

  // If we are editing a review, route to updateReview instead
  if (editingReviewId) {
    updateReview(editingReviewId);
    return;
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const shopId = document.getElementById('currentShopId').value;
  const rating = parseInt(document.getElementById('rating').value);
  const comment = document.getElementById('comment').value.trim();
  const files = document.getElementById('reviewImages').files;
  const user = getUser();

  if (!shopId || !rating || !comment) {
    showError('Please fill in all fields.');
    return;
  }

  // Create FormData to handle file uploads
  const formData = new FormData();
  formData.append('shopId', shopId);
  formData.append('rating', rating);
  formData.append('comment', comment);
  // Reviewer name is taken from logged-in user, not form input

  // Append files to form data
  if (files.length > 0) {
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
      body: formData
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
  } catch (err) {
    console.error('Error submitting review:', err);
    showError('Failed to submit review. Please try again.');
  }
}

// ============================================
// ADD SHOP MODAL
// ============================================
function openAddShopModal() {
  document.getElementById('addShopModal').style.display = 'block';
  document.getElementById('addShopForm').reset();
  document.getElementById('addShopMsg').textContent = '';
}

function closeAddShopModal() {
  document.getElementById('addShopModal').style.display = 'none';
}

// Shop image preview functionality
function setupShopImagePreview() {
  const fileInput = document.getElementById('newShopPhotos');
  const previewContainer = document.getElementById('shopImagePreview');

  if (fileInput && previewContainer) {
    fileInput.addEventListener('change', function (e) {
      previewContainer.innerHTML = '';

      if (e.target.files && e.target.files.length > 0) {
        Array.from(e.target.files).forEach(file => {
          const reader = new FileReader();
          reader.onload = function (event) {
            const imgPreview = document.createElement('div');
            imgPreview.className = 'image-preview-item';
            imgPreview.innerHTML = `
              <img src="${event.target.result}" alt="${file.name}" style="max-width: 100px; max-height: 100px; border-radius: 4px; object-fit: cover; margin-right: 8px; margin-bottom: 8px;">
              <span class="image-preview-name">${file.name}</span>
            `;
            previewContainer.appendChild(imgPreview);
          };
          reader.readAsDataURL(file);
        });
      }
    });
  }
}

async function submitAddShop(e) {
  e.preventDefault();

  // Check if user is authenticated
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const name = document.getElementById('newShopName').value.trim();
  const category = document.getElementById('newShopCategory').value.trim();
  const location = document.getElementById('newShopLocation').value.trim();
  const files = document.getElementById('newShopPhotos').files;
  const msg = document.getElementById('addShopMsg');

  if (!name || !category || !location) {
    msg.textContent = 'Please fill all fields.';
    msg.style.color = 'red';
    return;
  }

  // Create FormData to handle file uploads
  const formData = new FormData();
  formData.append('name', name);
  formData.append('category', category);
  formData.append('location', location);

  // Append files to form data
  if (files.length > 0) {
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/shops`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
      body: formData
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.message || 'Failed to add shop');
    }

    msg.textContent = '✓ Shop added successfully!';
    msg.style.color = 'green';

    // Close modal and reload shops after a delay
    setTimeout(() => {
      closeAddShopModal();
      loadShops();
    }, 1500);

  } catch (err) {
    console.error('Error adding shop:', err);
    msg.textContent = 'Failed to add shop. Please try again.';
    msg.style.color = 'red';
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
  if (!text) return '';
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
window.onclick = function (event) {
  const reviewModal = document.getElementById('reviewModal');
  const detailsModal = document.getElementById('detailsModal');
  const addShopModal = document.getElementById('addShopModal');

  if (event.target === reviewModal) {
    closeReviewModal();
  }
  if (event.target === detailsModal) {
    closeDetailsModal();
  }
  if (event.target === addShopModal) {
    closeAddShopModal();
  }
};


// ============================================
// Filtering Categories & Locations - COMPLETE FIX
// ============================================

// 🔹 Global filter state
let selectedCategory = "";
let selectedLocation = "";

// ============================================
// Fetch categories & locations
// ============================================
async function loadFilters() {
  try {
    const resp = await fetch(`${API_BASE_URL}/shops`);
    const shops = await resp.json();

    // Get unique categories (normalized to lowercase)
    const categories = [
      ...new Set(
        shops.map(s => s.category.trim().toLowerCase())
      )
    ];

    // Get unique locations (normalized to lowercase)
    const locations = [
      ...new Set(
        shops.map(s => s.location.trim().toLowerCase())
      )
    ];

    renderFilters('categoryFilters', categories, (category) => {
      selectedCategory = category;
      fetchFilteredShops();
    });

    renderFilters('locationFilters', locations, (location) => {
      selectedLocation = location;
      fetchFilteredShops();
    });
  } catch (err) {
    console.error('Failed to load filters', err);
  }
}

// ============================================
// Fetch shops using BOTH filters combined
// ============================================
async function fetchFilteredShops() {
  showLoading();
  clearError();

  let url = `${API_BASE_URL}/shops`;

  // Build query with BOTH filters
  const params = new URLSearchParams();

  if (selectedCategory) {
    params.append('category', selectedCategory);
  }

  if (selectedLocation) {
    params.append('location', selectedLocation);
  }

  // Always add the query string if we have any filters
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Failed to fetch shops");

    const shops = await resp.json();
    displayShops(shops);

  } catch (err) {
    console.error(err);
    showError('Failed to load filtered shops');
  } finally {
    hideLoading();
  }
}

// ============================================
// Render filter buttons with proper reset
// ============================================
function renderFilters(containerId, items, onClickHandler) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // 🔹 ALL button
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = 'filter-btn active'; // Default active

  allBtn.onclick = () => {
    // Remove active class from all buttons
    [...container.children].forEach(btn => btn.classList.remove('active'));
    // Add active to this button
    allBtn.classList.add('active');

    // Clear the appropriate filter
    if (containerId === 'categoryFilters') {
      selectedCategory = "";
    } else if (containerId === 'locationFilters') {
      selectedLocation = "";
    }

    // Fetch with updated filters
    fetchFilteredShops();
  };

  container.appendChild(allBtn);

  // 🔹 Category/Location buttons
  items.forEach(item => {
    const btn = document.createElement('button');
    // Display with first letter capitalized
    btn.textContent = item.charAt(0).toUpperCase() + item.slice(1);
    btn.className = 'filter-btn';

    btn.onclick = () => {
      // Remove active class from all buttons in this container
      [...container.children].forEach(btn => btn.classList.remove('active'));
      // Add active to clicked button
      btn.classList.add('active');

      // Call the handler with the filter value
      onClickHandler(item);
    };

    container.appendChild(btn);
  });
}
// ============================================
// RESET FILTERS BUTTON (Styled better)
// ============================================
function addResetFiltersButton() {
  const searchBox = document.querySelector('.search-box');

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Filters';
  resetBtn.className = 'reset-btn';

  resetBtn.onclick = () => {
    // Reset all filters
    selectedCategory = "";
    selectedLocation = "";

    // Reset UI buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Activate "All" buttons
    document.querySelectorAll('#categoryFilters .filter-btn:first-child, #locationFilters .filter-btn:first-child')
      .forEach(btn => btn.classList.add('active'));

    // Clear search input
    document.getElementById('searchInput').value = '';

    // Reload all shops
    loadShops();
  };

  searchBox.appendChild(resetBtn);
}

// ============================================
// SHOP COMPARATOR MODAL FUNCTIONS
// ============================================

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  // Comparator FAB button
  const comparatorBtn = document.getElementById('openComparatorBtn');
  if (comparatorBtn) {
    comparatorBtn.addEventListener('click', openComparatorModal);
  }

  // Modal compare button
  const modalCompareBtn = document.getElementById('modalCompareBtn');
  if (modalCompareBtn) {
    modalCompareBtn.addEventListener('click', handleModalCompare);
  }

  // Load shop suggestions for autocomplete
  loadShopSuggestions();
});

function openComparatorModal() {
  document.getElementById('comparatorModal').style.display = 'block';
  document.getElementById('comparatorResult').style.display = 'none';
  document.getElementById('comparatorResult').innerHTML = '';
}

function closeComparatorModal() {
  document.getElementById('comparatorModal').style.display = 'none';
}

async function loadShopSuggestions() {
  try {
    const response = await fetch(`${API_BASE_URL}/shops`);
    if (!response.ok) return;

    const shops = await response.json();
    const shopNames = shops.map(shop => shop.name);

    // Add to both datalists (clear existing options first to avoid duplicates)
    const datalist1 = document.getElementById('shopSuggestions1');
    const datalist2 = document.getElementById('shopSuggestions2');

    // Clear existing options
    datalist1.innerHTML = '';
    datalist2.innerHTML = '';

    // Add unique options
    const uniqueNames = [...new Set(shopNames)];
    uniqueNames.forEach(name => {
      const option1 = document.createElement('option');
      option1.value = name;
      datalist1.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = name;
      datalist2.appendChild(option2);
    });
  } catch (err) {
    console.error('Error loading shop suggestions:', err);
  }
}

async function handleModalCompare() {
  const shop1 = document.getElementById('modalShop1').value.trim();
  const shop2 = document.getElementById('modalShop2').value.trim();
  const resultDiv = document.getElementById('comparatorResult');

  // Validation
  if (!shop1 || !shop2) {
    showComparatorResult('❌ Please enter both shop names', 'error');
    return;
  }

  if (shop1.toLowerCase() === shop2.toLowerCase()) {
    showComparatorResult('❌ Please select two different shops', 'error');
    return;
  }

  // Show loading
  resultDiv.innerHTML = `
    <div class="comparator-loading">
      <div class="comparator-loading-spinner"></div>
      <p>Comparing shops...</p>
    </div>
  `;
  resultDiv.style.display = 'block';

  try {
    const response = await fetch(
      `${API_BASE_URL}/shops/compare-by-name?shop1=${encodeURIComponent(shop1)}&shop2=${encodeURIComponent(shop2)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('One or both shops not found. Check shop names!');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    displayComparatorResult(data);

  } catch (error) {
    showComparatorResult(`❌ ${error.message}`, 'error');
  }
}

function displayComparatorResult(data) {
  const { shop1, shop2, comparison } = data;
  const resultDiv = document.getElementById('comparatorResult');

  const winner = shop1.averageRating > shop2.averageRating ? shop1.name : shop2.name;
  const ratingDiff = Math.abs(shop1.averageRating - shop2.averageRating).toFixed(2);

  const html = `
    <div class="comparator-shops">
      <div class="comparator-shop">
        <h4>${escapeHtml(shop1.name)}</h4>
        <p><strong>Category:</strong> ${escapeHtml(shop1.category)}</p>
        <p><strong>Location:</strong> ${escapeHtml(shop1.location)}</p>
        <p><strong>Rating:</strong> <span style="color: #f59e0b; font-weight: bold;">${shop1.averageRating.toFixed(1)} ⭐</span></p>
        <p><strong>Reviews:</strong> ${shop1.reviewCount}</p>
      </div>
      
      <div class="comparator-shop">
        <h4>${escapeHtml(shop2.name)}</h4>
        <p><strong>Category:</strong> ${escapeHtml(shop2.category)}</p>
        <p><strong>Location:</strong> ${escapeHtml(shop2.location)}</p>
        <p><strong>Rating:</strong> <span style="color: #f59e0b; font-weight: bold;">${shop2.averageRating.toFixed(1)} ⭐</span></p>
        <p><strong>Reviews:</strong> ${shop2.reviewCount}</p>
      </div>
    </div>
    
    <div class="comparator-stats">
      <h4>📊 Comparison Summary</h4>
      <p><strong>Rating Difference:</strong> ${ratingDiff} points</p>
      <p><strong>Higher Rated:</strong> ${escapeHtml(winner)}</p>
      <p><strong>More Reviews:</strong> ${escapeHtml(comparison.moreReviews)}</p>
    </div>
    
    <div class="comparator-winner">
      🏆 Winner: ${escapeHtml(winner)}
    </div>
  `;

  resultDiv.innerHTML = html;
  resultDiv.style.display = 'block';
}

function showComparatorResult(message, type = 'error') {
  const resultDiv = document.getElementById('comparatorResult');
  const className = type === 'error' ? 'comparator-error' : 'comparator-success';

  resultDiv.innerHTML = `
    <div class="${className}">
      ${message}
    </div>
  `;
  resultDiv.style.display = 'block';
}

// Close modal when clicking outside
window.onclick = function (event) {
  const comparatorModal = document.getElementById('comparatorModal');
  if (event.target === comparatorModal) {
    closeComparatorModal();
  }
};


// ============================================
// SHOP COMPARATOR MODAL FUNCTIONS
// ============================================

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  // Comparator FAB button
  const comparatorBtn = document.getElementById('openComparatorBtn');
  if (comparatorBtn) {
    comparatorBtn.addEventListener('click', openComparatorModal);
  }

  // Modal compare button
  const modalCompareBtn = document.getElementById('modalCompareBtn');
  if (modalCompareBtn) {
    modalCompareBtn.addEventListener('click', handleModalCompare);
  }

  // Load shop suggestions for autocomplete
  loadShopSuggestions();
});

function openComparatorModal() {
  document.getElementById('comparatorModal').style.display = 'block';
  document.getElementById('comparatorResult').style.display = 'none';
  document.getElementById('comparatorResult').innerHTML = '';
}

function closeComparatorModal() {
  document.getElementById('comparatorModal').style.display = 'none';
}

async function loadShopSuggestions() {
  try {
    const response = await fetch(`${API_BASE_URL}/shops`);
    if (!response.ok) return;

    const shops = await response.json();
    const shopNames = shops.map(shop => shop.name);

    // Add to both datalists (clear existing options first to avoid duplicates)
    const datalist1 = document.getElementById('shopSuggestions1');
    const datalist2 = document.getElementById('shopSuggestions2');

    // Clear existing options
    datalist1.innerHTML = '';
    datalist2.innerHTML = '';

    // Add unique options
    const uniqueNames = [...new Set(shopNames)];
    uniqueNames.forEach(name => {
      const option1 = document.createElement('option');
      option1.value = name;
      datalist1.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = name;
      datalist2.appendChild(option2);
    });
  } catch (err) {
    console.error('Error loading shop suggestions:', err);
  }
}

async function handleModalCompare() {
  const shop1 = document.getElementById('modalShop1').value.trim();
  const shop2 = document.getElementById('modalShop2').value.trim();
  const resultDiv = document.getElementById('comparatorResult');

  // Validation
  if (!shop1 || !shop2) {
    showComparatorResult('❌ Please enter both shop names', 'error');
    return;
  }

  if (shop1.toLowerCase() === shop2.toLowerCase()) {
    showComparatorResult('❌ Please select two different shops', 'error');
    return;
  }

  // Show loading
  resultDiv.innerHTML = `
    <div class="comparator-loading">
      <div class="comparator-loading-spinner"></div>
      <p>Comparing shops...</p>
    </div>
  `;
  resultDiv.style.display = 'block';

  try {
    const response = await fetch(
      `${API_BASE_URL}/shops/compare-by-name?shop1=${encodeURIComponent(shop1)}&shop2=${encodeURIComponent(shop2)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('One or both shops not found. Check shop names!');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    displayComparatorResult(data);

  } catch (error) {
    showComparatorResult(`❌ ${error.message}`, 'error');
  }
}

function displayComparatorResult(data) {
  const { shop1, shop2, comparison } = data;
  const resultDiv = document.getElementById('comparatorResult');

  const winner = shop1.averageRating > shop2.averageRating ? shop1.name : shop2.name;
  const ratingDiff = Math.abs(shop1.averageRating - shop2.averageRating).toFixed(2);

  const html = `
    <div class="comparator-shops">
      <div class="comparator-shop">
        <h4>${escapeHtml(shop1.name)}</h4>
        <p><strong>Category:</strong> ${escapeHtml(shop1.category)}</p>
        <p><strong>Location:</strong> ${escapeHtml(shop1.location)}</p>
        <p><strong>Rating:</strong> <span style="color: #f59e0b; font-weight: bold;">${shop1.averageRating.toFixed(1)} ⭐</span></p>
        <p><strong>Reviews:</strong> ${shop1.reviewCount}</p>
      </div>
      
      <div class="comparator-shop">
        <h4>${escapeHtml(shop2.name)}</h4>
        <p><strong>Category:</strong> ${escapeHtml(shop2.category)}</p>
        <p><strong>Location:</strong> ${escapeHtml(shop2.location)}</p>
        <p><strong>Rating:</strong> <span style="color: #f59e0b; font-weight: bold;">${shop2.averageRating.toFixed(1)} ⭐</span></p>
        <p><strong>Reviews:</strong> ${shop2.reviewCount}</p>
      </div>
    </div>
    
    <div class="comparator-stats">
      <h4>📊 Comparison Summary</h4>
      <p><strong>Rating Difference:</strong> ${ratingDiff} points</p>
      <p><strong>Higher Rated:</strong> ${escapeHtml(winner)}</p>
      <p><strong>More Reviews:</strong> ${escapeHtml(comparison.moreReviews)}</p>
    </div>
    
    <div class="comparator-winner">
      🏆 Winner: ${escapeHtml(winner)}
    </div>
  `;

  resultDiv.innerHTML = html;
  resultDiv.style.display = 'block';
}

function showComparatorResult(message, type = 'error') {
  const resultDiv = document.getElementById('comparatorResult');
  const className = type === 'error' ? 'comparator-error' : 'comparator-success';

  resultDiv.innerHTML = `
    <div class="${className}">
      ${message}
    </div>
  `;
  resultDiv.style.display = 'block';
}

// Close modal when clicking outside
window.onclick = function (event) {
  const comparatorModal = document.getElementById('comparatorModal');
  if (event.target === comparatorModal) {
    closeComparatorModal();
  }
};

// ============================================
// Initialize with reset button
// ============================================

function initializeAll() {
  loadShops();
  setupEventListeners();
  setupAddShopButton();
  loadFilters();
  addResetFiltersButton();
  setupComparator();
}

function setupComparator() {
  // Comparator FAB button
  const comparatorBtn = document.getElementById('openComparatorBtn');
  if (comparatorBtn) {
    comparatorBtn.addEventListener('click', openComparatorModal);
  }

  // Modal compare button
  const modalCompareBtn = document.getElementById('modalCompareBtn');
  if (modalCompareBtn) {
    modalCompareBtn.addEventListener('click', handleModalCompare);
  }

  // Load shop suggestions for autocomplete
  loadShopSuggestions();

  // Close modal when clicking outside
  window.addEventListener('click', function (event) {
    const comparatorModal = document.getElementById('comparatorModal');
    if (event.target === comparatorModal) {
      closeComparatorModal();
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeAll);

// ============================================
// FAVORITES FEATURE
// ============================================

async function toggleFavorite(shopId) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    alert('Please login to add favorites');
    window.location.href = 'login.html';
    return;
  }

  const favBtn = document.getElementById(`fav-${shopId}`);

  try {
    // Check if already favorited
    const checkResp = await fetch(`${API_BASE_URL}/favorites/check/${shopId}`, {
      headers: getAuthHeaders()
    });
    const checkData = await checkResp.json();

    if (checkData.isFavorited) {
      // Remove from favorites
      await fetch(`${API_BASE_URL}/favorites/${shopId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      favBtn.classList.remove('active');
      favBtn.innerHTML = '🤍';
    } else {
      // Add to favorites
      await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ shopId })
      });
      favBtn.classList.add('active');
      favBtn.innerHTML = '❤️';
    }

    // Animate the button
    favBtn.classList.add('pop');
    setTimeout(() => favBtn.classList.remove('pop'), 300);

    // Update favorites count
    updateFavoritesCount();

  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
}

async function checkAndUpdateFavoriteButton(shopId) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/favorites/check/${shopId}`, {
      headers: getAuthHeaders()
    });
    const data = await resp.json();

    const favBtn = document.getElementById(`fav-${shopId}`);
    if (favBtn && data.isFavorited) {
      favBtn.classList.add('active');
      favBtn.innerHTML = '❤️';
    }
  } catch (error) {
    console.error('Error checking favorite:', error);
  }
}

async function updateFavoritesCount() {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    const countEl = document.getElementById('favCount');
    if (countEl) {
      countEl.textContent = '0';
    }
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/favorites`, {
      headers: getAuthHeaders()
    });
    const favorites = await resp.json();

    const countEl = document.getElementById('favCount');
    if (countEl) {
      countEl.textContent = favorites.length || 0;
    }
  } catch (error) {
    console.error('Error updating favorites count:', error);
  }
}

function openFavoritesModal() {
  const modal = document.getElementById('favoritesModal');
  modal.classList.add('show');
  loadFavorites();
}

function closeFavoritesModal() {
  document.getElementById('favoritesModal').classList.remove('show');
}

async function loadFavorites() {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    const listEl = document.getElementById('favoritesList');
    listEl.innerHTML = `
      <div class="empty-favorites">
        <div class="empty-favorites-icon">💔</div>
        <p>Please login to view favorites!</p>
        <p style="font-size: 0.9em; opacity: 0.8;">Login to save and view your favorite shops.</p>
      </div>
    `;
    return;
  }

  const listEl = document.getElementById('favoritesList');

  try {
    listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading...</div>';

    const resp = await fetch(`${API_BASE_URL}/favorites`, {
      headers: getAuthHeaders()
    });
    const favorites = await resp.json();

    if (favorites.length === 0) {
      listEl.innerHTML = `
        <div class="empty-favorites">
          <div class="empty-favorites-icon">💔</div>
          <p>No favorite shops yet!</p>
          <p style="font-size: 0.9em; opacity: 0.8;">Click the heart icon on any shop to add it here.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = favorites.map(shop => `
      <div class="favorite-item" onclick="closeFavoritesModal(); showShopDetails('${shop._id}')">
        <div class="favorite-item-icon">${shop.name.charAt(0).toUpperCase()}</div>
        <div class="favorite-item-info">
          <div class="favorite-item-name">${escapeHtml(shop.name)}</div>
          <div class="favorite-item-meta">
            ${escapeHtml(shop.category)} • ${escapeHtml(shop.location)}
          </div>
          <div class="favorite-item-rating">
            ⭐ ${shop.averageRating.toFixed(1)} (${shop.reviewCount} reviews)
          </div>
        </div>
        <button class="remove-favorite-btn" onclick="event.stopPropagation(); removeFavorite('${shop._id}')">
          Remove
        </button>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading favorites:', error);
    listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc2626;">Failed to load favorites</div>';
  }
}

async function removeFavorite(shopId) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    alert('Please login to remove favorites');
    window.location.href = 'login.html';
    return;
  }

  try {
    await fetch(`${API_BASE_URL}/favorites/${shopId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    // Update the shop card button if visible
    const favBtn = document.getElementById(`fav-${shopId}`);
    if (favBtn) {
      favBtn.classList.remove('active');
      favBtn.innerHTML = '🤍';
    }

    // Reload favorites list and update count
    loadFavorites();
    updateFavoritesCount();

  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

// ============================================
// PHOTO GALLERY FEATURE
// ============================================

function createPhotoGallerySection(shopId, photos = [], mainPhotoIndex = 0) {
  // Hide the entire photo gallery section for non-admin users when there are no photos
  if ((!photos || photos.length === 0) && !isAdmin()) {
    return '';
  }

  return `
    <div class="photo-gallery-section">
      <div class="photo-gallery-header">
        <h4>📸 Photo Gallery</h4>
        ${isAdmin() ? `
          <button class="add-photo-btn" onclick="showAddPhotoForm('${shopId}')">
            + Add Photo
          </button>
        ` : ''}
      </div>
      <div id="addPhotoForm-${shopId}" style="display: none; margin-bottom: 15px;">
        <input type="file" class="photo-file-input" id="photoFile-${shopId}" accept="image/*">
        <input type="text" class="photo-url-input" id="photoCaption-${shopId}" 
               placeholder="Optional caption" style="margin-top: 5px;">
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button class="add-photo-btn" onclick="submitPhoto('${shopId}')">Add</button>
          <button class="add-photo-btn" style="background: #6b7280;" onclick="hideAddPhotoForm('${shopId}')">Cancel</button>
        </div>
      </div>
      <div class="photo-carousel" id="photoCarousel-${shopId}">
          ${photos.length > 0 ? photos.map((photo, index) => `
            <div class="photo-item ${index === mainPhotoIndex ? 'main-photo' : ''}">
              <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption || 'Shop photo')}" 
                   onerror="this.src='https://via.placeholder.com/150x120?text=Image+Not+Found'">
              ${photo.caption ? `<div class="photo-item-overlay">${escapeHtml(photo.caption)}</div>` : ''}
               <div class="photo-item-actions">
                 ${index === mainPhotoIndex ? `
                   <span class="main-photo-badge">Main</span>
                 ` : isAdmin() ? `
                   <button class="set-main-photo-btn" onclick="setMainPhoto('${shopId}', ${index})">
                     Set as Main
                   </button>
                 ` : ''}
                 ${isAdmin() ? `
                   <button class="delete-photo-btn" onclick="deleteShopPhoto('${shopId}', ${index})">
                     🗑️ Delete
                   </button>
                 ` : ''}
               </div>
            </div>
          `).join('') : `
            <div class="empty-gallery">
              <div class="empty-gallery-icon">📷</div>
              <p>No photos yet. Be the first to add one!</p>
            </div>
          `}
      </div>
    </div>
  `;
}

async function setMainPhoto(shopId, photoIndex) {
  try {
    const resp = await fetch(`${API_BASE_URL}/shops/${shopId}/main-photo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ photoIndex })
    });

    if (!resp.ok) throw new Error('Failed to set main photo');

    const data = await resp.json();

    // Refresh the photo gallery to show the updated main photo
    const shopDetails = await fetch(`${API_BASE_URL}/shops/${shopId}`);
    const shop = await shopDetails.json();
    const detailsDiv = document.getElementById('shopDetails');
    const stars = generateStars(shop.averageRating);
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
            ${isAuthenticated() ? `
              <button onclick="loadReviewStatistics('${shopId}')" style="margin-top: 10px; padding: 8px 15px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer;">
                📊 Show Review Stats
              </button>
            ` : ''}
          </div>
        </div>

        ${createPhotoGallerySection(shopId, shop.photos, shop.mainPhotoIndex)}
        
        <!-- Review Filters Section -->
        <div class="review-filters-section" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 15px; color: #374151;">Reviews</h3>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 10px; color: #4b5563;">Filter & Sort Reviews:</div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
              <div>
                <div style="font-size: 0.9em; margin-bottom: 5px; color: #6b7280;">Filter by Rating:</div>
                <div style="display: flex; gap: 5px;">
                  <button class="filter-btn ${!currentReviewFilters.minRating ? 'active' : ''}" 
                          onclick="applyReviewFilter('${shopId}', null, '${currentReviewFilters.sortBy}')">
                    All
                  </button>
                  ${[5, 4, 3, 2, 1].map(rating => `
                    <button class="filter-btn ${currentReviewFilters.minRating === rating ? 'active' : ''}"
                            onclick="applyReviewFilter('${shopId}', ${rating}, '${currentReviewFilters.sortBy}')">
                      ${rating}+ ⭐
                    </button>
                  `).join('')}
                </div>
              </div>
              
              <div>
                <div style="font-size: 0.9em; margin-bottom: 5px; color: #6b7280;">Sort by:</div>
                <div style="display: flex; gap: 5px;">
                  <button class="sort-btn ${currentReviewFilters.sortBy === 'date_new' ? 'active' : ''}"
                          onclick="applyReviewFilter('${shopId}', ${currentReviewFilters.minRating || 'null'}, 'date_new')">
                    Newest
                  </button>
                  <button class="sort-btn ${currentReviewFilters.sortBy === 'rating_high' ? 'active' : ''}"
                          onclick="applyReviewFilter('${shopId}', ${currentReviewFilters.minRating || 'null'}, 'rating_high')">
                    Highest
                  </button>
                  <button class="sort-btn ${currentReviewFilters.sortBy === 'rating_low' ? 'active' : ''}"
                          onclick="applyReviewFilter('${shopId}', ${currentReviewFilters.minRating || 'null'}, 'rating_low')">
                    Lowest
                  </button>
                </div>
              </div>
            </div>
            
            <div id="filterInfo" style="font-size: 0.9em; color: #6b7280; padding: 8px; background: white; border-radius: 4px;">
              Showing all reviews sorted by newest first
            </div>
          </div>
        </div>
        
        <!-- Reviews Container -->
        <div id="reviewsContainer" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
          <div style="text-align: center; padding: 30px; color: #9ca3af;">
            Loading reviews...
          </div>
        </div>
      </div>
    `;

    // Load initial reviews
    await loadAndDisplayReviews(shopId);

  } catch (error) {
    console.error('Error setting main photo:', error);
    alert('Failed to set main photo. Please try again.');
  }
}

function showAddPhotoForm(shopId) {
  if (!isAuthenticated()) {
    alert('Please login to add photos to shops');
    window.location.href = 'login.html';
    return;
  }

  document.getElementById(`addPhotoForm-${shopId}`).style.display = 'block';
}

function hideAddPhotoForm(shopId) {
  document.getElementById(`addPhotoForm-${shopId}`).style.display = 'none';
  document.getElementById(`photoFile-${shopId}`).value = '';
  document.getElementById(`photoCaption-${shopId}`).value = '';
}

async function submitPhoto(shopId) {
  if (!isAuthenticated()) {
    alert('Please login to add photos to shops');
    window.location.href = 'login.html';
    return;
  }

  const fileInput = document.getElementById(`photoFile-${shopId}`);
  const caption = document.getElementById(`photoCaption-${shopId}`).value.trim();

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Please select an image file to upload');
    return;
  }

  const formData = new FormData();
  formData.append('photo', fileInput.files[0]);
  formData.append('caption', caption);

  try {
    const resp = await fetch(`${API_BASE_URL}/shops/${shopId}/photos`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
      body: formData
    });

    if (!resp.ok) throw new Error('Failed to add photo');

    const data = await resp.json();
    hideAddPhotoForm(shopId);

    // Refresh the photo carousel using updatePhotoCarousel function
    const shopDetails = await fetch(`${API_BASE_URL}/shops/${shopId}`);
    const shop = await shopDetails.json();
    updatePhotoCarousel(shopId, shop.photos, shop.mainPhotoIndex);

    // Refresh the shops list to update the shop card
    loadShops();

  } catch (error) {
    console.error('Error adding photo:', error);
    alert('Failed to add photo. Please try again.');
  }
}

// ============================================
// HELPFUL VOTES FEATURE
// ============================================

function createHelpfulButton(reviewId, helpfulCount = 0, hasVoted = false) {
  return `
    <div class="review-footer">
      <button class="helpful-btn ${hasVoted ? 'active' : ''}" 
              id="helpful-${reviewId}" 
              onclick="toggleHelpful('${reviewId}')">
        <span class="helpful-icon">👍</span>
        Helpful
        <span class="helpful-count">${helpfulCount}</span>
      </button>
    </div>
  `;
}

async function toggleHelpful(reviewId) {
  const sessionId = getSessionId();
  const btn = document.getElementById(`helpful-${reviewId}`);

  try {
    // Check current state
    const checkResp = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful?sessionId=${sessionId}`);
    const checkData = await checkResp.json();

    if (checkData.hasVoted) {
      // Remove vote
      await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful?sessionId=${sessionId}`, {
        method: 'DELETE'
      });
      btn.classList.remove('active');
      btn.querySelector('.helpful-count').textContent = checkData.helpfulCount - 1;
    } else {
      // Add vote
      await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      btn.classList.add('active');
      btn.querySelector('.helpful-count').textContent = checkData.helpfulCount + 1;
    }

    // Animate
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 400);

  } catch (error) {
    console.error('Error toggling helpful:', error);
  }
}

// ============================================
// MODAL CLOSE HANDLERS (Updated)
// ============================================

// Update window.onclick to include favorites modal
// Delete confirmation modal variables
let deleteCallback = null;

// Open delete confirmation modal
function openDeleteModal(title, message, callback) {
  const modal = document.getElementById('deleteModal');
  const modalTitle = document.getElementById('deleteModalTitle');
  const modalMessage = document.getElementById('deleteModalMessage');

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  deleteCallback = callback;
  modal.classList.add('show');
}

// Close delete confirmation modal
function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  modal.classList.remove('show');
  deleteCallback = null;
}

// Confirm delete
function confirmDelete() {
  if (deleteCallback) {
    deleteCallback();
  }
  closeDeleteModal();
}

// Delete a shop
async function deleteShop(shopId) {
  openDeleteModal(
    'Delete Shop',
    'Are you sure you want to delete this shop? All reviews and photos will be deleted permanently.',
    async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shops/${shopId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Failed to delete shop');
        }

        // Refresh the shops list
        loadShops();
      } catch (error) {
        console.error('Error deleting shop:', error);
        alert('Failed to delete shop. Please try again.');
      }
    }
  );
}

// Track whether we are editing a review (holds the review ID or null)
let editingReviewId = null;

// Edit a review
async function editReview(reviewId) {
  // Get the review data
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/single/${reviewId}`);
    if (!response.ok) throw new Error('Failed to fetch review');
    const review = await response.json();

    // Check if user is authenticated and is the owner or admin
    const currentUser = getUser();
    if (!isAuthenticated() || (!isAdmin() && String(review.userId) !== String(currentUser._id))) {
      alert('You can only edit your own reviews');
      return;
    }

    // Set the editing flag so submitReview routes to updateReview
    editingReviewId = reviewId;

    // Open edit modal (reuse the existing review modal)
    const modal = document.getElementById('reviewModal');
    modal.classList.add('show');

    // Set the current review data
    document.getElementById('currentShopId').value = review.shopId;
    document.getElementById('rating').value = review.rating;
    document.getElementById('comment').value = review.comment;

    // Change the modal title
    const modalTitle = modal.querySelector('h2');
    if (modalTitle) modalTitle.textContent = 'Edit Review';

    // Change the submit button text
    const submitBtn = document.getElementById('reviewForm').querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update Review';

    // Remove any existing cancel buttons first
    const existingCancel = document.getElementById('editCancelBtn');
    if (existingCancel) existingCancel.remove();

    // Add a cancel button to reset the modal
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.id = 'editCancelBtn';
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.style.marginLeft = '10px';
    cancelBtn.onclick = function () {
      editingReviewId = null;
      closeReviewModal();
      // Reset the modal title and submit button text
      if (modalTitle) modalTitle.textContent = 'Write a Review';
      if (submitBtn) submitBtn.textContent = 'Submit Review';
      cancelBtn.remove();
    };
    if (submitBtn && submitBtn.parentNode) {
      submitBtn.parentNode.appendChild(cancelBtn);
    }

  } catch (error) {
    console.error('Error editing review:', error);
    alert('Failed to edit review. Please try again.');
  }
}

// Update a review
async function updateReview(reviewId) {
  const shopId = document.getElementById('currentShopId').value;
  const rating = parseInt(document.getElementById('rating').value);
  const comment = document.getElementById('comment').value.trim();
  const files = document.getElementById('reviewImages').files;

  if (!shopId || !rating || !comment) {
    showError('Please fill in all fields.');
    return;
  }

  try {
    let response;

    if (files && files.length > 0) {
      // Use FormData when there are files to upload
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('comment', comment);
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });
    } else {
      // Use JSON when there are no files (ensures req.body is parsed correctly)
      response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ rating, comment })
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update review');
    }

    // Reset the editing state
    editingReviewId = null;

    // Reset modal title/button
    const modal = document.getElementById('reviewModal');
    const modalTitle = modal.querySelector('h2');
    const submitBtn = document.getElementById('reviewForm').querySelector('button[type="submit"]');
    if (modalTitle) modalTitle.textContent = 'Write a Review';
    if (submitBtn) submitBtn.textContent = 'Submit Review';
    const cancelBtn = document.getElementById('editCancelBtn');
    if (cancelBtn) cancelBtn.remove();

    closeReviewModal();
    showError('✓ Review updated successfully!');

    // Dynamic Update: If no new files were uploaded, update the DOM directly
    if (files.length === 0) {
      const reviewCard = document.getElementById(`review-${reviewId}`);
      if (reviewCard) {
        // Update Comment
        const commentP = reviewCard.querySelector('p[style*="color: #4b5563"]');
        if (commentP) commentP.textContent = comment;

        // Update Rating Stars (find the span with color: #f59e0b)
        const ratingContainer = reviewCard.querySelector('div[style*="align-items: center"] span[style*="color: #f59e0b"]');
        if (ratingContainer) {
          // Re-generate stars string
          let stars = '⭐'.repeat(rating);
          stars += '☆'.repeat(5 - rating);
          ratingContainer.innerHTML = `${rating} <span style="font-size: 1.2rem;">${stars}</span>`;
        }

        // Reset editing state
        editingReviewId = null;

        // Reset modal
        const modal = document.getElementById('reviewModal');
        const modalTitle = modal.querySelector('h2');
        const submitBtn = document.getElementById('reviewForm').querySelector('button[type="submit"]');
        if (modalTitle) modalTitle.textContent = 'Write a Review';
        if (submitBtn) submitBtn.textContent = 'Submit Review';
        const cancelBtn = document.getElementById('editCancelBtn');
        if (cancelBtn) cancelBtn.remove();

        // Clear error/success msg after delay
        setTimeout(clearError, 2000);
        return; // Skip full reload
      }
    }

    // Reload if files changed or element not found
    setTimeout(() => {
      clearError();
      loadAndDisplayReviews(currentShopId);
      loadShops();
    }, 1500);

  } catch (err) {
    console.error('Error updating review:', err);
    showError(err.message || 'Failed to update review. Please try again.');
  }
}

// Delete a review
async function deleteReview(reviewId) {
  openDeleteModal(
    'Delete Review',
    'Are you sure you want to delete this review?',
    async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Failed to delete review');
        }

        const data = await response.json();

        // Refresh the reviews
        loadAndDisplayReviews(currentShopId);

        // Refresh the shop card with updated data
        loadShops();
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review. Please try again.');
      }
    }
  );
}

// Delete a shop photo
async function deleteShopPhoto(shopId, photoIndex) {
  openDeleteModal(
    'Delete Photo',
    'Are you sure you want to delete this photo?',
    async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shops/${shopId}/photos/${photoIndex}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Failed to delete photo');
        }

        // Refresh the photos
        const shopDetails = await fetch(`${API_BASE_URL}/shops/${shopId}`);
        const shop = await shopDetails.json();
        updatePhotoCarousel(shopId, shop.photos, shop.mainPhotoIndex);

        // Refresh the shops list to update the shop card
        loadShops();
      } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Failed to delete photo. Please try again.');
      }
    }
  );
}

// Update photo carousel
function updatePhotoCarousel(shopId, photos, mainPhotoIndex) {
  const carousel = document.getElementById(`photoCarousel-${shopId}`);
  if (!carousel) return;

  carousel.innerHTML = photos.map((photo, index) => `
    <div class="photo-item ${index === mainPhotoIndex ? 'main-photo' : ''}">
      <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption || 'Shop photo')}"
           onerror="this.src='https://via.placeholder.com/150x120?text=Image+Not+Found'">
      ${photo.caption ? `<div class="photo-item-overlay">${escapeHtml(photo.caption)}</div>` : ''}
      <div class="photo-item-actions">
        ${index === mainPhotoIndex ? `
          <span class="main-photo-badge">Main</span>
        ` : isAdmin() ? `
          <button class="set-main-photo-btn" onclick="setMainPhoto('${shopId}', ${index})">
            Set as Main
          </button>
        ` : ''}
        ${isAdmin() ? `
          <button class="delete-photo-btn" onclick="deleteShopPhoto('${shopId}', ${index})">
            🗑️ Delete
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

const originalOnClick = window.onclick;
window.onclick = function (event) {
  const favoritesModal = document.getElementById('favoritesModal');
  if (event.target === favoritesModal) {
    closeFavoritesModal();
  }

  const deleteModal = document.getElementById('deleteModal');
  if (event.target === deleteModal) {
    closeDeleteModal();
  }

  // Call original handler if exists
  if (typeof originalOnClick === 'function') {
    originalOnClick.call(this, event);
  }
};
