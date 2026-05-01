import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";


passport.use(
  new GoogleStrategy(
    {

      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        if (!profile.emails || profile.emails.length === 0) {
          return done(new Error("No email found in Google profile"), null);
        }

        const email = profile.emails[0].value;

        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          if (user.isBlocked) {
            return done(null, false, { message: "User is blocked" });
          }

          if (user.googleEmail && email !== user.email) {
            return done(null, false, {
              message: "Google account email has changed. Please contact support."
            });
          }

          return done(null, user);
        }


        user = await User.findOne({ email });

        if (user) {

          if (user.isBlocked) {
            return done(null, false, { message: "User is blocked" });
          }


          if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
            user.googleEmail = email
            user.profileImage = profile.photos?.[0]?.value || user.profilePic;
            await user.save();
          }

          return done(null, user);
        }


        const nameParts = profile.displayName
          ? profile.displayName.split(" ")
          : ["User"];

        const newUser = new User({
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
          email: email,
          googleEmail: email,
          googleId: profile.id,
          profileImage: profile.photos?.[0]?.value || "",
          isVerified: true,
        });

        await newUser.save();

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;