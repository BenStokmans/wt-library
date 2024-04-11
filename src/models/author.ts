/**
 * Represents an author entity.
 */
import type { Database } from "sqlite";

export class Author {
  /** The unique identifier of the author. */
  public id: number;
  /** The first name of the author. */
  public first_name: string;
  /** The last name of the author. */
  public last_name: string;
  /** The alias or pen name of the author, if any. */
  public alias: string | null;
  /** A brief summary or biography of the author. */
  public summary: string | null;
  /** The URL of the author's portrait image. */
  public portraitUrl: string | null;
  /** The URL of the author's Wikipedia page, if available. */
  public wikipediaUrl: string | null;

  /**
   * Constructs a new Author object.
   * @param first_name The first name of the author.
   * @param last_name The last name of the author.
   * @param alias The alias or pen name of the author, if any.
   * @param wikipedia_url The URL of the author's Wikipedia page, if available.
   * @param summary A brief summary or biography of the author.
   * @param portraitUrl The URL of the author's portrait image.
   * @param id Optional. The unique identifier of the author. Defaults to 0.
   */
  constructor(first_name: string, last_name: string, alias: string | null, wikipedia_url: string | null, summary: string | null, portraitUrl: string | null, id?: number) {
    this.id = id ?? 0;
    this.first_name = first_name;
    this.last_name = last_name;
    this.alias = alias;
    this.summary = summary;
    this.portraitUrl = portraitUrl;
    this.wikipediaUrl = wikipedia_url;
  }

  /**
   * Retrieves an author from the database by their unique identifier.
   * @param id The unique identifier of the author to retrieve.
   * @param db The database connection.
   * @returns A Promise that resolves to the retrieved Author object, or null if not found.
   */
  static async getById(id: string, db: Database): Promise<Author | null> {
    const author = await db.get("SELECT * FROM authors WHERE author_id = ?", id);
    if (!author) {
      return null;
    }

    return new Author(author.first_name, author.last_name, author.alias, author.wikipedia_url, author.summary, author.portrait_url, author.author_id);
  }

  /**
   * Creates a new author record in the database.
   * @param author The author object to be created.
   * @param db The database connection.
   * @returns A Promise that resolves to true if the author was successfully created, otherwise false.
   */
  static async create(author: Author, db: Database): Promise<boolean> {
    const result = await db.run(
        "INSERT INTO authors VALUES (?, ?, ?, ?, ?, ?, ?)",
        author.id, author.first_name, author.last_name, author.alias, author.summary, author.portraitUrl, author.wikipediaUrl,
    );

    return result.lastID != null;
  }
}
