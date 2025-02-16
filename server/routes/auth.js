// server/routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Initiate Twitter authentication
router.get('/twitter', passport.authenticate('twitter'));

// Twitter auth callback
router.get(
  '/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: 'http://localhost:3000/login' }),
  (req, res) => {
    // On successful authentication, redirect to the client homepage
    res.redirect('http://localhost:3000');
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:3000');
  });
});

// Endpoint to check current user authentication status
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

module.exports = router;
