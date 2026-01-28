// ============================================
// CONSTANTS
// ============================================
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Setup buttons
  document.getElementById('checkClipboardBtn').addEventListener('click', checkClipboard);
  document.getElementById('manualSearchBtn').addEventListener('click', toggleManualSearch);
  
  // Try to auto-check clipboard on open
  setTimeout(checkClipboard, 300);
});

// ============================================
// CLIPBOARD FUNCTIONS
// ============================================
async function checkClipboard() {
  showLoading();
  clearError();
  hideResults();
  
  try {
    // Read from clipboard
    const text = await navigator.clipboard.readText();
    
    if (!text || text.trim().length === 0) {
      showError('Clipboard is empty. Copy a shop name first!');
      hideLoading();
      return;
    }
    
    const trimmedText = text.trim();
    
    // Show copied text
    const copiedTextBox = document.getElementById('copiedTextBox');
    const copiedTextDiv = document.getElementById('copiedText');
    
    copiedTextDiv.textContent = trimmedText;
    copiedTextBox.classList.add('show');
    
    // Try to search with this text
    await searchShop(trimmedText);
    
  } catch (err) {
    console.error('Clipboard error:', err);
    showError('Cannot access clipboard. Please paste manually.');
    showManualInput();
  } finally {
    hideLoading();
  }
}

function toggleManualSearch() {
  const formGroup = document.getElementById('findShopForm');
  const copiedTextBox = document.getElementById('copiedTextBox');
  
  if (formGroup.classList.contains('show')) {
    // Hide manual input
    formGroup.classList.remove('show');
    document.getElementById('manualSearchBtn').textContent = '🔍 Search Manually';
  } else {
    // Show manual input
    formGroup.classList.add('show');
    copiedTextBox.classList.remove('show');
    document.getElementById('manualSearchBtn').textContent = '✖️ Cancel';
    document.getElementById('shopNameInput').focus();
    
    // Add enter key listener
    document.getElementById('shopNameInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchManualShop();
      }
    });
  }
}

async function searchManualShop() {
  const shopName = document.getElementById('shopNameInput').value.trim();
  
  if (!shopName) {
    showError('Please enter a shop name');
    return;
  }
  
  showLoading();
  clearError();
  hideResults();
  
  await searchShop(shopName);
  hideLoading();
}

// ============================================
// SEARCH FUNCTIONS
// ============================================
async function searchShop(shopName) {
  try {
    // First, try exact match
    let shop = await searchExactShop(shopName);
    
    if (!shop) {
      // Try fuzzy search
      const shops = await searchShopsByName(shopName);
      
      if (shops.length === 0) {
        showNoShopFound(shopName);
        return;
      }
      
      // If multiple found, show the first one
      shop = shops[0];
    }
    
    // Get reviews for this shop
    const reviews = await getShopReviews(shop._id);
    
    // Display results
    displayShopResults(shop, reviews);
    
  } catch (err) {
    console.error('Search error:', err);
    showError('Failed to search. Make sure backend is running on localhost:5000');
  }
}

async function searchExactShop(shopName) {
  try {
    const response = await fetch(`${API_BASE_URL}/shops`);
    if (!response.ok) return null;
    
    const shops = await response.json();
    
    // Case-insensitive exact match
    return shops.find(shop => 
      shop.name.toLowerCase() === shopName.toLowerCase()
    );
  } catch (err) {
    return null;
  }
}

async function searchShopsByName(shopName) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/shops/search?name=${encodeURIComponent(shopName)}`
    );
    
    if (!response.ok) return [];
    
    return await response.json();
  } catch (err) {
    return [];
  }
}

async function getShopReviews(shopId) {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${shopId}`);
    if (!response.ok) return [];
    
    return await response.json();
  } catch (err) {
    return [];
  }
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================
function displayShopResults(shop, reviews) {
  const resultSection = document.getElementById('resultSection');
  
  const stars = '⭐'.repeat(Math.round(shop.averageRating));
  
  let reviewsHTML = '';
  if (reviews.length > 0) {
    reviewsHTML = `
      <div class="reviews-section">
        <h3 style="margin-bottom: 15px; color: #374151;">Latest Reviews:</h3>
        ${reviews.slice(0, 3).map(review => `
          <div class="review-item">
            <div class="review-header">
              <span class="review-author">${escapeHtml(review.reviewer)}</span>
              <span class="review-date">${formatDate(review.date)}</span>
            </div>
            <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
            <p class="review-comment">${escapeHtml(review.comment)}</p>
          </div>
        `).join('')}
        ${reviews.length > 3 ? `<p style="text-align: center; color: #6b7280; margin-top: 10px;">+ ${reviews.length - 3} more reviews</p>` : ''}
      </div>
    `;
  } else {
    reviewsHTML = `
      <div class="reviews-section">
        <p style="color: #9ca3af; text-align: center; padding: 20px;">
          No reviews yet. Be the first to review!
        </p>
      </div>
    `;
  }
  
  const html = `
    <div class="shop-result">
      <h3>${escapeHtml(shop.name)}</h3>
      <p><strong>Category:</strong> ${escapeHtml(shop.category)}</p>
      <p><strong>Location:</strong> ${escapeHtml(shop.location)}</p>
      <p><strong>Rating:</strong> <span class="rating-badge">${shop.averageRating.toFixed(1)} ${stars}</span></p>
      <p><strong>Total Reviews:</strong> ${shop.reviewCount}</p>
    </div>
    ${reviewsHTML}
  `;
  
  resultSection.innerHTML = html;
  resultSection.classList.add('show');
}

function showNoShopFound(shopName) {
  const resultSection = document.getElementById('resultSection');
  
  const html = `
    <div class="no-shop-found">
      <h3>Shop Not Found</h3>
      <p>"${escapeHtml(shopName)}" was not found in our database.</p>
      <p style="margin-top: 10px; font-size: 0.9em;">Try checking the spelling or add this shop to our database!</p>
    </div>
  `;
  
  resultSection.innerHTML = html;
  resultSection.classList.add('show');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showLoading() {
  document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showError(message) {
  const errorDiv = document.getElementById('errorMsg');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function clearError() {
  const errorDiv = document.getElementById('errorMsg');
  errorDiv.textContent = '';
  errorDiv.style.display = 'none';
}

function hideResults() {
  document.getElementById('resultSection').classList.remove('show');
}

function showManualInput() {
  document.getElementById('findShopForm').classList.add('show');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined
  });
}