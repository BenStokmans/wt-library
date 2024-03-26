import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

import { getUserByUsername, getUserById } from './db';
import { log } from './logger';

passport.serializeUser((id, done) => {
    done(null, id);
});

passport.deserializeUser(async (id, done) => {
    const user = await getUserById(id);
    if (user == null) {
      log.error(`error deserializing user: ${id}: user not found`);
    }
    done(null, user);
});

export default function (passport: any) {
  passport.use("local", new LocalStrategy({ usernameField: 'username', }, async (username, password, done) => {
      const userData = await getUserByUsername(username);

      // user does not exist
      if (userData == null) {
          return done(null, false);
      }

      const match = await bcrypt.compare(password, userData.password);

      if (!match) {
          return done(null, false);
      }

      return done(null, userData.id);
  }));
};
