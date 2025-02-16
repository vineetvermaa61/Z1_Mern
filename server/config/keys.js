// server/config/keys.js
module.exports = {
  twitter: {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL || "http://localhost:5000/auth/twitter/callback",
  },
};
