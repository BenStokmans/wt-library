import express, { type Request, type Response, type Express } from "express";
import passport from "passport";
import applyStrategy from "./passport.ts";
import session from "express-session";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import registerAuth from "./auth";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

const db = await open({
  filename: "sqlite.db",
  driver: sqlite3.Database,
});

const app: Express = express();

app.use(session({
  secret: "demannenvancerberus",
  resave: false,
  saveUninitialized: true,
}));
app.use(cookieParser("demannenvancerberus"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// apply our strategy
applyStrategy(passport, db);

const port = process.env.PORT || 8080;

app.get(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    if (req.user) {
      res.send("Welcome " + req.user.firstName);
      return;
    }
    res.send("Guest page");
  },
);

registerAuth(app, db);

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
