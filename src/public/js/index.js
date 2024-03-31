import { Author, Book } from "./common.js";

let page = 0;
let maxPages = 0;

async function next() {
    console.log(maxPages);
    if (page === maxPages) return;
    page++;
    await loadPage();
}

async function previous() {
    if (page === 0) return;
    page--;
    await loadPage();
}

async function loadPage() {
    const response = await fetch("/api/books?page=" + page);
    const resp = await response.json();

    maxPages = parseInt(resp.total_pages) - 1;

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

    let main = document.querySelector("main");
    let catalog = document.getElementById("catalog");
    main.removeChild(catalog);

    catalog = document.createElement("section");
    catalog.id = "catalog";
    catalog.className = "catalog";

    for (let book of books) {
        let card = document.createElement("article");
        card.className = "catalog__book-card";
        let link = document.createElement("a");
        link.href = "/book/" + book.isbn;

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
    main.appendChild(catalog)

    window.history.replaceState(null, document.title, "?page=" + page);
}

window.onload = async function () {
    page = 0;
    const pageParam = new URLSearchParams(window.location.search).get('page');
    if (pageParam) page = parseInt(pageParam);
    if (isNaN(page)) page = 0;

    document.getElementById("next").onclick = next;
    document.getElementById("previous").onclick = previous;

    await loadPage();
}