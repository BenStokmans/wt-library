import type { Database } from "sqlite";
import { Author } from "./author.ts";

export class Book {
  public isbn: number;
  public author: Author;
  public title: string;
  public coverImageUrl: string;
  public description: string;

  constructor(isbn: number, author: Author, title: string, coverImageUrl: string, description: string) {
    this.isbn = isbn;
    this.author = author;
    this.title = title;
    this.coverImageUrl = coverImageUrl;
    this.description = description;
  }

  static async getByISBN(isbn: string, db: Database): Promise<Book | null> {
    const book = await db.get("SELECT * FROM books WHERE isbn = ?", isbn);
    if (!book) {
      return null;
    }

    return new Book(book.isbn, new Author("", "", "", book.author_id), book.title, book.cover_image_url, book.description);
  }

  static async getPageWithAuthorNames(index: number, db: Database): Promise<Book[]> {
    const books: Book[] = [];
    const query: string = "SELECT books.*, authors.first_name, authors.last_name FROM books LEFT JOIN authors ON books.author_id = authors.author_id ORDER BY isbn LIMIT 10 OFFSET ?";

    await db.each(query, index * 10, (err, row) => {
      if (err) { return; }
      books.push(new Book(row.isbn, new Author(row.first_name, row.last_name, "", row.author_id), row.title, row.cover_image_url, row.description));
    });

    return books;
  }

  static async create(book: Book, db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO books VALUES (?, ?, ?, ?, ?)",
      book.isbn, book.author.id, book.title, book.coverImageUrl, book.description,
    );

    return result.lastID != null;
  }
}
