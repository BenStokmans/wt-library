import express, {type Request, type Response} from "express";
import {Book} from "./models/book.ts";
import log from "./logger.ts";
import type {Database} from "sqlite";
import {Author} from "./models/author.ts";

export default function (db: Database): express.Router {
  const router = express.Router();
  router.get("/books", async (req: Request, res: Response): Promise<void> => {
    let page: number = parseInt(<string>req.query.page);
    if (isNaN(page) || page < 0) page = 0;


    let bookCount = 0;
    try {
      bookCount = await Book.getBookCount(db);
    } catch (e) {
      log.error(`error while getting book count: ${e}`);
      res.status(500);
      res.send("an unknown error has occurred");

      log.warn("GET /api/books 500 Internal Server Error");
      return;
    }
    const pages = Math.ceil(bookCount / 10);
    if (page >= pages) page = pages-1;

    let books: Book[];
    try {
      books = await Book.getPageWithAuthorNames(page, db);
    } catch (e) {
      log.error(`error while getting books page: ${e}`);
      res.status(500);
      res.send("an unknown error has occurred");

      log.warn("GET /api/books 500 Internal Server Error");
      return;
    }

    const simpleBooks = [];
    for (const book of books) {
      simpleBooks.push({isbn: book.isbn, title: book.title, cover_img_url: book.coverImageUrl, author: {id: book.author.id, first_name: book.author.first_name, last_name: book.author.last_name, alias: book.author.alias}});
    }

    res.send(JSON.stringify({page: page, total_pages: pages, books: simpleBooks}));
    log.info("GET /api/books 200 OK");
  });

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



  return router;
}
