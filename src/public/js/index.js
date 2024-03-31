import { Author, Book } from "./common.js";

let page = 0;

async function loadPage() {
    const response = await fetch("/api/books?page=" + page);
    const resp = await response.json();
    console.log(`${resp.page}/${resp.total_pages}`)
    let books = [];
    for (let rawBook of resp.books) {
        books.push(new Book(rawBook.isbn, rawBook.title, rawBook.cover_img_url, new Author(rawBook.author.id, rawBook.author.first_name, rawBook.author.last_name, rawBook.author.alias)));
    }

    let pagination = document.getElementById("pagination");
    for (let el of pagination.querySelectorAll(".page-selector")) {
        pagination.removeChild(el);
    }

    // remove next and add it back after to ensure the right order
    let next = document.getElementById("next");
    pagination.removeChild(next);

    for (let i = 0; i < resp.total_pages; i++) {
        let selector = document.createElement("a");
        selector.className = "page-selector";
        if (i === page) {
            selector.className += " active"
        }
        selector.onclick = async () => {
            page = i
            await loadPage();
        }
        selector.innerText = (i+1).toString();
        pagination.appendChild(selector);
    }

    pagination.appendChild(next);

    let catalog = document.getElementById("catalog");
    for (let child of catalog.children) {
        catalog.removeChild(child);
    }

    for (let book of books) {
        let card = document.createElement("article");
        card.className = "catalog__book-card";
        let link = document.createElement("a");
        link.href = "/books/" + book.isbn;

        let img = document.createElement("img");
        img.src = book.cover_img;
        link.appendChild(img);
        let title = document.createElement("h4");
        title.innerText = book.title;
        link.appendChild(title);

        card.appendChild(link);
        let author = document.createElement("p");
        author.innerText = "by ";
        if (!book.author.alias) {
            author.innerText += book.author.first_name + " " + book.author.last_name;
        } else {
            author.innerText += book.author.alias
        }

        card.appendChild(author)
        catalog.appendChild(card);
    }

    console.log(books);
}

window.onload = async function () {
    page = 0;
    await loadPage();
}