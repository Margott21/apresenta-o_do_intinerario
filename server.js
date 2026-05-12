const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const users = [
  {
    id: 1,
    name: 'Cliente Teste',
    email: 'cliente@teste.com',
    password: '123456'
  }
];

const products = [
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

const sessions = new Map();

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  req.user = sessions.get(token);
  next();
}

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  const user = users.find(item => item.email === email && item.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
  }

  const token = createToken();
  sessions.set(token, { id: user.id, name: user.name, email: user.email });
  res.json({ token });
});

app.get('/api/user', authenticate, (req, res) => {
  res.json(req.user);
});

app.post('/api/checkout', authenticate, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'O carrinho precisa conter pelo menos um item.' });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: crypto.randomBytes(8).toString('hex'),
    user: req.user,
    items,
    total,
    createdAt: new Date().toISOString()
  };

  console.log('Novo pedido:', order);
  res.json({ message: 'Compra concluída com sucesso.', orderId: order.id });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
