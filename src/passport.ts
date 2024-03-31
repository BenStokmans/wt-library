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
    try {
      const user = await User.getById(id, db);
      if (user == null)
        return done(new Error(`error deserializing user: ${id}: user not found`), null);

      done(null, user);
    } catch (e) {
      log.error(`an error occurred while deserializing user: ${e}`)
      done(new Error("an unknown error occurred while deserialize the user"), null);
    }
  });

  passport.use("local", new LocalStrategy({}, async (username, password, done) => {
    let user: User | null;
    try {
      user = await User.getByUsername(username, db);
    } catch (e) {
      log.error(`an error occurred while retrieving user from the database: ${e}`);
      return done(null, false, {message : "an unknown error occurred trying to authenticate user"});
    }

    // user does not exist
    if (user == null) {
      return done(null, false, { message: "User does not exist" });
    }

    let match = false;
    try {
      match = await bcrypt.compare(password, user.passwordHash);
    } catch (e) {
      log.error(`error computing bcrypt hash for user: ${e}`);
      return done(null, false, {message : "an unknown error occurred trying to authenticate user"});
    }

    if (!match) {
      return done(null, false, { message: "Incorrect password" });
    }

    return done(null, user);
  }));
}
