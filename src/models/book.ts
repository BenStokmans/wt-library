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

    return new Book(book.isbn, new Author("", "", null, null, book.author_id), book.title, book.cover_image_url, book.description);
  }

  static async getPageWithAuthorNames(index: number, db: Database): Promise<Book[]> {
    const query: string = "SELECT books.*, authors.first_name, authors.last_name, authors.alias FROM books LEFT JOIN authors ON books.author_id = authors.author_id ORDER BY isbn LIMIT 10 OFFSET ?";

    const rawBooks = await db.all(query, index * 10);
    return rawBooks.map(book => {
      return new Book(book.isbn, new Author(book.first_name, book.last_name, book.alias, null, book.author_id), book.title, book.cover_image_url, book.description);
    });
  }

  async create(db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO books VALUES (?, ?, ?, ?, ?)",
      this.isbn, this.author.id, this.title, this.coverImageUrl, this.description,
    );

    return result.lastID != null;
  }
}
