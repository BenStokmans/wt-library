/**
 * This file contains JavaScript code to handle the functionality of the hamburger menu.
 */
"use strict";

// Adds a click event listener to the hamburger icon to toggle the visibility of the hamburger menu.
document.getElementById("hamburger-icon").addEventListener("click", function() {
  document.getElementById("hamburger-menu").classList.toggle("open");
});