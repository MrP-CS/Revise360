// Shared navigation, added to every page. Highlights the current page and
// collapses to a menu button on narrow screens.
(function () {
  const LINKS = [
    { href: "index.html", label: "Home" },
    { href: "index.html#topics", label: "Topics" },
    { href: "about.html", label: "About" },
    { href: "teachers.html", label: "For teachers" },
    { href: "teacher.html", label: "Dashboard" },
    { href: "data-protection.html", label: "Data" },
    { href: "guides.html", label: "Guides" }
  ];
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  function signInLink() {
    const s = window.Store && Store.student && Store.student();
    if (s) return { href: "index.html#account", label: "Signed in: " + s.name, cls: "me" };
    return { href: "index.html#signin", label: "Sign in", cls: "cta" };
  }

  // Footer navigation, in columns, added to every page that has the site footer
  const FOOT = [
    ["Students", [["index.html", "Sign in"], ["guides.html#students", "How to use Revise 360"], ["guides.html#vr", "Using a VR headset"]]],
    ["Teachers", [["teachers.html", "For teachers"], ["signup.html", "Get a teacher key"], ["teacher.html", "Dashboard"], ["guides.html#teachers", "Teacher guide"]]],
    ["About", [["about.html", "About Revise 360"], ["about.html#faq", "FAQs"], ["mailto:hello@revise360.co.uk", "Contact"]]],
    ["Legal", [["privacy.html", "Privacy"], ["data-protection.html", "Data protection policy"], ["dpa.html", "Processing agreement"], ["terms.html", "Terms of use"]]]
  ];
  function footer() {
    const f = document.querySelector("footer.site");
    if (!f || f.querySelector(".footnav")) return;
    const nav = document.createElement("div");
    nav.className = "footnav";
    nav.innerHTML = FOOT.map(([title, links]) => `<div><h4>${title}</h4><ul>${links.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></div>`).join("");
    f.insertBefore(nav, f.firstChild);
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
  function init() { build(); footer(); gate(); }

  // Experiences are for signed-in students only
  function gate() {
    if (!document.body.classList.contains("player")) return;
    const s = window.Store && Store.student && Store.student();
    if (s) return;
    const back = encodeURIComponent(location.pathname.split("/").pop() + location.search);
    location.replace("index.html?next=" + back + "#signin");
  }

  document.readyState === "loading" ? addEventListener("DOMContentLoaded", init) : init();
  window.R360Nav = { refresh: () => { const n = document.querySelector("header .nav"); if (n) n.remove(); build(); }, footer };
})();
