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
import * as path from "path";
import api, { getRequestedBooks } from "./api";
import { Reservation } from "./models/reservation";
import type {User} from "./models/user.ts";
import { config } from "dotenv";

// load environment variables
config();

const dbPath = String(process.env.DB_NAME);
const dbExists = await Bun.file(dbPath).exists();

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database,
});

if (!dbExists) {
  log.info("initializing database...");

  const dbDef = await Bun.file("dbdef.ddl").text();
  const dbPop = await Bun.file("dbpop.ddl").text();

  try {
    // create database definition
    for (const sql of dbDef.split(";"))
      await db.run(sql);
    // populate the database
    for (const sql of dbPop.split(";"))
      await db.run(sql);
  } catch { /* empty */ }
}

const app: Express = express();

app.use(session({
  secret: String(process.env.SESSION_SECRET),
  resave: false,
  saveUninitialized: true,
}));
app.use(cookieParser(String(process.env.COOKIE_SESSION_SECRET)));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static("src/public", {
  index: false,
  // HACK: hook setHeaders which is called when a static file is served
  setHeaders: (_response, file_path) => {
    log.info(`GET ${path.relative("src/public", file_path)} OK`);
  },
}));

const port = process.env.PORT || 8080;
const urlBase = process.env.URL_BASE || "http://localhost";

// apply our strategy
applyStrategy(passport, urlBase, db);

// api handler
app.use("/api", api(db));

app.get(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    const result = await getRequestedBooks(req, res, db);
    if (!result) return;
    const [books, page, pages] = result;

    res.send(await ejs.renderFile("src/views/index.ejs", {
      books: books,
      user: req.user,
      isAuthenticated: Boolean(req.user),
      pages: pages,
      page: page,
      urlBase: urlBase,
    }));
    log.info(`GET ${req.url} 200 OK`);
  },
);

app.get(
  "/book/:isbn",
  async (req: Request, res: Response): Promise<void> => {
    let book: Book | null = null;
    try {
      book = await Book.getByISBNWithAll(req.params.isbn, db);
    } catch (e) {
      log.error(`error while getting book count: ${e}`);
      res.status(500);
      res.send("an unknown error has occurred");

      log.warn(`GET ${req.url} 500 Internal Server Error`);
      return;
    }

    if (!book) {
      // TODO: 404 page here?
      res.status(404);
      res.redirect(urlBase);
      log.warn(`GET ${req.url} 404 Not found`);
      return;
    }

    let hasReservation = false;
    if (req.user) {
      try {
        hasReservation = await book.hasCurrentReservation(<User>req.user, db);
      } catch (e) {
        log.error(`error while checking if user already borrowed this book (defaulting to yes) ${e}`);
        hasReservation = true;
      }
    }

    res.send(await ejs.renderFile("src/views/book.ejs", {
      book: book,
      hasReservation: hasReservation,
      user: req.user,
      isAuthenticated: Boolean(req.user),
      urlBase: urlBase,
    }));

    log.info(`GET ${req.url} 200 OK`);
  },
);

app.get(
  "/profile",
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      // user is not logged in
      res.redirect(urlBase);
      return;
    }
    let reservations: Reservation[];
    try {
      reservations = await Reservation.getReservationsByUser(<User>req.user, db);
    } catch (e) {
      log.error(`error while getting reservation history: ${e}`);
      res.status(500);
      res.send("an unknown error has occurred");

      log.warn(`GET ${req.url} 500 Internal Server Error`);
      return;
    }

    res.send(await ejs.renderFile("src/views/profile.ejs", {
      user: req.user,
      history: reservations,
      urlBase: urlBase,
    }));

    log.info(`GET ${req.url} 200 OK`);
  },
);

registerAuth(app, urlBase, db);

app.listen(port, () => {
  log.info(`server is up and running on port with url base: ${process.env.URL_BASE}`);
});
