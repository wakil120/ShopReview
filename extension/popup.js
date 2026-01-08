// ============================================
// CONSTANTS
// ============================================
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  // Setup form submission
  document.getElementById('compareForm').addEventListener('submit', handleCompare);
  
  // Setup clear button
  document.querySelector('.btn-clear').addEventListener('click', clearForm);
});

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Handle the compare shops request
 */
async function handleCompare(event) {
  event.preventDefault();

  const shop1Name = document.getElementById('shop1').value.trim();
  const shop2Name = document.getElementById('shop2').value.trim();

  if (!shop1Name || !shop2Name) {
    showError('Please enter both shop names');
    return;
  }
  if (shop1Name.toLowerCase() === shop2Name.toLowerCase()) {
    showError('Please select two different shops');
    return;
  }

  clearError();
  showLoading();

  try {
    // ✅ FULL ABSOLUTE URL WITH CORRECT PORT 5000
    const response = await fetch(
      `http://localhost:5000/api/shops/compare-by-name?shop1=${encodeURIComponent(shop1Name)}&shop2=${encodeURIComponent(shop2Name)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('One or both shops not found. Check spelling!');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    displayComparison(data);

  } catch (error) {
    showError(error.message || 'Failed to connect to backend. Is it running on port 5000?');
    console.error('Fetch error:', error);
  } finally {
    hideLoading();
  }
}

/**
 * Display comparison results
 */
function displayComparison(data) {
  const { shop1, shop2, comparison } = data;

  // Show result section
  document.getElementById('resultSection').style.display = 'block';

  // Display Shop 1
  displayShop(shop1, 'shop1Result');

  // Display Shop 2
  displayShop(shop2, 'shop2Result');

  // Display Comparison Stats
  displayComparisonStats(comparison);

  // Display Quick Summary
  displayComparisonSummary(shop1, shop2, comparison);
}

/**
 * Display individual shop details
 */
function displayShop(shop, elementId) {
  const rating = shop.averageRating.toFixed(1);
  const stars = generateStars(shop.averageRating);

  const html = `
    <h3>${escapeHtml(shop.name)}</h3>
    <p><strong>Category:</strong> ${escapeHtml(shop.category)}</p>
    <p><strong>Location:</strong> ${escapeHtml(shop.location)}</p>
    <p>
      <strong>Rating:</strong> 
      <span class="rating-badge">${rating} ${stars}</span>
    </p>
    <p><strong>Total Reviews:</strong> ${shop.reviewCount}</p>
  `;

  document.getElementById(elementId).innerHTML = html;
}

/**
 * Display comparison statistics
 */
function displayComparisonStats(comparison) {
  const { ratingDifference, higherRated, moreReviews } = comparison;

  const html = `
    <h4>📊 Comparison Summary</h4>
    <p><strong>Rating Difference:</strong> ${ratingDifference.toFixed(2)} points</p>
    <p><strong>Higher Rated:</strong> ${escapeHtml(higherRated)}</p>
    <p><strong>More Reviews:</strong> ${escapeHtml(moreReviews)}</p>
  `;

  document.getElementById('statsResult').innerHTML = html;
}

/**
 * Display quick comparison summary
 */
function displayComparisonSummary(shop1, shop2, comparison) {
  const ratingDiff = Math.abs(shop1.averageRating - shop2.averageRating).toFixed(2);
  const winner = shop1.averageRating > shop2.averageRating ? shop1.name : shop2.name;

  let message = `🏆 <strong>${escapeHtml(winner)}</strong> has a higher rating`;
  if (ratingDiff == 0) {
    message = `🤝 Both shops have the same rating`;
  }

  const html = `
    <p>${message}</p>
  `;

  document.getElementById('comparisonResult').innerHTML = html;
  document.getElementById('comparisonResult').style.display = 'block';
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
 * Clear the form
 */
function clearForm() {
  document.getElementById('compareForm').reset();
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('comparisonResult').style.display = 'none';
  clearError();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('errorMsg');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

/**
 * Clear error message
 */
function clearError() {
  const errorDiv = document.getElementById('errorMsg');
  errorDiv.textContent = '';
  errorDiv.style.display = 'none';
}

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
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}