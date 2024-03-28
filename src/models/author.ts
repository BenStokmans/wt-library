import { v4 as uuidv4 } from "uuid";
import db from "../mixins/db";

export class Author {
  public id: string;
  public first_name: string;
  public last_name: string;
  public wikipedia_url: string;

  constructor(first_name: string, last_name: string, wikipedia_url: string, id?: string) {
    this.id = id ?? uuidv4();
    this.first_name = first_name;
    this.last_name = last_name;
    this.wikipedia_url = wikipedia_url;
  }
}

export async function getAuthorById(id: string): Promise<Author | null> {
  const author = await db.get("SELECT * FROM authors WHERE author_id = ?", id);
  if (!author) {
    return null;
  }

  return new Author(author.first_name, author.last_name, author.wikipedia_url, author.author_id);
}

export async function createAuthor(author: Author): Promise<Boolean> {
  const result = await db.run(
    "INSERT INTO authors VALUES (?, ?, ?, ?)",
    author.id, author.first_name, author.last_name, author.wikipedia_url
  );

  return result.lastID != null;
}
