// Advanced Express server application with additional features
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Database simulation
const database = {
  users: [
    { id: 1, name: 'Alice Smith', email: 'alice@example.com', role: 'admin' },
    { id: 2, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'user' }
  ],
  products: [
    { id: 101, name: 'Laptop', price: 1299.99, stock: 35 },
    { id: 102, name: 'Smartphone', price: 899.99, stock: 50 },
    { id: 103, name: 'Headphones', price: 199.99, stock: 100 },
    { id: 104, name: 'Monitor', price: 349.99, stock: 22 }
  ]
};

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a write stream for logs
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('combined', { stream: accessLogStream }));
app.use(express.static(path.join(__dirname, 'public')));

// Custom middleware for auth simulation
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === 'secret-api-key-1234') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Public endpoints
apiRouter.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Protected routes with auth middleware
apiRouter.use('/users', authMiddleware);
apiRouter.use('/products', authMiddleware);

// User routes
apiRouter.get('/users', (req, res) => {
  // Query parameters for filtering
  const { role } = req.query;
  
  if (role) {
    const filteredUsers = database.users.filter(user => user.role === role);
    return res.json(filteredUsers);
  }
  
  res.json(database.users);
});

apiRouter.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = database.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

apiRouter.post('/users', (req, res) => {
  const { name, email, role } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const newId = Math.max(...database.users.map(u => u.id)) + 1;
  const newUser = {
    id: newId,
    name,
    email,
    role: role || 'user'
  };
  
  database.users.push(newUser);
  res.status(201).json(newUser);
});

// Product routes
apiRouter.get('/products', (req, res) => {
  // Filter by min price
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
  const filteredProducts = database.products.filter(product => product.price >= minPrice);
  
  res.json(filteredProducts);
});

apiRouter.get('/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = database.products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found - The requested resource does not exist' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start the server
app.listen(port, () => {
  console.log(`┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`);
  console.log(`┃                                                                        ┃`);
  console.log(`┃  🚀 Server running at http://localhost:${port}                          ┃`);
  console.log(`┃                                                                        ┃`);
  console.log(`┃  📚 API Documentation:                                                 ┃`);
  console.log(`┃     - GET    /api/status                                               ┃`);
  console.log(`┃     - GET    /api/users         (requires x-api-key header)            ┃`);
  console.log(`┃     - GET    /api/users/:id     (requires x-api-key header)            ┃`);
  console.log(`┃     - POST   /api/users         (requires x-api-key header)            ┃`);
  console.log(`┃     - GET    /api/products      (requires x-api-key header)            ┃`);
  console.log(`┃     - GET    /api/products/:id  (requires x-api-key header)            ┃`);
  console.log(`┃                                                                        ┃`);
  console.log(`┃  🔑 Use header: x-api-key: secret-api-key-1234                         ┃`);
  console.log(`┃                                                                        ┃`);
  console.log(`┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});