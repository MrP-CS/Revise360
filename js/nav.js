// Shared navigation, added to every page. Highlights the current page and
// collapses to a menu button on narrow screens.
(function () {
  const LINKS = [
    { href: "index.html", label: "Home" },
    { href: "index.html#topics", label: "Topics" },
    { href: "about.html", label: "About" },
    { href: "teachers.html", label: "For teachers" },
    { href: "teacher.html", label: "Dashboard" },
    { href: "data-protection.html", label: "Data" }
  ];
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  function signInLink() {
    const s = window.Store && Store.student && Store.student();
    if (s) return { href: "index.html#account", label: "Signed in: " + s.name, cls: "me" };
    return { href: "index.html#signin", label: "Sign in", cls: "cta" };
  }

  function build() {
    const bar = document.querySelector("header.bar, header.top");
    if (!bar || bar.querySelector(".nav")) return;
    const links = LINKS.concat([signInLink()]);
    const nav = document.createElement("nav");
    nav.className = "nav";
    nav.innerHTML = `
      <button class="navbtn" aria-expanded="false" aria-controls="navlinks" aria-label="Menu">☰</button>
      <ul id="navlinks">${links.map(l => {
        const active = l.href.split("#")[0].toLowerCase() === here && !l.cls ? ' class="on"' : l.cls ? ` class="${l.cls}"` : "";
        return `<li><a href="${l.href}"${active}>${l.label}</a></li>`;
      }).join("")}</ul>`;
    bar.appendChild(nav);   // straight onto the header, so page scripts that rewrite their own areas can't wipe it
    const btn = nav.querySelector(".navbtn"), ul = nav.querySelector("ul");
    btn.onclick = () => { const open = ul.classList.toggle("open"); btn.setAttribute("aria-expanded", open); };
    addEventListener("click", e => { if (!nav.contains(e.target)) { ul.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
  }
  document.readyState === "loading" ? addEventListener("DOMContentLoaded", build) : build();
  window.R360Nav = { refresh: () => { const n = document.querySelector("header .nav"); if (n) n.remove(); build(); } };
})();
