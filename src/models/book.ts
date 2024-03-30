import type { Database } from "sqlite";

export class Book {
  public isbn: number;
  public authorId: number;
  public title: string;
  public coverImageUrl: string;
  public description: string;

  constructor(isbn: number, authorId: number, title: string, coverImageUrl: string, description: string) {
    this.isbn = isbn;
    this.authorId = authorId;
    this.title = title;
    this.coverImageUrl = coverImageUrl;
    this.description = description;
  }

  static async getByISBN(isbn: string, db: Database): Promise<Book | null> {
    const book = await db.get("SELECT * FROM books WHERE isbn = ?", isbn);
    if (!book) {
      return null;
    }

    return new Book(book.isbn, book.author_id, book.title, book.cover_image_url, book.description);
  }

  static async getPageWithAuthorNames(index: number, db: Database): Promise<[Book, string][]> {
    const books: [Book, string][] = [];
    const query: string = "SELECT books.*, authors.first_name, authors.last_name FROM books LEFT JOIN authors ON books.author_id = authors.author_id ORDER BY isbn LIMIT 10 OFFSET ?";

    await db.each(query, index * 10, (err, row) => {
      if (err) { return; }
      books.push([new Book(row.isbn, row.author_id, row.title, row.cover_image_url, row.description), row.first_name + row.last_name]);
    });

    return books;
  }

  static async create(book: Book, db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO books VALUES (?, ?, ?, ?, ?)",
      book.isbn, book.authorId, book.title, book.coverImageUrl, book.description,
    );

    return result.lastID != null;
  }
}
