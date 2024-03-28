import { v4 as uuidv4 } from "uuid";
import db from "../mixins/db";

export class User {
  public id: string;
  public username: string;
  public password: string;

  constructor(username: string, password: string, id?: string) {
    this.id = id ?? uuidv4();
    this.username = username;
    this.password = password;
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
    const user = await db.get("SELECT * FROM users WHERE username = ?", username);
    if (!user) {
      return null;
    }

    return new User(user.username, user.passwd_hash, user.user_id);
}

export async function getUserById(id: string): Promise<User | null> {
    const sql = "SELECT * FROM users WHERE user_id = ?";

    const user = await db.get(sql, id);
    if (!user) {
      return null;
    }
    return new User(user.username, user.passwd_hash, user.user_id);
}

export async function createUser(user: User): Promise<Boolean> {
    const result = await db.run(
      "INSERT INTO users VALUES (?, ?, ?)",
      user.id, user.username, user.password
    );

    return result.lastID != null;
}
