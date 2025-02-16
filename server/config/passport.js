// server/config/passport.js
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require('../models/User');
const keys = require('./keys');

module.exports = function (passport) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: keys.twitter.consumerKey,
        consumerSecret: keys.twitter.consumerSecret,
        callbackURL: keys.twitter.callbackURL,
        includeEmail: true,
      },
      async (token, tokenSecret, profile, done) => {
        // Find or create the user in MongoDB
        try {
          let user = await User.findOne({ twitterId: profile.id });
          if (user) {
            // Update tokens if necessary
            user.token = token;
            user.tokenSecret = tokenSecret;
            await user.save();
            return done(null, user);
          } else {
            const newUser = new User({
              twitterId: profile.id,
              username: profile.username,
              displayName: profile.displayName,
              token,
              tokenSecret,
            });
            await newUser.save();
            return done(null, newUser);
          }
        } catch (err) {
          console.error(err);
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      let user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

/*
  IMPORTANT: Ensure that your Twitter Developer Application is configured as a Web Application
  with the callback URL set to "http://localhost:5000/auth/twitter/callback".
  If your app is set as a Desktop Application, Twitter will force the callback to "oob"
  and you will receive the error: "Desktop applications only support the oauth_callback value 'oob'".
*/
