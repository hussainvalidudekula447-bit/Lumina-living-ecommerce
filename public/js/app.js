// ==========================================================================
// Lumina Living — Atelier Frontend Application Logic
// ==========================================================================

const API_BASE = '/api';

let products = [];
let filteredList = [];
let activeCat = 'all';
let searchKeyword = '';
let activeSort = 'featured';
let cart = [];
let promo = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadCartStorage();
  fetchLuminaProducts();
  bindEvents();
});

function bindEvents() {
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    searchKeyword = e.target.value.trim();
    filterAndRender();
  });

  const sortSelect = document.getElementById('sort-select');
  sortSelect.addEventListener('change', (e) => {
    activeSort = e.target.value;
    filterAndRender();
  });

  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCat = tab.dataset.category;
      filterAndRender();
    });
  });

  // Close modals when clicking background
  ['product-modal-layer', 'checkout-modal-layer', 'receipt-modal-layer', 'orders-modal-layer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) el.classList.remove('active');
      });
    }
  });
}

// Fetch products from Python backend
async function fetchLuminaProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    if (data.success) {
      products = data.data;
      filterAndRender();
    }
  } catch (e) {
    console.error('Error loading products:', e);
    showToast('Connecting to backend...');
  }
}

function filterAndRender() {
  let list = [...products];

  if (activeCat !== 'all') {
    list = list.filter(p => p.category.toLowerCase() === activeCat.toLowerCase());
  }

  if (searchKeyword) {
    const q = searchKeyword.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  if (activeSort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (activeSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (activeSort === 'rating') list.sort((a, b) => b.rating - a.rating);
  else if (activeSort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));

  filteredList = list;
  renderCatalog(list);
}

function renderCatalog(items) {
  const grid = document.getElementById('catalog-grid');
  const empty = document.getElementById('empty-state');
  const countText = document.getElementById('results-count-text');
  const clearBtn = document.getElementById('clear-filters-btn');

  if (!items || items.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  empty.style.display = 'none';

  clearBtn.style.display = (activeCat !== 'all' || searchKeyword) ? 'inline-block' : 'none';
  countText.textContent = `Displaying ${items.length} curated pieces`;

  grid.innerHTML = items.map(p => `
    <div class="product-card">
      <div class="card-img-wrap" onclick="openProductModal('${p.id}')">
        <img src="${p.image}" alt="${p.name}" class="card-img" />
        ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
      </div>
      <div class="card-body">
        <span class="card-cat">${p.category}</span>
        <h3 class="card-title" onclick="openProductModal('${p.id}')">${p.name}</h3>
        <div class="card-rating">★ ${p.rating.toFixed(1)} (${p.reviewsCount} atelier reviews)</div>
        <div class="card-foot">
          <span class="card-price">$${p.price.toFixed(2)}</span>
          <button class="card-add" onclick="addToCart('${p.id}')" title="Add to Bag">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterByCategory(cat) {
  activeCat = cat;
  document.querySelectorAll('.filter-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.category === cat);
  });
  filterAndRender();
  const c = document.getElementById('collection');
  if (c) c.scrollIntoView({ behavior: 'smooth' });
}

function resetAllFilters() {
  activeCat = 'all';
  searchKeyword = '';
  document.getElementById('search-input').value = '';
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t.dataset.category === 'all'));
  filterAndRender();
}

// Product Modal
function openProductModal(id) {
  const p = products.find(i => i.id === id);
  if (!p) return;

  const content = document.getElementById('product-modal-content');
  const specs = p.specs ? Object.entries(p.specs).map(([k, v]) => `<div class="spec-row"><span>${k}:</span><strong>${v}</strong></div>`).join('') : '';

  content.innerHTML = `
    <div class="product-modal-layout">
      <div>
        <img src="${p.image}" alt="${p.name}" class="product-modal-img" />
      </div>
      <div>
        <span class="card-cat">${p.category}</span>
        <h2 style="font-size: 2rem; margin: 4px 0 10px;">${p.name}</h2>
        <div style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 700; color: #a37f51; margin-bottom: 12px;">$${p.price.toFixed(2)}</div>
        <p style="font-size: 0.92rem; color: #6b645c; line-height: 1.6; margin-bottom: 16px;">${p.description}</p>
        
        ${specs ? `<div class="spec-box-clean">${specs}</div>` : ''}

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button class="btn btn-warm" style="flex: 1;" onclick="addToCart('${p.id}', 1); closeProductModal(); openCartDrawer();">
            Add to Shopping Bag
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('product-modal-layer').classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal-layer').classList.remove('active');
}

// Cart Logic
function loadCartStorage() {
  try {
    const saved = localStorage.getItem('lumina_cart');
    if (saved) cart = JSON.parse(saved);
  } catch (e) { cart = []; }
  updateCartView();
}

function saveCartStorage() {
  localStorage.setItem('lumina_cart', JSON.stringify(cart));
  updateCartView();
}

function addToCart(productId, qty = 1) {
  const p = products.find(i => i.id === productId);
  if (!p) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, quantity: qty });
  }

  saveCartStorage();
  showToast(`Added "${p.name}" to bag`);
}

function updateCartQty(id, newQty) {
  if (newQty <= 0) {
    cart = cart.filter(i => i.id !== id);
  } else {
    const item = cart.find(i => i.id === id);
    if (item) item.quantity = newQty;
  }
  saveCartStorage();
}

function updateCartView() {
  const totalCount = cart.reduce((s, i) => s + i.quantity, 0);
  document.getElementById('cart-badge-count').textContent = totalCount;
  document.getElementById('cart-drawer-count').textContent = `(${totalCount})`;

  const list = document.getElementById('cart-items-container');
  if (cart.length === 0) {
    list.innerHTML = `<p style="text-align: center; padding: 40px 0; color: #8c847a;">Your shopping bag is empty.</p>`;
    document.getElementById('checkout-cta-btn').disabled = true;
  } else {
    document.getElementById('checkout-cta-btn').disabled = false;
    list.innerHTML = cart.map(i => `
      <div class="drawer-item">
        <img src="${i.image}" alt="${i.name}" />
        <div>
          <h5 style="font-size: 0.95rem;">${i.name}</h5>
          <span style="font-size: 0.82rem; color: #8c847a;">$${i.price.toFixed(2)} × ${i.quantity}</span>
        </div>
        <div style="display: flex; gap: 4px;">
          <button style="border: 1px solid #ddd; background: #fff; width: 24px; height: 24px;" onclick="updateCartQty('${i.id}', ${i.quantity - 1})">-</button>
          <button style="border: 1px solid #ddd; background: #fff; width: 24px; height: 24px;" onclick="updateCartQty('${i.id}', ${i.quantity + 1})">+</button>
        </div>
      </div>
    `).join('');
  }

  calcTotals();
}

function calcTotals() {
  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  let discount = 0;
  if (promo) discount = (subtotal * promo.discountPercent) / 100;
  const discSub = subtotal - discount;
  const tax = discSub * 0.08;
  const ship = subtotal === 0 ? 0 : (discSub >= 150 ? 0 : 14.99);
  const grand = subtotal === 0 ? 0 : (discSub + tax + ship);

  document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  if (promo && discount > 0) {
    document.getElementById('discount-line').style.display = 'flex';
    document.getElementById('cart-discount').textContent = `-$${discount.toFixed(2)}`;
  } else {
    document.getElementById('discount-line').style.display = 'none';
  }
  document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('cart-shipping').textContent = ship === 0 ? 'COMPLIMENTARY' : `$${ship.toFixed(2)}`;
  document.getElementById('cart-grand-total').textContent = `$${grand.toFixed(2)}`;

  return { subtotal, discount, tax, shipping: ship, grandTotal: grand };
}

async function applyPromoCode() {
  const code = document.getElementById('promo-input').value.trim().toUpperCase();
  if (!code) return;
  try {
    const res = await fetch(`${API_BASE}/promo/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (data.success) {
      promo = data;
      document.getElementById('promo-badge-box').style.display = 'block';
      document.getElementById('promo-code-name').textContent = `${data.code} (${data.discountPercent}% Privileged Savings)`;
      calcTotals();
      showToast(`Privilege Code ${data.code} applied!`);
    } else {
      showToast(data.message || 'Invalid code');
    }
  } catch (e) {
    showToast('Failed to apply code');
  }
}

function removePromoCode() {
  promo = null;
  document.getElementById('promo-badge-box').style.display = 'none';
  calcTotals();
}

function applyPromoQuick(code) {
  document.getElementById('promo-input').value = code;
  openCartDrawer();
  applyPromoCode();
}

function openCartDrawer() {
  document.getElementById('cart-drawer').classList.add('active');
  document.getElementById('cart-overlay').classList.add('active');
}

function closeCartDrawer() {
  document.getElementById('cart-drawer').classList.remove('active');
  document.getElementById('cart-overlay').classList.remove('active');
}

// Checkout & Order Submission
function openCheckoutModal() {
  if (cart.length === 0) return;
  closeCartDrawer();
  const totals = calcTotals();

  document.getElementById('checkout-items-preview').innerHTML = cart.map(i => `
    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
      <span>${i.name} (x${i.quantity})</span>
      <strong>$${(i.price * i.quantity).toFixed(2)}</strong>
    </div>
  `).join('');

  document.getElementById('checkout-totals-preview').innerHTML = `
    <div style="border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; font-weight: 700; display: flex; justify-content: space-between;">
      <span>Grand Total</span>
      <span>$${totals.grandTotal.toFixed(2)}</span>
    </div>
  `;

  document.getElementById('checkout-amount-display').textContent = `$${totals.grandTotal.toFixed(2)}`;
  document.getElementById('checkout-modal-layer').classList.add('active');
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal-layer').classList.remove('active');
}

async function submitLuminaOrder(e) {
  e.preventDefault();
  const name = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  const address = document.getElementById('c-address').value.trim();
  const city = document.getElementById('c-city').value.trim();
  const state = document.getElementById('c-state').value.trim();
  const zip = document.getElementById('c-zip').value.trim();

  const payload = {
    customer: { fullName: name, email, phone, address, city, state, zip },
    items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
    promoCode: promo ? promo.code : null
  };

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      cart = [];
      promo = null;
      saveCartStorage();
      closeCheckoutModal();
      showInvoiceReceipt(data.data);
      fetchLuminaProducts();
    } else {
      showToast(data.message || 'Error creating order');
    }
  } catch (err) {
    showToast('Network error during checkout');
  }
}

function showInvoiceReceipt(order) {
  document.getElementById('invoice-order-id').textContent = order.id;
  document.getElementById('invoice-order-date').textContent = new Date(order.createdAt).toLocaleDateString();
  document.getElementById('inv-cust-name').textContent = order.customer.fullName;
  document.getElementById('inv-cust-email').textContent = order.customer.email;
  document.getElementById('inv-cust-addr').textContent = `${order.customer.address}, ${order.customer.city} ${order.customer.zip}`;

  document.getElementById('invoice-items-tbody').innerHTML = order.items.map(i => `
    <tr>
      <td>${i.name}</td>
      <td>${i.quantity}</td>
      <td>$${i.price.toFixed(2)}</td>
      <td class="text-right"><strong>$${(i.price * i.quantity).toFixed(2)}</strong></td>
    </tr>
  `).join('');

  document.getElementById('invoice-totals-box').innerHTML = `
    <div style="display: flex; justify-content: flex-end; gap: 20px; font-size: 0.9rem; padding-top: 10px;">
      <span>Total Paid:</span>
      <strong style="font-family: 'Cormorant Garamond', serif; font-size: 1.25rem;">$${order.total.toFixed(2)}</strong>
    </div>
  `;

  document.getElementById('receipt-modal-layer').classList.add('active');
}

function closeReceiptModal() {
  document.getElementById('receipt-modal-layer').classList.remove('active');
}

// Order Tracking Modal
async function openOrdersModal() {
  document.getElementById('orders-modal-layer').classList.add('active');
  try {
    const res = await fetch(`${API_BASE}/orders`);
    const data = await res.json();
    const tbody = document.getElementById('orders-history-tbody');
    if (data.success && data.data.length > 0) {
      tbody.innerHTML = data.data.map(o => `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
          <td>${o.customer.fullName}</td>
          <td>$${o.total.toFixed(2)}</td>
          <td><span style="color: #5f7457; font-weight: 600;">${o.status || 'Confirmed'}</span></td>
          <td><button class="btn-warm-sm" onclick="trackLuminaOrderById('${o.id}')">Track</button></td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">No orders recorded yet.</td></tr>`;
    }
  } catch (e) {
    console.error(e);
  }
}

function closeOrdersModal() {
  document.getElementById('orders-modal-layer').classList.remove('active');
}

async function trackLuminaOrder() {
  const id = document.getElementById('track-id-input').value.trim();
  if (id) trackLuminaOrderById(id);
}

async function trackLuminaOrderById(orderId) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`);
    const data = await res.json();
    const box = document.getElementById('tracking-result-box');
    if (data.success) {
      const o = data.data;
      box.style.display = 'block';
      box.innerHTML = `
        <div style="background: #f4eee3; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
          <h4 style="font-size: 1.2rem; margin-bottom: 4px;">Status for Order ${o.id}</h4>
          <p style="font-size: 0.85rem; color: #5f7457; font-weight: 600;">Current Phase: ${o.status || 'In Artisan Workshop Preparation'}</p>
          <p style="font-size: 0.82rem; color: #8c847a; margin-top: 4px;">Destination: ${o.customer.fullName}, ${o.customer.city}</p>
        </div>
      `;
    } else {
      showToast('Order reference not found');
    }
  } catch (e) {
    showToast('Lookup failed');
  }
}

function showToast(msg) {
  const box = document.getElementById('toast-box');
  const div = document.createElement('div');
  div.className = 'toast-msg';
  div.textContent = msg;
  box.appendChild(div);
  setTimeout(() => div.remove(), 3200);
}
