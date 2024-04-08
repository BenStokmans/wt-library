import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { User } from "./models/user.ts";
import log from "./logger.ts";
import type {Database} from "sqlite";

export default function(passport: any, rawUrlBase: string, db: Database) {
  const urlBase = rawUrlBase.replace(/http(s)?:\/\/[A-Za-z0-9\-._~/?#[\]@!$&'()*+,;=]+(:\d{1,5})*/g, "");

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
      log.error(`an error occurred while deserializing user: ${e}`);
      log.warn(`POST ${urlBase}/login 500 Internal Server Error`);
      done(new Error("an unknown error occurred while deserialize the user"), null);
    }
  });

  passport.use("local", new LocalStrategy({}, async (username, password, done) => {
    let user: User | null;
    try {
      user = await User.getByUsername(username.trim(), db);
    } catch (e) {
      log.error(`an error occurred while retrieving user from the database: ${e}`);
      log.warn(`POST ${urlBase}/login 500 Internal Server Error`);
      return done(null, false, {message : "an unknown error occurred trying to authenticate user"});
    }

    // user does not exist
    if (user == null) {
      log.info(`POST ${urlBase}/login 200 OK`);
      return done(null, false, { message: "User does not exist" });
    }

    let match = false;
    try {
      match = await bcrypt.compare(password, user.passwordHash);
    } catch (e) {
      log.error(`error computing bcrypt hash for user: ${e}`);
      log.warn(`POST ${urlBase}/login 500 Internal Server Error`);
      return done(null, false, {message : "an unknown error occurred trying to authenticate user"});
    }

    if (!match) {
      log.info(`POST ${urlBase}/login 200 OK`);
      return done(null, false, { message: "Incorrect password" });
    }

    log.info(`POST ${urlBase}/login 200 OK`);
    return done(null, user);
  }));
}
