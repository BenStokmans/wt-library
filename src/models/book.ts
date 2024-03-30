import { Author } from "./author";
import type { Database } from "sqlite";

export class Book {
  public isbn: number;
  public author: Author;
  public title: string;
  public cover_image_url: string;
  public description: string;

  constructor(isbn: number, author: Author, title: string, cover_image_url: string, description: string) {
    this.isbn = isbn;
    this.author = author;
    this.title = title;
    this.cover_image_url = cover_image_url;
    this.description = description;
  }

  static async getByISBN(isbn: string, db: Database): Promise<Book | null> {
    const book = await db.get("SELECT * FROM books WHERE isbn = ?", isbn);
    if (!book) {
      return null;
    }
    const author = await Author.getById(book.author_id, db);
    if (!author) {
      return null;
    }

    return new Book(book.isbn, author, book.title, book.cover_image_url, book.description);
  }

  static async create(book: Book, db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO books VALUES (?, ?, ?, ?, ?)",
      book.isbn, book.author.id, book.title, book.cover_image_url, book.description,
    );

    return result.lastID != null;
  }
}
