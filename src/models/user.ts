/**
 * Represents a user entity.
 */
import { v4 as uuidv4 } from "uuid";
import type { Database } from "sqlite";

/**
 * Options for creating a user.
 */
export interface UserOpts {
  /** The username of the user. */
  username: string;
  /** The email address of the user. */
  email: string;
  /** The first name of the user. */
  firstName: string;
  /** The last name of the user. */
  lastName: string;
  /** The street and number of the user's address. */
  streetAndNumber: string;
  /** The ZIP code of the user's address. */
  zipCode: string;
  /** The city of the user's address. */
  city: string;
  /** The hashed password of the user. */
  passwordHash: string;
}

export class User {
  /** The unique identifier of the user. */
  public id: string;
  /** The username of the user. */
  public username: string;
  /** The email address of the user. */
  public email: string;
  /** The first name of the user. */
  public firstName: string;
  /** The last name of the user. */
  public lastName: string;
  /** The street and number of the user's address. */
  public streetAndNumber: string;
  /** The ZIP code of the user's address. */
  public zipCode: string;
  /** The city of the user's address. */
  public city: string;
  /** The hashed password of the user. */
  public passwordHash: string;

  /**
   * Constructs a new User object.
   * @param opts Options for creating the user.
   * @param id Optional. The unique identifier of the user. Defaults to a generated UUID.
   */
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

  /**
   * Creates a new user record in the database.
   * @param user The user object to be created.
   * @param db The database connection.
   * @returns A Promise that resolves to true if the user was successfully created, otherwise false.
   */
  static async create(user: User, db: Database): Promise<boolean> {
    const result = await db.run(
      "INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      user.id, user.username, user.email, user.firstName, user.lastName, user.streetAndNumber, user.zipCode, user.city, user.passwordHash
    );

    return result.lastID != null;
  }

  /**
   * Retrieves a user from the database by username.
   * @param username The username of the user to retrieve.
   * @param db The database connection.
   * @returns A Promise that resolves to the retrieved User object, or null if not found.
   */
  static async getByUsername(username: string, db: Database): Promise<User | null>
  { return this.getUser(db, "SELECT * FROM users WHERE username = ?", username); }

  /**
   * Retrieves a user from the database by email address.
   * @param email The email address of the user to retrieve.
   * @param db The database connection.
   * @returns A Promise that resolves to the retrieved User object, or null if not found.
   */
  static async getByEmail(email: string, db: Database): Promise<User | null>
  { return this.getUser(db, "SELECT * FROM users WHERE email = ?", email); }

  /**
   * Retrieves a user from the database by user ID.
   * @param id The unique identifier of the user to retrieve.
   * @param db The database connection.
   * @returns A Promise that resolves to the retrieved User object, or null if not found.
   */
  static async getById(id: string, db: Database): Promise<User | null>
  { return this.getUser(db, "SELECT * FROM users WHERE user_id = ?", id); }

  /**
   * Retrieves a user from the database using a custom query and parameters.
   * @param db The database connection.
   * @param query The SQL query to execute.
   * @param params Additional parameters for the query.
   * @returns A Promise that resolves to the retrieved User object if found, otherwise null.
   */
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

  /** Regular expression for validating ZIP codes. */
  private static zipCodeRegExp = new RegExp("^[1-9][0-9]{3}[a-zA-Z]{2}$");
  /** Regular expression for validating email addresses. */
  // sourced from http://emailregex.com/
  private static emailRegexp = new RegExp("(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])");

  /**
   * Verifies the provided user options.
   * @param opts The user options to verify.
   * @returns An Error object if any verification fails, otherwise null.
   */
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
