"use strict";

export class Author {
    constructor(id, first_name, last_name, alias) {
        this.id = id; // int
        this.first_name = first_name; // string
        this.last_name = last_name; // string
        this.alias = alias; // string
    }
}

export class Book {
    constructor(isbn, title, cover_img, author) {
        this.isbn = isbn; // string
        this.title = title; // string
        this.cover_img = cover_img; // string
        this.author = author; // Author
    }
}