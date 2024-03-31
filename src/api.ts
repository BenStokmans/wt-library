import express, {type Request, type Response} from "express";
import {Book} from "./models/book.ts";
import log from "./logger.ts";
import type {Database} from "sqlite";

export default function (db: Database): express.Router {
    let router = express.Router();
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

            log.warn(`GET /api/books 500 Internal Server Error`);
            return;
        }
        let pages = Math.ceil(bookCount / 10);
        if (page >= pages) page = pages-1;

        let books: Book[];
        try {
            books = await Book.getPageWithAuthorNames(page, db)
        } catch (e) {
            log.error(`error while getting books page: ${e}`);
            res.status(500);
            res.send("an unknown error has occurred");

            log.warn(`GET /api/books 500 Internal Server Error`);
            return;
        }

        let simpleBooks = [];
        for (let book of books) {
            simpleBooks.push({isbn: book.isbn, title: book.title, cover_img_url: book.coverImageUrl, author: {id: book.author.id, first_name: book.author.first_name, last_name: book.author.last_name, alias: book.author.alias}})
        }

        res.send(JSON.stringify({page: page, total_pages: pages, books: simpleBooks}));
        log.info(`GET /api/books 200 OK`);
    });

    return router;
}
