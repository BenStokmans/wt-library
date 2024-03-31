import express, { type Request, type Response, type Express } from "express";
import passport from "passport";
import applyStrategy from "./passport.ts";
import session from "express-session";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import registerAuth from "./auth";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { Book } from "./models/book.ts";
import ejs from "ejs";

const db = await open({
  filename: "sqlite.db",
  driver: sqlite3.Database,
});

// const db = new sqlite3.Database("sqlite.db");

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
app.use(express.static("src/public"));

// apply our strategy
applyStrategy(passport, db);

const port = process.env.PORT || 8080;

app.get(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    let page: number = parseInt(req.query.page);
    if (isNaN(page)) page = 0;

    res.send(await ejs.renderFile("src/views/index.ejs", {
      books: await Book.getPageWithAuthorNames(page, db),
      user: req.user,
      isAuthenticated: Boolean(req.user),
      pages: Math.ceil(await Book.getBookCount(db) / 10)
    }));
  },
);

app.get(
  "/book/:isbn",
  async (req: Request, res: Response): Promise<void> => {
    let book = await Book.getByISBN(req.params.isbn, db);
    if (!book) {
      // TODO: 404 here?
      res.redirect("/");
      return;
    }

    res.send(await ejs.renderFile("src/views/book.ejs", {
      book: book,
      user: req.user,
      isAuthenticated: Boolean(req.user),
    }));
  },
);
registerAuth(app, db);

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
