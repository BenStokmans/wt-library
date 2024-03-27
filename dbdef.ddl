CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(32) NOT NULL UNIQUE,
    passwd_hash VARCHAR(60) NOT NULL
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
    user_id INTEGER NOT NULL,
    isbn INTEGER NOT NULL,
    title VARCHAR(64) NOT NULL,
    body VARCHAR(16384),
    PRIMARY KEY (user_id, isbn),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (isbn) REFERENCES books(isbn)
);

CREATE TABLE reservations (
    res_id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    start_time INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INT) * 1000000000),
    duration INTEGER NOT NULL,
    returned BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (isbn) REFERENCES books(isbn)
)
