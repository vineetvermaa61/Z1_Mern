// server/app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000', // Your React app’s URL
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: 'your_secret_key', // change this for production
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./config/passport')(passport);

// Routes
app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
