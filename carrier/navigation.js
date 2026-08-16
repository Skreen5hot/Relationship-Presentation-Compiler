(() => {
  "use strict";

  const main = document.querySelector("main");
  if (main === null) {
    return;
  }

  const slides = Array.from(main.children).filter(
    (element) => element.tagName === "SECTION",
  );
  if (slides.length === 0) {
    return;
  }

  let slideIndex = slides.findIndex((slide) => !slide.hasAttribute("hidden"));
  if (slideIndex === -1) {
    slideIndex = 0;
    slides[0].removeAttribute("hidden");
  }

  main.addEventListener("click", (event) => {
    const control = event.target.closest("button[data-intent]");
    if (control === null || !main.contains(control)) {
      return;
    }

    const intent = control.getAttribute("data-intent");
    let nextIndex = slideIndex;
    if (intent === "advance") {
      nextIndex = Math.min(slideIndex + 1, slides.length - 1);
    } else if (intent === "back") {
      nextIndex = Math.max(slideIndex - 1, 0);
    } else {
      return;
    }

    if (nextIndex === slideIndex) {
      return;
    }

    for (let index = 0; index < slides.length; index += 1) {
      slides[index].toggleAttribute("hidden", index !== nextIndex);
    }
    slideIndex = nextIndex;

    const heading = slides[slideIndex].querySelector("h1, h2");
    if (heading !== null) {
      heading.focus();
    }
  });
})();
