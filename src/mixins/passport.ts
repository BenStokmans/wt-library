import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { getUserByUsername, getUserById } from '../models/user';
import log from './logger';

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await getUserById(id);
    if (user == null) {
        log.error(`error deserializing user: ${id}: user not found`);
    }
    done(null, user);
});

export default function(passport: any) {
    passport.use("local", new LocalStrategy({}, async (username, password, done) => {
        const user = await getUserByUsername(username);

        // user does not exist
        if (user == null) {
            return done(null, false, { message: "User does not exist" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
    }));
};
