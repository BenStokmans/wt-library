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
      "INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      user.id, user.username, user.email, user.firstName, user.lastName, user.streetAndNumber, user.zipCode, user.city, user.passwordHash
    );

    return result.lastID != null;
  }

  static async getByUsername(username: string, db: Database): Promise<User | null>
  { return this.getUser(db, "SELECT * FROM users WHERE username = ?", username); }

  static async getByEmail(email: string, db: Database): Promise<User | null>
  { return this.getUser(db, "SELECT * FROM users WHERE email = ?", email); }

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

  private static zipCodeRegExp = new RegExp("^[1-9][0-9]{3}[a-zA-Z]{2}$");
  // sourced from http://emailregex.com/
  private static emailRegexp = new RegExp("(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])");

  static verifyOpts(opts: UserOpts): Error | null {
    if (opts.username.length > 32) {
      return new Error("maximum username length exceeded");
    }
    if (!this.emailRegexp.test(opts.email)) {
      return new Error("invalid email address");
    }
    if (opts.email.length > 320) {
      return new Error("maximum email length exceeded");
    }
    if (opts.firstName.length > 32) {
      return new Error("maximum first name length exceeded");
    }
    if (opts.lastName.length > 32) {
      return new Error("maximum last name length exceeded");
    }
    if (opts.streetAndNumber.length > 128) {
      return new Error("maximum address line length exceeded");
    }
    if (!this.zipCodeRegExp.test(opts.zipCode)) {
      return new Error("invalid zip code");
    }
    if (opts.streetAndNumber.length > 128) {
      return new Error("maximum city name length exceeded");
    }
    return null;
  }
}
