"use strict";
const elementToggleFunc = function (e) {
    e.classList.toggle("active");
  },
  sidebar = document.querySelector("[data-sidebar]"),
  sidebarBtn = document.querySelector("[data-sidebar-btn]");
sidebarBtn.addEventListener("click", function () {
  elementToggleFunc(sidebar);
});
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]"),
  modalContainer = document.querySelector("[data-modal-container]"),
  modalCloseBtn = document.querySelector("[data-modal-close-btn]"),
  overlay = document.querySelector("[data-overlay]"),
  modalImg = document.querySelector("[data-modal-img]"),
  modalTitle = document.querySelector("[data-modal-title]"),
  modalText = document.querySelector("[data-modal-text]"),
  select = document.querySelector("[data-select]"),
  selectItems = document.querySelectorAll("[data-select-item]"),
  selectValue = document.querySelector("[data-selecct-value]"),
  filterBtn = document.querySelectorAll("[data-filter-btn]");
try {
  select.addEventListener("click", function () {
    elementToggleFunc(this);
  });
} catch {}
for (let e = 0; e < selectItems.length; e++)
  selectItems[e].addEventListener("click", function () {
    let t = this.innerText.toLowerCase();
    (selectValue.innerText = this.innerText),
      elementToggleFunc(select),
      filterFunc(t);
  });
const filterItems = document.querySelectorAll("[data-filter-item]"),
  filterFunc = function (e) {
    for (let t = 0; t < filterItems.length; t++)
      e === "all" || e === filterItems[t].dataset.category
        ? filterItems[t].classList.add("active")
        : filterItems[t].classList.remove("active");
  };
let lastClickedBtn = filterBtn[0];
for (let e = 0; e < filterBtn.length; e++)
  filterBtn[e].addEventListener("click", function () {
    let t = this.innerText.toLowerCase();
    (selectValue.innerText = this.innerText),
      filterFunc(t),
      lastClickedBtn.classList.remove("active"),
      this.classList.add("active"),
      (lastClickedBtn = this);
  });
const form = document.querySelector("[data-form]"),
  formInputs = document.querySelectorAll("[data-form-input]"),
  formBtn = document.querySelector("[data-form-btn]");
for (let e = 0; e < formInputs.length; e++)
  formInputs[e].addEventListener("input", function () {
    form.checkValidity()
      ? formBtn.removeAttribute("disabled")
      : formBtn.setAttribute("disabled", "");
  });
const navigationLinks = document.querySelectorAll("[data-nav-link]"),
  pages = document.querySelectorAll("[data-page]");
for (let e = 0; e < navigationLinks.length; e++)
  navigationLinks[e].addEventListener("click", function () {
    for (let t = 0; t < pages.length; t++)
      this.innerHTML.toLowerCase() === pages[t].dataset.page
        ? (pages[t].classList.add("active"),
          navigationLinks[t].classList.add("active"),
          window.scrollTo(0, 0))
        : (pages[t].classList.remove("active"),
          navigationLinks[t].classList.remove("active"));
  });
