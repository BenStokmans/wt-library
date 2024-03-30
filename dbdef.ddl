CREATE TABLE users (
    user_id CHAR(36) PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(320) NOT NULL UNIQUE,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    street_and_number VARCHAR(128) NOT NULL,
    zip_code CHAR(6) NOT NULL CHECK (zip_code REGEXP '^[1-9][0-9]{3}[A-Z]{2}$'),
    city VARCHAR(128) NOT NULL,
    passwd_hash CHAR(60) NOT NULL
);

CREATE TABLE authors (
    author_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    wikipedia_url VARCHAR(512)
);

CREATE TABLE books (
    isbn INTEGER PRIMARY KEY,
    author_id INTEGER NOT NULL,
    title VARCHAR(128) NOT NULL,
    cover_image_url VARCHAR(512),
    description VARCHAR(4096),
    FOREIGN KEY (author_id) REFERENCES authors(author_id)
);

CREATE TABLE reviews (
    user_id CHAR(36) NOT NULL,
    isbn INTEGER NOT NULL,
    title VARCHAR(64) NOT NULL,
    body VARCHAR(16384),
    PRIMARY KEY (user_id, isbn),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (isbn) REFERENCES books(isbn)
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
