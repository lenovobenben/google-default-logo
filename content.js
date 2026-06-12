(() => {
  const MARK = "data-google-default-logo";
  const HIDDEN_MARK = "data-google-default-logo-hidden";
  const LOGO_URL = chrome.runtime.getURL("assets/google-logo.svg");
  const TARGET_HOSTS = new Set(["www.google.com"]);
  const TARGET_PATHS = new Set(["/", "/search"]);

  if (!TARGET_HOSTS.has(location.hostname) || !TARGET_PATHS.has(location.pathname)) {
    return;
  }

  let pending = false;
  let observer = null;
  let prehideStyle = null;
  let testDoodleInserted = false;

  function installPrehideStyle() {
    if (prehideStyle || !document.documentElement) {
      return;
    }

    prehideStyle = document.createElement("style");
    prehideStyle.setAttribute("data-google-default-logo-style", "1");
    prehideStyle.textContent = `
      img[data-google-default-logo="1"] {
        display: inline-block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      img.lnXdp:not([data-google-default-logo="1"]),
      img[alt="Google"]:not([data-google-default-logo="1"]),
      svg[aria-label="Google"],
      a[href*="/doodles/"] img:not([data-google-default-logo="1"]),
      a[href*="/doodles/"] svg,
      a[href*="/doodles/"] canvas,
      #hplogo:not([data-google-default-logo="container"]) > * {
        visibility: hidden !important;
      }
    `;
    document.documentElement.append(prehideStyle);
  }

  function pageKind() {
    return location.pathname === "/search" ? "search" : "home";
  }

  function logoSize(element) {
    const kind = pageKind();
    const rect = element.getBoundingClientRect();
    const fallback = kind === "search"
      ? { width: 92, height: 30 }
      : { width: 272, height: 92 };

    const width = rect.width >= 40 && rect.width <= 500 ? Math.round(rect.width) : fallback.width;
    const height = rect.height >= 20 && rect.height <= 200 ? Math.round(rect.height) : fallback.height;

    return { width, height };
  }

  function createLogoFor(element) {
    const { width, height } = logoSize(element);
    const logo = document.createElement("img");

    logo.src = LOGO_URL;
    logo.alt = "Google";
    logo.decoding = "async";
    logo.setAttribute(MARK, "1");
    logo.style.display = "inline-block";
    logo.style.width = `${width}px`;
    logo.style.height = `${height}px`;
    logo.style.maxWidth = "100%";
    logo.style.objectFit = "contain";
    logo.style.verticalAlign = "middle";

    return logo;
  }

  function isOwnLogo(element) {
    return element instanceof Element && element.getAttribute(MARK) === "1";
  }

  function hideOriginal(element) {
    element.setAttribute(HIDDEN_MARK, "1");
    element.style.setProperty("display", "none", "important");
    element.style.setProperty("visibility", "hidden", "important");
  }

  function hasReplacementSibling(element) {
    const previous = element.previousElementSibling;
    const next = element.nextElementSibling;

    return isOwnLogo(previous) || isOwnLogo(next);
  }

  function replaceElement(element) {
    if (!(element instanceof Element) || isOwnLogo(element)) {
      return false;
    }

    if (element.getAttribute(HIDDEN_MARK) === "1" && hasReplacementSibling(element)) {
      return false;
    }

    element.insertAdjacentElement("beforebegin", createLogoFor(element));
    hideOriginal(element);
    return true;
  }

  function replaceContainer(container) {
    if (!(container instanceof Element) || isOwnLogo(container)) {
      return false;
    }

    if (container.querySelector(`[${MARK}="1"]`)) {
      return false;
    }

    const logo = createLogoFor(container);
    const link = container.matches("a") ? container : container.querySelector("a[href*='/doodles/']");

    if (link) {
      link.replaceChildren(logo);
    } else {
      container.replaceChildren(logo);
    }

    container.setAttribute(MARK, "container");
    return true;
  }

  function isLikelyAccountImage(image) {
    const alt = image.getAttribute("alt") || "";
    const src = image.currentSrc || image.src || "";

    return /account|profile|avatar/i.test(alt) || /\/ogw\//.test(src);
  }

  function replaceImageLogo(image) {
    if (!(image instanceof HTMLImageElement) || isOwnLogo(image) || isLikelyAccountImage(image)) {
      return false;
    }

    const alt = image.getAttribute("alt") || "";
    const src = image.currentSrc || image.src || "";
    const className = image.className || "";
    const isKnownLogo =
      alt === "Google" ||
      /\blnXdp\b/.test(className) ||
      /\/logos\/|\/doodles\//.test(src);

    return isKnownLogo ? replaceElement(image) : false;
  }

  function replaceSvgLogo(svg) {
    if (!(svg instanceof SVGElement) || isOwnLogo(svg)) {
      return false;
    }

    const label = svg.getAttribute("aria-label") || "";
    const isKnownLogo = label === "Google" || Boolean(svg.closest("a[href*='/doodles/']"));

    return isKnownLogo ? replaceElement(svg) : false;
  }

  function replaceLogo() {
    document.querySelectorAll("img").forEach(replaceImageLogo);
    document.querySelectorAll("svg[aria-label='Google'], a[href*='/doodles/'] svg").forEach(replaceSvgLogo);
    document.querySelectorAll("#hplogo, a[href*='/doodles/']").forEach(replaceContainer);
  }

  function shouldInsertTestDoodle() {
    return new URLSearchParams(location.search).get("gdl_test_doodle") === "1";
  }

  function findTestDoodleHost() {
    const ownLogo = document.querySelector(`img[${MARK}="1"]`);
    const homeLogo = document.querySelector("img.lnXdp, svg[aria-label='Google'], #hplogo");
    const searchLogo = document.querySelector("a[href*='/doodles/'], a[aria-label='Go to Google Home']");

    return ownLogo?.parentElement || homeLogo?.parentElement || searchLogo?.parentElement || null;
  }

  function insertTestDoodle() {
    if (testDoodleInserted || !shouldInsertTestDoodle()) {
      return;
    }

    const host = findTestDoodleHost();

    if (!host) {
      return;
    }

    testDoodleInserted = true;
    host.replaceChildren();

    const link = document.createElement("a");
    link.href = "/doodles/google-default-logo-extension-test";
    link.setAttribute("aria-label", "Google Doodle test");
    link.innerHTML = `
      <svg aria-label="Google" width="272" height="92" viewBox="0 0 272 92">
        <rect width="272" height="92" rx="12" fill="#fbbc05"></rect>
        <text x="136" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#202124">DOODLE</text>
      </svg>
    `;

    host.append(link);
  }

  function scheduleReplace() {
    if (pending) {
      return;
    }

    pending = true;
    window.setTimeout(() => {
      pending = false;
      replaceLogo();
    }, 100);
  }

  function start() {
    if (!document.documentElement) {
      window.setTimeout(start, 0);
      return;
    }

    installPrehideStyle();
    insertTestDoodle();
    replaceLogo();

    if (!observer) {
      observer = new MutationObserver(scheduleReplace);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  start();
})();
