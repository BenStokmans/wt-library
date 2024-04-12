/**
 * Provides functionality to retrieve requested books and create an Express router with routes for book-related actions.
 * @remarks
 * This module exports a function to retrieve books based on pagination and another function to create an Express router
 * with routes for actions related to books, such as getting book details, checking availability, reserving, and returning books.
 * @packageDocumentation
 */
import express, {type Request, type Response} from "express";
import {Book} from "./models/book.ts";
import log from "./logger.ts";
import type {Database} from "sqlite";
import {Reservation} from "./models/reservation.ts";
import {User} from "./models/user.ts";

/**
 * Retrieves the requested books based on the page number.
 * @param req The request object.
 * @param res The response object.
 * @param db The database connection.
 * @returns A Promise that resolves to an array containing an array of Book objects, the current page number, and the total number of pages, or null if an error occurs.
 */
export async function getRequestedBooks(req: Request, res: Response, db: Database): Promise<[Book[], number, number] | null> {
  let page: number = parseInt(<string>req.query.page);
  if (isNaN(page) || page < 0) page = 0;

  let bookCount = 0;
  try {
    bookCount = await Book.getBookCount(db);
  } catch (e) {
    log.error(`error while getting book count: ${e}`);
    res.status(500);
    res.send("an unknown error has occurred");

    log.warn(`GET ${req.url} 500 Internal Server Error`);
    return null;
  }
  const pages = Math.ceil(bookCount / 10);
  if (page >= pages) page = pages-1;

  try {
    return [await Book.getPageWithAuthorNames(page, db), page, pages];
  } catch (e) {
    log.error(`error while getting books page: ${e}`);
    res.status(500);
    res.send("an unknown error has occurred");

    log.warn(`GET ${req.url} 500 Internal Server Error`);
    return null;
  }
}

/**
 * Creates an Express router with routes for book-related actions.
 * @param db The database connection.
 * @returns An Express router configured with routes for book-related actions.
 */
export default function (db: Database): express.Router {
  // Creates an Express router with routes for book-related actions.
  const router = express.Router();

  // Route to get paginated list of books
  router.get("/books", async (req: Request, res: Response): Promise<void> => {
    const result = await getRequestedBooks(req, res, db);
    if (!result) return;
    const [books, page, pages] = result;

    const simpleBooks = [];
    for (const book of books) {
      simpleBooks.push({isbn: book.isbn, title: book.title, cover_img_url: book.coverImageUrl, author: {id: book.author.id, first_name: book.author.first_name, last_name: book.author.last_name, alias: book.author.alias}});
    }

    res.send(JSON.stringify({page: page, total_pages: pages, books: simpleBooks}));
    log.info(`GET ${req.url} 200 OK`);
  });

  // Route to get details of a specific book by ISBN
  router.get("/books/:isbn", async (req: Request, res: Response): Promise<void> => {
    let book: Book | null;

    try {
      book = await Book.getByISBNWithAvailability(req.params.isbn, db);
    } catch (e) {
      log.error(`error while getting book with isbn ${req.params.isbn}: ${e}`);
      res.status(500);
      log.info(`GET ${req.url} 500 Internal Server Error`);
      return;
    }
    if (!book) {
      res.status(404);
      log.info(`GET ${req.url} 404 Not Found`);
      return;
    }

    res.send(JSON.stringify({
      isbn: book.isbn,
      author_id: book.author.id,
      title: book.title,
      cover_image_url: book.coverImageUrl,
      description: book.description,
      available: book.available,
    }));
    log.info(`GET ${req.url} 200 OK`);
  });

  // Route to get availability of a book by ISBN
  router.get("/availability/:isbn", async (req: Request, res: Response): Promise<void> => {
    let avail: number | null;

    try {
      avail = await Book.getAmountAvailable(req.params.isbn, db);
    } catch (e) {
      log.error(`error while getting availability for isbn ${req.params.isbn}: ${e}`);
      res.status(500);
      log.info(`GET ${req.url} 500 Internal Server Error`);
      return;
    }

    if (avail === null) {
      res.status(404);
      log.info(`GET ${req.url} 404 Not Found`);
      return;
    }

    res.send(JSON.stringify({ available: avail }));
    log.info(`GET ${req.url} 200 OK`);
  });

  // Route to reserve a book by ISBN
  router.post("/reserve/:isbn", async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).send(JSON.stringify({ error: "You are not logged in" }));
      log.info(`GET ${req.url} 401 Unauthorized`);
      return;
    }
    const book = new Book(Number(req.params.isbn), 0, "", "", "");

    try {
      if (await book.hasCurrentReservation(<User>req.user, db)) {
        res.status(403).send(JSON.stringify({ error: "You have already reserved a copy of this book" }));
        log.info(`GET ${req.url} 403 Forbidden`);
        return;
      }
    } catch (e) {
      log.error(`error while getting reservation for isbn ${req.params.isbn}: ${e}`);
      res.status(500);
      log.info(`GET ${req.url} 500 Internal Server Error`);
      return;
    }

    try {
      const numAvail = await Book.getAmountAvailable(req.params.isbn, db);
      if (numAvail !== null && numAvail < 1) {
        res.status(404).send(JSON.stringify({ error: "This book is currently unavailable, please check back later" }));
        log.info(`GET ${req.url} 404 Not Found`);
        return;
      }
    } catch (e) {
      log.error(`error while getting availability for isbn ${req.params.isbn}: ${e}`);
      res.status(500);
      log.info(`GET ${req.url} 500 Internal Server Error`);
      return;
    }

    // reserve for a week from now
    try {
      const reservation = new Reservation(<User>req.user, Number(req.params.isbn), new Date(), new Date(new Date().getTime() + 604800000), false);
      if (!await reservation.insert(db)) {
        res.status(500).send(JSON.stringify({ error: "Internal server error while inserting reservation" }));
        log.info(`GET ${req.url} 500 Internal Server Error`);
        return;
      }
    } catch (e) {
      log.error(`error while creating reservation for isbn: ${req.params.isbn}: ${e}`);
      res.status(500);
      log.info(`GET ${req.url} 500 Internal Server Error`);
      return;
    }

    log.info(`GET ${req.url} 200 OK`);
    res.sendStatus(200);
  });

  // Route to return a book by ISBN
  router.post("/return/:isbn", async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).send(JSON.stringify({ error: "You are not logged in" }));
      log.info(`GET ${req.url} 401 Unauthorized`);
      return;
    }
    const book = new Book(Number(req.params.isbn), 0, "", "", "");

    try {
      if (!await book.hasCurrentReservation(<User>req.user, db)) {
        res.status(403).send(JSON.stringify({ error: "You do not have a copy of this book" }));
        log.info(`GET ${req.url} 403 Forbidden`);
        return;
      }
    } catch (e) {
      log.error(`error while checking for reservation: ${e}`);
      res.status(500);
      log.info(`GET ${req.url} 500 Internal Server Error`);
      return;
    }

    try {
      if (!await book.returnByUser(<User>req.user, db)) {
        res.status(500).send(JSON.stringify({ error: "Internal server error while inserting reservation" }));
        log.info(`GET ${req.url} 500 Internal Server Error`);
        return;
      }
    } catch (e) {
      log.error(`error while marking reservation as returned: ${e}`);
      res.status(500);
      log.info(`GET ${req.url} 500 Internal Server Error`);
      return;
    }

    log.info(`GET ${req.url} 200 OK`);
    res.sendStatus(200);
  });

  return router;
}
