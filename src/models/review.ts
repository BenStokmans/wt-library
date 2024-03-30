import type { Database } from "sqlite";
import type { Book } from "./book";
import type { User } from "./user";

export class Review {
  public user: User;
  public book: Book;
  public title: string;
  public body: string;

  constructor(user: User, book: Book, title: string, body: string) {
    this.user = user;
    this.book = book;
    this.title = title;
    this.body = body;
  }

  static async getByUserAndBook(user: User, book: Book, db: Database): Promise<Review | null> {
    const review = await db.get("SELECT title, body FROM reviews WHERE isbn = ? AND user_id = ?", book.isbn, user.id);
    if (!review) {
      return null;
    }

    return new Review(user, book, review.title, review.body);
  }

  async insert(db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO reviews VALUES (?, ?, ?, ?)",
      this.user.id, this.book.isbn, this.title, this.body,
    );
    return result.lastID != null;
  }

  async update(db: Database): Promise<boolean> {
    const result = await db.run(
      "UPDATE reviews SET title = ?, body = ? WHERE isbn = ? AND user_id = ?",
      this.title, this.body, this.book.isbn, this.user.id,
    );

    return result.lastID != null;
  }
}
