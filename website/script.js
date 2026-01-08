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
  setupAddShopButton();
});

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
    shopsList.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h2>No shops found</h2><p>Try another search or reset.</p></div>`;
    return;
  }
  shops.forEach(shop => shopsList.appendChild(createShopCard(shop)));
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
      <button class="btn btn-details" onclick="showShopDetails('${shop._id}')">👁️ Details</button>
      <button class="btn btn-review" onclick="openReviewModal('${shop._id}', '${escapeHtml(shop.name)}')">✍️ Review</button>
    </div>
  `;
  return card;
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '⭐'.repeat(fullStars);
  if (hasHalfStar && fullStars < 5) stars += '✨';
  return stars;
}

// ============================================
// SHOP DETAILS MODAL
// ============================================
async function showShopDetails(shopId) {
  try {
    const shopResp = await fetch(`${API_BASE_URL}/shops/${shopId}`);
    if (!shopResp.ok) throw new Error('Failed to fetch shop details');
    const shop = await shopResp.json();

    const reviewsResp = await fetch(`${API_BASE_URL}/reviews/${shopId}`);
    const reviews = reviewsResp.ok ? await reviewsResp.json() : [];

    const detailsDiv = document.getElementById('shopDetails');
    const stars = generateStars(shop.averageRating);
    let reviewsHTML = reviews.length ? `
      <div class="reviews-container">
        <h3 style="margin-top:25px;margin-bottom:15px;">Reviews</h3>
        ${reviews.map(r => `
          <div class="review-item">
            <div class="review-header">
              <span class="review-author">${escapeHtml(r.reviewer)}</span>
              <span class="review-date">${formatDate(r.date)}</span>
            </div>
            <div class="review-rating">${'⭐'.repeat(r.rating)} (${r.rating}/5)</div>
            <p class="review-comment">${escapeHtml(r.comment)}</p>
          </div>
        `).join('')}
      </div>
    ` : `<p style="color:#999;margin-top:20px;">No reviews yet. Be the first!</p>`;

    detailsDiv.innerHTML = `
      <div>
        <h2 style="color:#667eea;margin-bottom:20px;">${escapeHtml(shop.name)}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <div>
            <p><strong>Category:</strong> ${escapeHtml(shop.category)}</p>
            <p><strong>Location:</strong> ${escapeHtml(shop.location)}</p>
          </div>
          <div>
            <p><strong>Average Rating:</strong> <span style="font-size:1.3em;color:#f59e0b;">${shop.averageRating.toFixed(1)} ${stars}</span></p>
            <p><strong>Total Reviews:</strong> ${shop.reviewCount}</p>
          </div>
        </div>
        ${reviewsHTML}
      </div>
    `;
    document.getElementById('detailsModal').classList.add('show');
  } catch (err) {
    console.error(err);
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
    showError('Please fill all fields.');
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, reviewer, rating, comment })
    });
    if (!resp.ok) throw new Error('Failed to submit review');
    closeReviewModal();
    showError('✓ Review submitted!');
    setTimeout(() => {
      clearError();
      loadShops();
    }, 1500);
  } catch (err) {
    console.error(err);
    showError('Failed to submit review.');
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
    if (!resp.ok) throw new Error(data.message || 'Failed to add shop');
    msg.textContent = '✓ Shop added!';
    msg.style.color = 'green';
    closeAddShopModal();
    loadShops();
  } catch (err) {
    console.error(err);
    msg.textContent = 'Cannot connect to server';
    msg.style.color = 'red';
  }
}

// ============================================
// UTILITY
// ============================================
function showLoading() { document.getElementById('loading').style.display = 'block'; }
function hideLoading() { document.getElementById('loading').style.display = 'none'; }
function showError(msg) { const e = document.getElementById('errorMsg'); e.textContent = msg; e.classList.add('show'); }
function clearError() { const e = document.getElementById('errorMsg'); e.textContent = ''; e.classList.remove('show'); }
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function formatDate(dateString) {
  const date = new Date(dateString), today = new Date(), yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate()-1);
  if(date.toDateString()===today.toDateString()) return 'Today';
  if(date.toDateString()===yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});
}

// ============================================
// MODAL OUTSIDE CLICK
// ============================================
window.onclick = function(event) {
  const reviewModal = document.getElementById('reviewModal');
  const detailsModal = document.getElementById('detailsModal');
  const addShopModal = document.getElementById('addShopModal');

  if(event.target === reviewModal) closeReviewModal();
  if(event.target === detailsModal) closeDetailsModal();
  if(event.target === addShopModal) closeAddShopModal();
};
