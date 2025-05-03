const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Counter = require('../models/Counter');
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          const counter = await Counter.findOneAndUpdate(
            { name: 'userId' },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true }
          );

          user = new User({
            globalId: counter.sequence,
            googleId: profile.id,
            email: profile.emails[0].value,
            isAdmin: false,
          });
          await user.save();
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.globalId));
passport.deserializeUser(async (globalId, done) => {
  const user = await User.findOne({ globalId });
  done(null, user);
});

module.exports = passport;