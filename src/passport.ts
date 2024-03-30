import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { User } from "./models/user.ts";
import log from "./logger.ts";
import type {Database} from "sqlite";

export default function(passport: any, db: Database) {
  // @ts-expect-error eslint is boos... boeie
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // @ts-expect-error ja wederom boeie
  passport.deserializeUser(async (id, done) => {
    const user = await User.getById(id, db);
    if (user == null) {
      log.error(`error deserializing user: ${id}: user not found`);
    }
    done(null, user);
  });

  passport.use("local", new LocalStrategy({}, async (username, password, done) => {
    const user = await User.getByUsername(username, db);

    // user does not exist
    if (user == null) {
      return done(null, false, { message: "User does not exist" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      return done(null, false, { message: "Incorrect password" });
    }

    return done(null, user);
  }));
}
