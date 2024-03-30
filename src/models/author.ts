import type { Database } from "sqlite";

export class Author {
  public id: number;
  public first_name: string;
  public last_name: string;
  public alias: string | null;
  public wikipedia_url: string | null;

  constructor(first_name: string, last_name: string, alias: string | null, wikipedia_url: string | null, id?: number) {
    this.id = id ?? 0;
    this.first_name = first_name;
    this.last_name = last_name;
    this.alias = alias;
    this.wikipedia_url = wikipedia_url;
  }

  static async getById(id: string, db: Database): Promise<Author | null> {
    const author = await db.get("SELECT * FROM authors WHERE author_id = ?", id);
    if (!author) {
      return null;
    }

    return new Author(author.first_name, author.last_name, author.alias, author.wikipedia_url, author.author_id);
  }

  static async create(author: Author, db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO authors VALUES (?, ?, ?, ?, ?)",
      author.id, author.first_name, author.last_name, author.alias, author.wikipedia_url,
    );

    return result.lastID != null;
  }
}
