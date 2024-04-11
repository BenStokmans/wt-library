/**
 * Handles pagination and loading of books from the API.
 * @module Index
 */

import { Author, Book } from "./common.js";

/** The current page number */
let page = 0;

/** The maximum number of pages available */
let maxPages = 0;

/**
 * Moves to the next page of books.
 * @async
 */
async function next() {
  if (page === maxPages) return;
  page++;
  await loadPage();
}

/**
 * Moves to the previous page of books.
 * @async
 */
async function previous() {
  if (page === 0) return;
  page--;
  await loadPage();
}

/**
 * Loads a page of books from the API.
 * @async
 */
async function loadPage() {
  // Fetch data from the API
  const response = await fetch("/api/books?page=" + page);
  const resp = await response.json();

  // Calculate the maximum number of pages
  maxPages = parseInt(resp.total_pages) - 1;

  let books = [];
  // Parse raw book data into Book objects
  for (let rawBook of resp.books) {
    books.push(new Book(
        rawBook.isbn,
        rawBook.title,
        rawBook.cover_img_url,
        new Author(
            rawBook.author.id,
            rawBook.author.first_name,
            rawBook.author.last_name,
            rawBook.author.alias
        )
    ));
  }

  // Update pagination UI
  let pagination = document.getElementById("pagination");
  for (let el of pagination.querySelectorAll(".page-selector")) {
    pagination.removeChild(el);
  }

  let next = document.getElementById("next");
  pagination.removeChild(next);

  // Generate page selectors
  for (let i = 0; i < resp.total_pages; i++) {
    let selector = document.createElement("a");
    selector.className = "page-selector";
    if (i === page) {
      selector.className += " active";
    }
    selector.onclick = async () => {
      page = i;
      await loadPage();
    };
    selector.innerText = (i + 1).toString();
    pagination.appendChild(selector);
  }

  pagination.appendChild(next);

  // Update catalog UI
  let main = document.querySelector("main");
  let catalog = document.getElementById("catalog");
  main.removeChild(catalog);

  catalog = document.createElement("section");
  catalog.id = "catalog";
  catalog.className = "catalog";

  // Render books in the catalog
  for (let book of books) {
    let card = document.createElement("article");
    card.className = "catalog__book-card";
    card.onclick = () => { window.location.href = "/book/" + book.isbn; };

    let img = document.createElement("img");
    img.src = book.cover_img;
    card.appendChild(img);
    let title = document.createElement("h4");
    title.innerText = book.title;
    card.appendChild(title);

    let author = document.createElement("p");
    author.innerText = "by ";
    if (!book.author.alias) {
      author.innerText += book.author.first_name + " " + book.author.last_name;
    } else {
      author.innerText += book.author.alias;
    }

    card.appendChild(author);
    catalog.appendChild(card);
  }
  main.appendChild(catalog);

  // Update URL with current page
  window.history.replaceState(null, document.title, "?page=" + page);
}

/**
 * Loads the initial page when the window is loaded.
 * @async
 */
window.onload = async function () {
  page = 0;
  const pageParam = new URLSearchParams(window.location.search).get("page");
  if (pageParam) page = parseInt(pageParam);
  if (isNaN(page)) page = 0;

  // Attach event listeners to pagination buttons
  document.getElementById("next").onclick = next;
  document.getElementById("previous").onclick = previous;

  // Load initial page
  await loadPage();
};
