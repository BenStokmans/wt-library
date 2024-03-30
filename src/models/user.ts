import { v4 as uuidv4 } from "uuid";
import { type Database } from "sqlite";

export interface UserOpts {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  streetAndNumber: string;
  zipCode: string;
  city: string;
  passwordHash: string;
}

export class User {
  public id: string;
  public username: string;
  public email: string;
  public firstName: string;
  public lastName: string;
  public streetAndNumber: string;
  public zipCode: string;
  public city: string;
  public passwordHash: string;

  constructor(opts: UserOpts, id?: string) {
    this.id = id ?? uuidv4();
    this.username = opts.username;
    this.email = opts.email;
    this.firstName = opts.firstName;
    this.lastName = opts.lastName;
    this.streetAndNumber = opts.streetAndNumber;
    this.zipCode = opts.zipCode;
    this.city = opts.city;
    this.passwordHash = opts.passwordHash;
  }

  static async create(user: User, db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO users VALUES (?, ?, ?)",
      user.id, user.username, user.passwordHash,
    );

    return result.lastID != null;
  }

  static async getByUsername(username: string, db: Database): Promise<User | null>
  { return this.getUser(db, "SELECT * FROM users WHERE username = ?", username); }

  static async getById(id: string, db: Database): Promise<User | null>
  { return this.getUser(db, "SELECT * FROM users WHERE user_id = ?", id); }

  private static async getUser(db: Database, query: string, ...params: any[]): Promise<User | null> {
    const user = await db.get(query, ...params);
    if (!user) {
      return null;
    }

    return new User({
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      streetAndNumber: user.street_and_number,
      zipCode: user.zip_code,
      city: user.city,
      passwordHash: user.passwd_hash,
    }, user.user_id);
  }
}
