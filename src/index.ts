import express, { type Request, type Response, type Express } from "express";
import passport from "passport";
import applyStrategy from "./passport";
import session from "express-session";
import log from "./logger";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import registerAuth from "./auth";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { Book } from "./models/book";
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
    let page: number = parseInt(<string>req.query.page);
    if (isNaN(page)) page = 0;

    let bookCount = 0;
    try {
        bookCount = await Book.getBookCount(db);
    } catch (e) {
        log.error(`error while getting book count: ${e}`);
        res.send("an unknown error has occurred");
        return;
    }

    let books: Book[];
    try {
        books = await Book.getPageWithAuthorNames(page, db)
    } catch (e) {
        log.error(`error while getting books page: ${e}`);
        res.send("an unknown error has occurred");
        return;
    }

    res.send(await ejs.renderFile("src/views/index.ejs", {
      books: books,
      user: req.user,
      isAuthenticated: Boolean(req.user),
      pages: Math.ceil(bookCount / 10)
    }));
    log.info(`GET / 200 OK`)
  },
);

app.get(
  "/book/:isbn",
  async (req: Request, res: Response): Promise<void> => {
    let book: Book | null = null;
    try {
        book = await Book.getByISBN(req.params.isbn, db);
    } catch (e) {
        log.error(`error while getting book count: ${e}`);
        res.send("an unknown error has occurred");
        return;
    }

    if (!book) {
      // TODO: 404 page here?
      res.redirect("/");
      log.warn(`GET /books/${req.params.isbn} 404 Not found`);
      return;
    }

    res.send(await ejs.renderFile("src/views/book.ejs", {
      book: book,
      user: req.user,
      isAuthenticated: Boolean(req.user),
    }));

    log.info(`GET /books/${book.isbn} 200 OK`)
  },
);
registerAuth(app, db);

app.listen(port, () => {
  log.info(`server is up and running on port ${port}`);
});
