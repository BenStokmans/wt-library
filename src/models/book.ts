/**
 * Represents a book entity.
 */
import type { Database } from "sqlite";
import { Author } from "./author.ts";
import type { User } from "./user";

export class Book {
  /** The International Standard Book Number (ISBN) of the book. */
  public isbn: number;
  /** The author of the book. */
  public author: Author;
  /** The title of the book. */
  public title: string;
  /** The URL of the book's cover image. */
  public coverImageUrl: string;
  /** A brief description of the book. */
  public description: string;
  /** The number of available copies of the book. */
  public available: number | null;

  /**
   * Constructs a new Book object.
   * @param isbn The International Standard Book Number (ISBN) of the book.
   * @param author The author of the book.
   * @param title The title of the book.
   * @param coverImageUrl The URL of the book's cover image.
   * @param description A brief description of the book.
   * @param available The number of available copies of the book. Defaults to null.
   */
  constructor(isbn: number, author: Author | number, title: string, coverImageUrl: string, description: string, available?: number) {
    this.isbn = isbn;
    this.author = author instanceof Author ? author : new Author("", "", null, null, null, null, author);
    this.title = title;
    this.coverImageUrl = coverImageUrl;
    this.description = description;
    this.available = available ?? null;
  }

  /**
   * Marks a book as returned by a user.
   * @param user The user who is returning the book.
   * @param db The database connection.
   * @returns A Promise that resolves to true if the book was successfully marked as returned, otherwise false.
   */
  async returnByUser(user: User, db: Database): Promise<boolean> {
    const result = await db.run("UPDATE reservations SET returned = TRUE WHERE isbn = ? AND user_id = ? AND returned = FALSE", this.isbn, user.id);

    return result.lastID != null;
  }

  /**
   * Checks if the book has a current reservation by a user.
   * @param user The user to check for reservation.
   * @param db The database connection.
   * @returns A Promise that resolves to true if the book has a current reservation by the user, otherwise false.
   */
  async hasCurrentReservation(user: User, db: Database): Promise<boolean> {
    const result = await db.get("SELECT COUNT(res_id) as count FROM reservations WHERE isbn = ? AND user_id = ? AND returned = FALSE", this.isbn, user.id);
    return result.count != 0;
  }

  /**
   * Retrieves a book from the database by its ISBN.
   * @param isbn The ISBN of the book to retrieve.
   * @param db The database connection.
   * @returns A Promise that resolves to the retrieved Book object, or null if not found.
   */
  static async getByISBN(isbn: string, db: Database): Promise<Book | null> {
    const book = await db.get("SELECT * FROM books WHERE isbn = ?", isbn);
    if (!book) {
      return null;
    }

    return new Book(book.isbn, new Author("", "", null, null, null, null, book.author_id),
        book.title, book.cover_image_url, book.description);
  }

  /**
   * Retrieves a page of books from the database with author names.
   * @param index The index of the page.
   * @param db The database connection.
   * @returns A Promise that resolves to an array of Book objects representing the page of books.
   */
  static async getPageWithAuthorNames(index: number, db: Database): Promise<Book[]> {
    const query: string = "SELECT books.*, authors.first_name, authors.last_name, authors.alias FROM books LEFT JOIN authors ON books.author_id = authors.author_id ORDER BY isbn LIMIT 10 OFFSET ?";

    const rawBooks = await db.all(query, index * 10);
    return rawBooks.map(book => {
      return new Book(book.isbn, new Author(book.first_name, book.last_name, book.alias, null, null, null, book.author_id),
          book.title, book.cover_image_url, book.description);
    });
  }

  /**
   * Retrieves a book from the database by its ISBN with all details.
   * @param isbn The ISBN of the book to retrieve.
   * @param db The database connection.
   * @returns A Promise that resolves to the retrieved Book object with all details, or null if not found.
   */
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

  /**
   * Creates a new book record in the database.
   * @param db The database connection.
   * @returns A Promise that resolves to true if the book was successfully created, otherwise false.
   */
  async create(db: Database): Promise<boolean> {
    const result = await db.run(
        "INSERT INTO books VALUES (?, ?, ?, ?, ?)",
        this.isbn, this.author.id, this.title, this.coverImageUrl, this.description,
    );

    return result.lastID != null;
  }

  /**
   * Retrieves the total number of books in the database.
   * @param db The database connection.
   * @returns A Promise that resolves to the total number of books in the database.
   */
  static async getBookCount(db: Database): Promise<number> {
    return (await db.get("SELECT COUNT(isbn) AS count FROM books")).count;
  }

  /**
   * Retrieves the amount of available copies of a book.
   * @param isbn The ISBN of the book.
   * @param db The database connection.
   * @returns A Promise that resolves to the amount of available copies of the book, or null if not found.
   */
  static async getAmountAvailable(isbn: string, db: Database): Promise<number | null> {
    // query availability by subtracting owned copies by the library from unreturned reservations, requires fewer
    // individual queries and avoids accidental discrepancies.
    const query: string = "SELECT (SELECT copies FROM books WHERE isbn = $isbn) - (SELECT COUNT(isbn) FROM reservations WHERE isbn = $isbn AND returned = FALSE) AS amount_available";

    const result = await db.get(query, { $isbn: isbn });
    if (!result) return null;
    return result.amount_available;
  }

  /**
   * Retrieves a book from the database by its ISBN with availability details.
   * @param isbn The ISBN of the book to retrieve.
   * @param db The database connection.
   * @returns A Promise that resolves to the retrieved Book object with availability details, or null if not found.
   */
  static async getByISBNWithAvailability(isbn: string, db: Database): Promise<Book | null> {
    // retrieves a book from the database by its ISBN with availability details.
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
