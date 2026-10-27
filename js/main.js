// Perspective - comportamiento básico del sitio
document.addEventListener("DOMContentLoaded", function () {
  // Menú móvil
  var toggle = document.querySelector(".nav-toggle");
  var list = document.querySelector(".nav-list");
  if (toggle && list) {
    toggle.addEventListener("click", function () {
      var open = list.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Botón "volver arriba"
  var topBtn = document.querySelector(".back-to-top");
  if (topBtn) {
    window.addEventListener("scroll", function () {
      topBtn.classList.toggle("visible", window.scrollY > 300);
    });
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Año automático en el pie de página
  var year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
});
