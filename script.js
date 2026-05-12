const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Tênis de Corrida Nitro',
    description: 'Leve, estável e ideal para longas distâncias.',
    price: 429.9,
    image: 'https://images.unsplash.com/photo-1600185366507-6e2a903cb7d3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    name: 'Tênis Lifestyle Aero',
    description: 'Visual moderno para usar no dia a dia.',
    price: 359.9,
    image: 'https://images.unsplash.com/photo-1519741496621-6f1f6ddf2e7e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    name: 'Tênis Trail Adventure',
    description: 'Pronto para trilhas e terrenos irregulares.',
    price: 499.9,
    image: 'https://images.unsplash.com/photo-1515548219093-8c9808c9b2f8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    name: 'Tênis Casual Street',
    description: 'Conforto urbano com amortecimento extra.',
    price: 319.9,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
  }
];

const apiUrl = window.location.origin;
const productsGrid = document.getElementById('productsGrid');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartPanel = document.getElementById('cartPanel');
const cartBackdrop = document.getElementById('cartBackdrop');
const openCart = document.getElementById('openCart');
const closeCart = document.getElementById('closeCart');
const checkoutButton = document.getElementById('checkoutButton');
const authButton = document.getElementById('authButton');
const userBadge = document.getElementById('userBadge');
const userName = document.getElementById('userName');
const logoutButton = document.getElementById('logoutButton');
const loginModal = document.getElementById('loginModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const emailField = document.getElementById('email');
const passwordField = document.getElementById('password');

let cart = [];
let user = null;
let authToken = localStorage.getItem('authToken');

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function showAlert(message) {
  const intervalId = setTimeout(() => {
    alert(message);
    clearTimeout(intervalId);
  }, 10);
}

function setUserState(userData) {
  user = userData;
  if (user) {
    userBadge.classList.remove('hidden');
    authButton.classList.add('hidden');
    userName.textContent = user.name;
  } else {
    userBadge.classList.add('hidden');
    authButton.classList.remove('hidden');
    userName.textContent = 'Usuário';
  }
}

function openModal() {
  loginModal.classList.add('visible');
  modalBackdrop.classList.add('visible');
  loginModal.classList.remove('hidden');
  modalBackdrop.classList.remove('hidden');
}

function closeModal() {
  loginModal.classList.remove('visible');
  modalBackdrop.classList.remove('visible');
  setTimeout(() => {
    loginModal.classList.add('hidden');
    modalBackdrop.classList.add('hidden');
  }, 250);
}

async function fetchProducts() {
  try {
    const response = await fetch(`${apiUrl}/api/products`);
    if (!response.ok) throw new Error('Falha ao carregar produtos');
    return await response.json();
  } catch (error) {
    console.warn('Usando produtos locais devido ao erro:', error.message);
    return DEFAULT_PRODUCTS;
  }
}

function renderProducts(products) {
  productsGrid.innerHTML = products.map(product => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-details">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <span class="price">${formatPrice(product.price)}</span>
        <button class="add-button" data-id="${product.id}">Adicionar ao carrinho</button>
      </div>
    </article>
  `).join('');
}

function updateCartCount() {
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = quantity;
}

function updateCartTotal() {
  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  cartTotal.textContent = formatPrice(total);
}

function toggleCart(open = true) {
  cartPanel.classList.toggle('open', open);
  cartBackdrop.classList.toggle('visible', open);
  cartPanel.setAttribute('aria-hidden', String(!open));
}

function addToCart(productId) {
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    const product = currentProducts.find(item => item.id === productId);
    if (!product) return;
    cart.push({ ...product, quantity: 1 });
  }
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  renderCart();
}

function changeQuantity(productId, delta) {
  cart = cart.map(item => {
    if (item.id === productId) {
      return { ...item, quantity: Math.max(1, item.quantity + delta) };
    }
    return item;
  });
  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Seu carrinho está vazio. Adicione alguns tênis incríveis!</p>';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <span>${formatPrice(item.price)} x ${item.quantity}</span>
        </div>
        <div class="quantity-controls">
          <button data-action="increase" data-id="${item.id}">+</button>
          <button data-action="decrease" data-id="${item.id}">-</button>
          <button data-action="remove" data-id="${item.id}">✕</button>
        </div>
      </div>
    `).join('');
  }

  updateCartCount();
  updateCartTotal();
}

async function login(email, password) {
  try {
    const response = await fetch(`${apiUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha no login');
    }

    const data = await response.json();
    authToken = data.token;
    localStorage.setItem('authToken', authToken);
    await loadUser();
    showAlert('Login realizado com sucesso!');
    closeModal();
  } catch (error) {
    showAlert(error.message);
  }
}

async function loadUser() {
  if (!authToken) return setUserState(null);

  try {
    const response = await fetch(`${apiUrl}/api/user`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!response.ok) throw new Error('Sessão inválida');
    const data = await response.json();
    setUserState(data);
  } catch {
    authToken = null;
    localStorage.removeItem('authToken');
    setUserState(null);
  }
}

async function checkout() {
  if (cart.length === 0) {
    showAlert('Adicione itens ao carrinho antes de finalizar a compra.');
    return;
  }

  if (!user) {
    openModal();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ items: cart })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha na finalização');
    }

    await response.json();
    cart = [];
    renderCart();
    toggleCart(false);
    showAlert('Compra concluída com sucesso! Obrigado por comprar na SportSneakers.');
  } catch (error) {
    showAlert(error.message);
  }
}

function handleProductClick(event) {
  const button = event.target.closest('.add-button');
  if (!button) return;
  const productId = Number(button.dataset.id);
  addToCart(productId);
}

function handleCartAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const productId = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === 'increase') changeQuantity(productId, 1);
  if (action === 'decrease') changeQuantity(productId, -1);
  if (action === 'remove') removeFromCart(productId);
}

async function initEvents() {
  productsGrid.addEventListener('click', handleProductClick);
  openCart.addEventListener('click', () => toggleCart(true));
  closeCart.addEventListener('click', () => toggleCart(false));
  cartBackdrop.addEventListener('click', () => toggleCart(false));
  cartItems.addEventListener('click', handleCartAction);
  checkoutButton.addEventListener('click', checkout);
  authButton.addEventListener('click', openModal);
  logoutButton.addEventListener('click', () => {
    authToken = null;
    localStorage.removeItem('authToken');
    setUserState(null);
  });
  modalBackdrop.addEventListener('click', closeModal);
  closeLogin.addEventListener('click', closeModal);
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    await login(emailField.value.trim(), passwordField.value.trim());
  });
}

let currentProducts = DEFAULT_PRODUCTS;

async function init() {
  await loadUser();
  currentProducts = await fetchProducts();
  renderProducts(currentProducts);
  renderCart();
  initEvents();
}

init();
