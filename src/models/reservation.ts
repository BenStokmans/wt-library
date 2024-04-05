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

  constructor(user: User, book: Book | number, startTime: Date, endTime: Date, returned: boolean, id?: string) {
    this.id = id ?? uuidv4();
    this.user = user;
    this.book = book instanceof Book ? book : new Book(book, 0, "", "", "");
    this.startTime = startTime;
    this.endTime = endTime;
    this.returned = returned;
  }

  static async getReservationById(id: string, db: Database): Promise<Reservation | null> {
    const reservation = await db.get("WITH time(now) AS (SELECT (CAST(strftime('%s', 'now') AS INT) * 1000000000)) SELECT COUNT(res_id) != 0 FROM reservations, time WHERE user_id = ? AND isbn = ? AND start_time + duration > time.now", id);
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

    const start = new Date(reservation.start_time / 1000000);
    const end = new Date((reservation.start_time + reservation.duration) / 1000000);

    return new Reservation(user, book, start, end, reservation.returned, id);
  }

  static async getReservationByUserAndBook(user: User, book: Book, db: Database): Promise<Reservation | null> {
    const reservation = await db.get("SELECT res_id, start_time, duration, returned FROM reservations WHERE isbn = ? AND user_id = ? ORDER BY start_time DESC", book.isbn, user.id);
    if (!reservation) {
      return null;
    }

    const start = new Date(reservation.start_time / 1000000);
    const end = new Date((reservation.start_time + reservation.duration) / 1000000);

    return new Reservation(user, book, start, end, reservation.returned, reservation.res_id);
  }

  static async getReservationsByUser(user: User, db: Database): Promise<Reservation[]> {
    const rawReservations = await db.all("SELECT res_id, start_time, duration, returned, isbn FROM reservations WHERE user_id = ? ORDER BY start_time DESC", user.id);

    const reservations: Reservation[] = [];
    for (const rawReservation of rawReservations) {
      const book = await Book.getByISBN(rawReservation.isbn, db).then(v => v);
      if (!book) continue;

      const start = new Date(rawReservation.start_time / 1000000);
      const end = new Date((rawReservation.start_time + rawReservation.duration) / 1000000);

      reservations.push(new Reservation(user, book, start, end, rawReservation.returned, rawReservation.res_id));
    }

    return reservations;
  }

  async insert(db: Database): Promise<boolean> {
    const startNanos = this.startTime.getTime() * 1000000;
    const durationNanos = (this.endTime.getTime() * 1000000) - startNanos;
    const result = await db.run(
      "INSERT INTO reservations VALUES (?, ?, ?, ?, ?, ?)",
      this.id, this.book.isbn, this.user.id, startNanos, durationNanos, this.returned,
    );
    return result.lastID != null;
  }

  async update(db: Database): Promise<boolean> {
    const durationNanos = (this.endTime.getMilliseconds() * 1000000) - (this.startTime.getMilliseconds() * 1000000);

    // the only thing that should be updated is either the duration or returned
    const result = await db.run(
      "UPDATE reviews SET duration = ?, returned = ? WHERE res_id = ?",
      durationNanos, this.returned,
    );

    return result.lastID != null;
  }
}
