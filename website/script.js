// ============================================
// CONSTANTS
// ============================================
const API_BASE_URL = 'http://localhost:5000/api';

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
  loadShops();
  setupEventListeners();
  setupAddShopButton();
  loadFilters(); 
});

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
    addShopBtn.addEventListener('click', openAddShopModal);
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
// SHOP DETAILS MODAL
// ============================================
async function showShopDetails(shopId) {
  try {
    // Fetch shop details
    const shopResp = await fetch(`${API_BASE_URL}/shops/${shopId}`);
    if (!shopResp.ok) throw new Error('Failed to fetch shop details');
    
    const shop = await shopResp.json();

    // Fetch reviews
    const reviewsResp = await fetch(`${API_BASE_URL}/reviews/${shopId}`);
    const reviews = reviewsResp.ok ? await reviewsResp.json() : [];

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
  } catch (err) {
    console.error('Error fetching shop details:', err);
    showError('Failed to load shop details.');
  }
}

function closeDetailsModal() {
  document.getElementById('detailsModal').classList.remove('show');
}

// ============================================
// REVIEW MODAL
// ============================================
function openReviewModal(shopId, shopName) {
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

async function submitReview(e) {
  e.preventDefault();

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

async function submitAddShop(e) {
  e.preventDefault();
  
  const name = document.getElementById('newShopName').value.trim();
  const category = document.getElementById('newShopCategory').value.trim();
  const location = document.getElementById('newShopLocation').value.trim();
  const msg = document.getElementById('addShopMsg');

  if (!name || !category || !location) {
    msg.textContent = 'Please fill all fields.';
    msg.style.color = 'red';
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, location })
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
// Filtering Categories & Locations (FIXED)
// ============================================

// 🔹 Global filter state (IMPORTANT)
let selectedCategory = "";
let selectedLocation = "";

// ============================================
// Fetch categories & locations
// ============================================
async function loadFilters() {
  try {
    const resp = await fetch(`${API_BASE_URL}/shops`);
    const shops = await resp.json();

    const categories = [
      ...new Set(
        shops.map(s => s.category.trim().toLowerCase())
      )
    ];

    const locations = [
      ...new Set(
        shops.map(s => s.location.trim().toLowerCase())
      )
    ];


    renderFilters('categoryFilters', categories, filterByCategory);
    renderFilters('locationFilters', locations, filterByLocation);
  } catch (err) {
    console.error('Failed to load filters', err);
  }
}

// ============================================
// Render filter buttons
// ============================================
function renderFilters(containerId, items, handler) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // 🔹 ALL button
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = 'filter-btn active';

  allBtn.onclick = () => {
    setActiveFilter(container, allBtn);

    if (containerId === 'categoryFilters') {
      selectedCategory = "";
    }

    if (containerId === 'locationFilters') {
      selectedLocation = "";
    }

    fetchFilteredShops();
  };

  container.appendChild(allBtn);

  // 🔹 Dynamic buttons
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.textContent = item.charAt(0).toUpperCase() + item.slice(1);
    btn.className = 'filter-btn';

    btn.onclick = () => {
      setActiveFilter(container, btn);
      handler(item);
    };

    container.appendChild(btn);
  });
}

// ============================================
// Filter handlers
// ============================================
function filterByCategory(category) {
  selectedCategory = category;
  fetchFilteredShops();  // ← Calls with both filters
}

function filterByLocation(location) {
  selectedLocation = location;
  fetchFilteredShops();  // ← Calls with both filters
}

// ============================================
// Fetch shops using COMBINED filters (Category + Location)
// ============================================
async function fetchFilteredShops() {
  showLoading();
  clearError();

  let url = `${API_BASE_URL}/shops`;

  // Build query string only if filters are active
  const params = new URLSearchParams();

  if (selectedCategory) {
    params.append('category', selectedCategory);
  }

  if (selectedLocation) {
    params.append('location', selectedLocation);
  }

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
// Active button UI helper
// ============================================
function setActiveFilter(container, activeBtn) {
  [...container.children].forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}


async function filterByLocation(location) {
  showLoading();
  try {
    const resp = await fetch(`${API_BASE_URL}/shops?location=${encodeURIComponent(location)}`);
    const shops = await resp.json();
    displayShops(shops);
  } catch {
    showError('Failed to filter by location');
  } finally {
    hideLoading();
  }
}

//Active button UI helper
function setActiveFilter(container, activeBtn) {
  [...container.children].forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

