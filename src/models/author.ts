import type { Database } from "sqlite";

export class Author {
  public id: number;
  public first_name: string;
  public last_name: string;
  public alias: string | null;
  public summary: string | null;
  public portraitUrl: string | null;
  public wikipediaUrl: string | null;

  constructor(first_name: string, last_name: string, alias: string | null, wikipedia_url: string | null, summary: string | null, portraitUrl: string | null, id?: number) {
    this.id = id ?? 0;
    this.first_name = first_name;
    this.last_name = last_name;
    this.alias = alias;
    this.summary = summary;
    this.portraitUrl = portraitUrl;
    this.wikipediaUrl = wikipedia_url;
  }

  static async getById(id: string, db: Database): Promise<Author | null> {
    const author = await db.get("SELECT * FROM authors WHERE author_id = ?", id);
    if (!author) {
      return null;
    }

    return new Author(author.first_name, author.last_name, author.alias, author.wikipedia_url, author.summary, author.portrait_url, author.author_id);
  }

  static async create(author: Author, db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO authors VALUES (?, ?, ?, ?, ?, ?, ?)",
      author.id, author.first_name, author.last_name, author.alias, author.summary, author.portraitUrl, author.wikipediaUrl,
    );

    return result.lastID != null;
  }
}
