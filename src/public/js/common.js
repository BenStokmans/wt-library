/**
 * @file Defines classes representing authors and books.
 * @module Common
 */
"use strict";

/**
 * Represents an author.
 * @class
 */
export class Author {
  /**
   * Creates an instance of Author.
   * @param {number} id - The ID of the author.
   * @param {string} first_name - The first name of the author.
   * @param {string} last_name - The last name of the author.
   * @param {string} alias - The alias of the author.
   */
  constructor(id, first_name, last_name, alias) {
    /**
     * The ID of the author.
     * @type {number}
     */
    this.id = id;

    /**
     * The first name of the author.
     * @type {string}
     */
    this.first_name = first_name;

    /**
     * The last name of the author.
     * @type {string}
     */
    this.last_name = last_name;

    /**
     * The alias of the author.
     * @type {string}
     */
    this.alias = alias;
  }
}

/**
 * Represents a book.
 * @class
 */
export class Book {
  /**
   * Creates an instance of Book.
   * @param {number} isbn - The ISBN of the book.
   * @param {string} title - The title of the book.
   * @param {string} cover_img - The cover image URL of the book.
   * @param {Author} author - The author of the book.
   */
  constructor(isbn, title, cover_img, author) {
    /**
     * The ISBN of the book.
     * @type {number}
     */
    this.isbn = isbn;

    /**
     * The title of the book.
     * @type {string}
     */
    this.title = title;

    /**
     * The cover image URL of the book.
     * @type {string}
     */
    this.cover_img = cover_img;

    /**
     * The author of the book.
     * @type {Author}
     */
    this.author = author;
  }
}
