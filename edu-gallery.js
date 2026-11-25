(function () {
  const root = document.querySelector("[data-edu-gallery]");
  if (!root) return;

  const thumbs = [...root.querySelectorAll(".edu-thumb")];
  const items = thumbs.map((button) => ({
    type: button.dataset.type === "video" ? "video" : "image",
    src: button.dataset.src || "",
    alt: button.dataset.alt || "",
    fit: button.dataset.fit === "contain" ? "contain" : ""
  }));
  if (!items.length) return;

  const stageImage = root.querySelector("[data-edu-image]");
  const stageVideo = root.querySelector("[data-edu-video]");
  const imageButton = root.querySelector(".edu-image-btn");
  const caption = root.querySelector("[data-edu-caption]");
  const dialog = root.querySelector(".edu-lightbox");
  const dialogImage = root.querySelector("[data-edu-dialog-image]");
  const dialogVideo = root.querySelector("[data-edu-dialog-video]");
  const dialogCaption = root.querySelector("[data-edu-dialog-caption]");
  const steps = [...root.querySelectorAll("[data-edu-prev], [data-edu-next]")];
  const strip = root.querySelector(".edu-strip");
  let index = 0;

  function pause(video) {
    if (video && !video.paused) video.pause();
  }

  function clearVideo(video) {
    pause(video);
    if (video.getAttribute("src")) {
      video.removeAttribute("src");
      video.load();
    }
  }

  function setVideo(video, src) {
    if (video.getAttribute("src") !== src) {
      pause(video);
      video.setAttribute("src", src);
      video.load();
    }
  }

  function labelFor(item, position) {
    const kind = item.type === "video" ? "Video" : "Photo";
    return kind + " · " + position + " of " + items.length;
  }

  const fitTokens = new WeakMap();

  function fitImage(image, fit) {
    const token = (fitTokens.get(image) || 0) + 1;
    fitTokens.set(image, token);
    const apply = () => {
      if (fitTokens.get(image) !== token) return;
      image.classList.remove("is-portrait", "is-landscape", "is-contain");
      if (fit === "contain") {
        image.classList.add("is-contain");
        return;
      }
      if (!image.naturalWidth) return;
      const portrait = image.naturalHeight > image.naturalWidth;
      image.classList.add(portrait ? "is-portrait" : "is-landscape");
    };
    if (image.complete && image.naturalWidth) apply();
    else {
      image.classList.remove("is-portrait", "is-landscape", "is-contain");
      image.addEventListener("load", apply, { once: true });
    }
  }

  function paint(image, video, item) {
    const isVideo = item.type === "video";
    image.hidden = isVideo;
    video.hidden = !isVideo;
    if (isVideo) {
      image.removeAttribute("src");
      image.alt = "";
      image.classList.remove("is-portrait", "is-landscape", "is-contain");
      setVideo(video, item.src);
    } else {
      clearVideo(video);
      image.src = item.src;
      image.alt = item.alt;
      fitImage(image, item.fit);
    }
  }

  function show(next) {
    const count = items.length;
    index = (next + count) % count;
    const item = items[index];
    const label = labelFor(item, index + 1);
    const dialogOpen = dialog.open;

    if (dialogOpen) {
      pause(stageVideo);
      clearVideo(stageVideo);
      paint(dialogImage, dialogVideo, item);
    } else {
      pause(dialogVideo);
      clearVideo(dialogVideo);
      paint(stageImage, stageVideo, item);
      if (imageButton) {
        imageButton.hidden = item.type === "video";
        imageButton.setAttribute("aria-label", "View larger. " + label);
      }
    }

    caption.textContent = label;
    dialogCaption.textContent = label;
    thumbs.forEach((button, thumbIndex) => {
      button.setAttribute("aria-current", thumbIndex === index ? "true" : "false");
    });
    steps.forEach((button) => {
      button.hidden = count < 2;
    });

    const currentThumb = thumbs[index];
    if (strip && currentThumb) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const target = currentThumb.closest("li") || currentThumb;
      const left = target.offsetLeft - (strip.clientWidth - target.clientWidth) / 2;
      strip.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
    }
  }

  thumbs.forEach((button, thumbIndex) => {
    button.addEventListener("click", () => show(thumbIndex));
  });

  root.querySelectorAll("[data-edu-prev]").forEach((button) => {
    button.addEventListener("click", () => show(index - 1));
  });
  root.querySelectorAll("[data-edu-next]").forEach((button) => {
    button.addEventListener("click", () => show(index + 1));
  });

  root.querySelectorAll("[data-edu-open]").forEach((button) => {
    button.addEventListener("click", () => {
      pause(stageVideo);
      clearVideo(stageVideo);
      paint(dialogImage, dialogVideo, items[index]);
      dialog.showModal();
    });
  });

  root.querySelector("[data-edu-close]").addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    pause(dialogVideo);
    clearVideo(dialogVideo);
    paint(stageImage, stageVideo, items[index]);
    if (imageButton) imageButton.hidden = items[index].type === "video";
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("video, input, textarea")) return;
    event.preventDefault();
    show(index + (event.key === "ArrowRight" ? 1 : -1));
  });

  show(0);
})();
