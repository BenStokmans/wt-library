/**
 * Configures and starts the Express server for the application.
 * @remarks
 * This file sets up the Express server, including middleware for session management,
 * request body parsing, passport authentication, flash messages, and serving static files.
 * It also initializes the SQLite database, applies authentication strategies, defines API routes,
 * and handles rendering of various views like the home page, book details page, and user profile page.
 * @packageDocumentation
 */
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

// Path to the SQLite database file
const dbPath = String(process.env.DB_NAME);

// Check if the database file exists
const dbExists = await Bun.file(dbPath).exists();

// Open the SQLite database connection
const db = await open({
  filename: dbPath,
  driver: sqlite3.Database,
});

// Initialize the database if it doesn't exist
if (!dbExists) {
  log.info("initializing database...");

  // Read the database definition file
  const dbDef = await Bun.file("dbdef.ddl").text();
  // Read the database population file
  const dbPop = await Bun.file("dbpop.ddl").text();

  try {
    // Create database tables and schema
    for (const sql of dbDef.split(";"))
      await db.run(sql);
    // Populate the database with initial data
    for (const sql of dbPop.split(";"))
      await db.run(sql);
  } catch { /* ignore errors */ }
}

// Initialize the Express application
const app: Express = express();

// Middleware for session management
app.use(session({
  secret: String(process.env.SESSION_SECRET),
  resave: false,
  saveUninitialized: true,
}));
app.use(cookieParser(String(process.env.COOKIE_SESSION_SECRET)));

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware for passport authentication
app.use(passport.initialize());
app.use(passport.session());

// Middleware for flash messages
app.use(flash());

// Serve static files from the public directory
app.use(express.static("src/public", {
  index: false,
  setHeaders: (_response, file_path) => {
    // Log static file requests
    log.info(`GET ${path.relative("src/public", file_path)} OK`);
  },
}));

// Port configuration
const port = process.env.PORT || 8080;

// Base URL configuration
const urlBase = process.env.URL_BASE || "http://localhost";

// Apply authentication strategy
applyStrategy(passport, urlBase, db);

// API routes
app.use("/api", api(db));

// Route for rendering the home page
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

// Route for rendering book details page
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

// Route for rendering user profile page
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

// Register authentication routes
registerAuth(app, urlBase, db);

// Start the server
app.listen(port, () => {
  log.info(`server is up and running on port with url base: ${process.env.URL_BASE}`);
});
