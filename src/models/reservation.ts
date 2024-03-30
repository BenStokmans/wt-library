import type { Database } from "sqlite";
import { v4 as uuidv4 } from "uuid";
import { Book } from "./book";
import { User } from "./user";

export class Reservation {
  public id: string;
  public book: Book;
  public user: User;
  public startTime: Date;
  public endTime: Date;
  public returned: boolean;

  constructor(user: User, book: Book, startTime: Date, endTime: Date, returned: boolean, id?: string) {
    this.id = id ?? uuidv4();
    this.user = user;
    this.book = book;
    this.startTime = startTime;
    this.endTime = endTime;
    this.returned = returned;
  }

  static async getReservationById(id: string, db: Database): Promise<Reservation | null> {
    const reservation = await db.get("SELECT isbn, user_id, start_time, duration, returned FROM reservations WHERE res_id = ?", id);
    if (!reservation) {
      return null;
    }
    const user = await User.getById(reservation.user_id, db);
    if (!user) {
      return null;
    }

    const book = await Book.getByISBN(reservation.isbn, db);
    if (!book) {
      return null;
    }

    let start = new Date(reservation.start_time / 1000000);
    let end = new Date((reservation.start_time + reservation.duration) / 1000000);

    return new Reservation(user, book, start, end, reservation.returned, id);
  }

  static async getReservationByUserAndBook(user: User, book: Book, db: Database): Promise<Reservation | null> {
    const reservation = await db.get("SELECT res_id, start_time, duration, returned FROM reservations WHERE isbn = ? AND user_id = ?", book.isbn, user.id);
    if (!reservation) {
      return null;
    }

    let start = new Date(reservation.start_time / 1000000);
    let end = new Date((reservation.start_time + reservation.duration) / 1000000);

    return new Reservation(user, book, start, end, reservation.returned, reservation.res_id);
  }

  async insert(db: Database): Promise<boolean> {
    let startNanos = this.startTime.getMilliseconds() * 1000000;
    let durationNanos = (this.endTime.getMilliseconds() * 1000000) - startNanos;
    const result = await db.run(
      "INSERT INTO reservations VALUES (?, ?, ?, ?, ?, ?)",
      this.id, this.book.isbn, this.user.id, startNanos, durationNanos, this.returned
    );
    return result.lastID != null;
  }

  async update(db: Database): Promise<boolean> {
    let durationNanos = (this.endTime.getMilliseconds() * 1000000) - (this.startTime.getMilliseconds() * 1000000);

    // the only thing that should be updated is either the duration or returned
    const result = await db.run(
      "UPDATE reviews SET duration = ?, returned = ? WHERE res_id = ?",
        durationNanos, this.returned
    );

    return result.lastID != null;
  }
}
