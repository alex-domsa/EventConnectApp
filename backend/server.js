// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db');

const app = express();

connectDB();

/**
 * CORS SETUP
 * 
 */
app.use(
  cors({
    origin: (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim())
      || ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

/**
 * 
 * This runs before routes and just terminates preflight requests.
 */
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') return next();
  const origin =
    (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,PATCH,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,Origin,Accept'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res.sendStatus(204);
});

/**
 * Core middleware
 */
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);
app.use(passport.initialize());
app.use(passport.session());

/**

 */
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const searchRoutes = require('./routes/searchRoutes');
const clubRoutes = require('./routes/clubRoutes');
const userRoutes = require('./routes/userRoutes'); // 

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/clubs', clubRoutes); // 
app.use('/api/user', userRoutes);

/**
 * Server start
 
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log(
  'BACKEND_URL=',
  (process.env.BACKEND_URL || '').trim(),
  ' FRONTEND_URL=',
  (process.env.FRONTEND_URL || '').trim()
);



