import type { Database } from "sqlite";
import { Author } from "./author.ts";
import type { User } from "./user";

export class Book {
  public isbn: number;
  public author: Author;
  public title: string;
  public coverImageUrl: string;
  public description: string;
  public available: number | null;

  constructor(isbn: number, author: Author, title: string, coverImageUrl: string, description: string, available?: number) {
    this.isbn = isbn;
    this.author = author;
    this.title = title;
    this.coverImageUrl = coverImageUrl;
    this.description = description;
    this.available = available ?? null;
  }

  async canBorrow(user: User, db: Database): Promise<boolean> {
    const result = await db.get("SELECT COUNT(res_id) as count FROM reservations WHERE user_id = ? AND isbn = ? AND start_time + duration > (CAST(strftime('%s', 'now') AS INT) * 1000000000)", user.id, this.isbn);
    return result.count == 0;
  }

  static async getByISBN(isbn: string, db: Database): Promise<Book | null> {
    const book = await db.get("SELECT * FROM books WHERE isbn = ?", isbn);
    if (!book) {
      return null;
    }

    return new Book(book.isbn, new Author("", "", null, null, null, null, book.author_id),
      book.title, book.cover_image_url, book.description);
  }

  static async getPageWithAuthorNames(index: number, db: Database): Promise<Book[]> {
    const query: string = "SELECT books.*, authors.first_name, authors.last_name, authors.alias FROM books LEFT JOIN authors ON books.author_id = authors.author_id ORDER BY isbn LIMIT 10 OFFSET ?";

    const rawBooks = await db.all(query, index * 10);
    return rawBooks.map(book => {
      return new Book(book.isbn, new Author(book.first_name, book.last_name, book.alias, null, null, null, book.author_id),
        book.title, book.cover_image_url, book.description);
    });
  }

  // Gets the book and fully populates the fields (i.e. author information and availability)
  static async getByISBNWithAll(isbn: string, db: Database): Promise<Book | null> {
    const query: string = `
      SELECT
        (SELECT
            (SELECT copies FROM books WHERE isbn = $isbn) -
            (SELECT COUNT(isbn) FROM reservations WHERE isbn = $isbn AND returned = FALSE)
        ) AS available,
        *
      FROM books LEFT JOIN authors ON books.author_id = authors.author_id WHERE isbn = $isbn;`;

    const result = await db.get(query, { $isbn: isbn });

    if (!result) return null;

    return new Book(result.isbn, new Author(result.first_name, result.last_name, result.alias, result.wikipedia_url, result.summary, result.portrait_url,
      result.author_id), result.title, result.cover_image_url, result.description, result.available);
  }

  async create(db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO books VALUES (?, ?, ?, ?, ?)",
      this.isbn, this.author.id, this.title, this.coverImageUrl, this.description,
    );

    return result.lastID != null;
  }

  static async getBookCount(db: Database): Promise<number> {
    return (await db.get("SELECT COUNT(isbn) AS count FROM books")).count;
  }

  static async getAmountAvailable(isbn: string, db: Database): Promise<number | null> {
    // query availability by subtracting owned copies by the library from unreturned reservations, requires fewer
    // individual queries and avoids accidental discrepancies.
    const query: string = "SELECT (SELECT copies FROM books WHERE isbn = $isbn) - (SELECT COUNT(isbn) FROM reservations WHERE isbn = $isbn AND returned = FALSE) AS amount_available";

    const result = await db.get(query, { $isbn: isbn });
    if (!result) return null;
    return result.amount_available;
  }

  static async getByISBNWithAvailability(isbn: string, db: Database): Promise<Book | null> {
    const query: string = `
      SELECT
        (SELECT
            (SELECT copies FROM books WHERE isbn = $isbn) -
            (SELECT COUNT(isbn) FROM reservations WHERE isbn = $isbn AND returned = FALSE)
        ) AS available,
        *
      FROM books WHERE isbn = $isbn;`;

    const book = await db.get(query, { $isbn: isbn });
    if (!book) { return null; }
    return new Book(book.isbn, new Author("", "", null, null, null, null, book.author_id),
      book.title, book.cover_image_url, book.description, book.available);
  }
}
