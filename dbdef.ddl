PRAGMA foreign_keys = ON;

CREATE TABLE users (
    user_id CHAR(36) PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(320) NOT NULL UNIQUE,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    street_and_number VARCHAR(128) NOT NULL,
    zip_code CHAR(6) NOT NULL,
    city VARCHAR(128) NOT NULL,
    passwd_hash CHAR(60) NOT NULL
);

CREATE TABLE authors (
    author_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    alias VARCHAR(128),
    summary VARCHAR(4096),
    portrait_url VARCHAR(512),
    wikipedia_url VARCHAR(512)
);

CREATE TABLE books (
    isbn INTEGER PRIMARY KEY,
    author_id INTEGER NOT NULL,
    title VARCHAR(128) NOT NULL,
    copies INTEGER NOT NULL CHECK (copies>=0),
    cover_image_url VARCHAR(512),
    description VARCHAR(4096),
    FOREIGN KEY (author_id) REFERENCES authors(author_id)
);

CREATE TABLE reservations (
    res_id CHAR(36) PRIMARY KEY,
    isbn INTEGER NOT NULL,
    user_id CHAR(36) NOT NULL,
    start_time INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INT) * 1000000000),
    duration INTEGER NOT NULL,
    returned BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (isbn) REFERENCES books(isbn)
)
