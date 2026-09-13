/**
 * VOIR Homepage — Cinematic Redesign Animation Engine
 * Uses GSAP + ScrollTrigger (loaded globally) + IntersectionObserver
 */
(function () {
  "use strict";

  /* Exit if not the homepage */
  const isHome =
    !location.pathname.split("/").pop() ||
    location.pathname.split("/").pop().toLowerCase() === "index.html";
  if (!isHome) return;

  /* Add page-home class for CSS overrides */
  document.body.classList.add("page-home");

  const prefersReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------
     HERO — Cinematic living-room entrance
  ---------------------------------------- */

  function initVoirHero() {
    var section = document.querySelector(".voir-hero");
    if (!section) return;

    var media = section.querySelector(".voir-hero__media");
    var slides = Array.from(section.querySelectorAll(".voir-hero__slide"));
    var copy = section.querySelector(".voir-hero__copy");
    var rail = section.querySelector(".voir-hero__rail");
    var progress = section.querySelector(".voir-hero__progress");
    var scroll = section.querySelector(".voir-hero__scroll");
    var nav = document.querySelector(".nav.nav--hero");
    var fill = section.querySelector(".voir-hero__progress-fill");
    var knob = section.querySelector(".voir-hero__progress-knob");
    var playBtn = section.querySelector(".voir-hero__progress-play");
    var currentEl = section.querySelector(".voir-hero__progress-current");
    var totalEl = section.querySelector(".voir-hero__progress-total");

    /* GSAP Entrance & Scroll Animations */
    if (!prefersReduced) {
      if (nav) {
        gsap.set(nav, { opacity: 0, y: -12 });
      }

      var tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.15,
      });

      if (nav) {
        tl.to(nav, { opacity: 1, y: 0, duration: 0.9, ease: "power4.out" }, 0);
      }
      if (copy) {
        tl.to(copy, { opacity: 1, y: 0, duration: 1.1, ease: "power4.out" }, 0.18);
      }
      if (rail) {
        tl.to(rail, { opacity: 1, x: 0, duration: 0.95, ease: "power3.out" }, 0.45);
      }
      if (progress) {
        tl.to(progress, { opacity: 1, y: 0, duration: 0.75 }, 0.7);
      }
      if (scroll) {
        tl.to(scroll, { opacity: 1, y: 0, duration: 0.75 }, 0.8);
      }

      if (media && typeof ScrollTrigger !== "undefined") {
        gsap.to(media, {
          y: 40,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1.4,
          },
        });
      }
    } else {
      [copy, rail, progress, scroll].forEach(function (el) {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
      if (nav) nav.style.opacity = "1";
    }

    /* Cinematic video slide engine (v1–v4) */
    if (!slides.length) return;

    var videos = slides.map(function (slide) {
      return slide.querySelector("video");
    });
    var totalSlides = slides.length;
    var currentIndex = 0;
    var FALLBACK_DURATION = 8000;
    var elapsedInSlide = 0;
    var isPlaying = true;
    var lastTimestamp = null;
    var rafId = null;

    if (totalEl) {
      totalEl.textContent = String(totalSlides).padStart(2, "0");
    }

    function formatNumber(num) {
      return String(num + 1).padStart(2, "0");
    }

    function getSlideDuration(index) {
      var video = videos[index];
      if (video && isFinite(video.duration) && video.duration > 0) {
        return video.duration * 1000;
      }
      return FALLBACK_DURATION;
    }

    function tryPlayVideo(video) {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      var playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch(function () {});
      }
    }

    function setActiveSlide(index) {
      slides.forEach(function (slide, idx) {
        var video = videos[idx];
        if (idx === index) {
          slide.classList.add("is-active");
          if (video) {
            try {
              video.currentTime = 0;
            } catch (e) {}
            if (isPlaying) tryPlayVideo(video);
          }
        } else {
          slide.classList.remove("is-active");
          if (video) {
            video.pause();
            try {
              video.currentTime = 0;
            } catch (e) {}
          }
        }
      });
      if (currentEl) {
        currentEl.textContent = formatNumber(index);
      }
    }

    function updateProgressUI(pct) {
      var clamped = Math.max(0, Math.min(100, pct));
      if (fill) fill.style.width = clamped + "%";
      if (knob) knob.style.left = clamped + "%";
    }

    function goToNextSlide() {
      elapsedInSlide = 0;
      currentIndex = (currentIndex + 1) % totalSlides;
      setActiveSlide(currentIndex);
      updateProgressUI(0);
    }

    function tick(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      var delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (isPlaying) {
        var duration = getSlideDuration(currentIndex);
        var activeVideo = videos[currentIndex];

        if (activeVideo && isFinite(activeVideo.currentTime) && activeVideo.duration > 0) {
          elapsedInSlide = activeVideo.currentTime * 1000;
          if (activeVideo.ended || activeVideo.currentTime >= activeVideo.duration - 0.05) {
            goToNextSlide();
          } else {
            updateProgressUI((elapsedInSlide / duration) * 100);
          }
        } else {
          elapsedInSlide += delta;
          if (elapsedInSlide >= duration) {
            goToNextSlide();
          } else {
            updateProgressUI((elapsedInSlide / duration) * 100);
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    videos.forEach(function (video) {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.removeAttribute("controls");
      video.addEventListener("ended", function () {
        if (!isPlaying) return;
        if (videos[currentIndex] === video) goToNextSlide();
      });
    });

    // Start tick loop
    setActiveSlide(currentIndex);
    updateProgressUI(0);
    rafId = requestAnimationFrame(tick);

    // Play/Pause button toggle
    if (playBtn) {
      playBtn.addEventListener("click", function () {
        isPlaying = !isPlaying;
        lastTimestamp = performance.now();
        var activeVideo = videos[currentIndex];

        if (isPlaying) {
          section.classList.remove("is-paused");
          tryPlayVideo(activeVideo);
          playBtn.setAttribute("aria-label", "Pause background slideshow");
          playBtn.innerHTML =
            '<svg class="voir-hero__play-icon" viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true">' +
            '<rect x="2" y="1.5" width="2.5" height="9" rx="0.5" />' +
            '<rect x="7.5" y="1.5" width="2.5" height="9" rx="0.5" />' +
            '</svg>';
        } else {
          section.classList.add("is-paused");
          if (activeVideo) activeVideo.pause();
          playBtn.setAttribute("aria-label", "Play background slideshow");
          playBtn.innerHTML =
            '<svg class="voir-hero__play-icon" viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true">' +
            '<path d="M3 1.5v9l8-4.5-8-4.5z" />' +
            '</svg>';
        }
      });
    }
  }

  /* ----------------------------------------
     BELIEF — Full-bleed cinematic video + copy
  ---------------------------------------- */

  function initBelief() {
    var section = document.querySelector(".belief");
    if (!section) return;

    var video = section.querySelector(".belief__video");
    var copy = section.querySelector(".belief__copy");
    var quote = section.querySelector(".belief__quote");

    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      video.removeAttribute("controls");

      function playBeliefVideo() {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
      }

      playBeliefVideo();

      if ("IntersectionObserver" in window) {
        var videoObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) playBeliefVideo();
              else video.pause();
            });
          },
          { threshold: 0.15 }
        );
        videoObserver.observe(section);
      }
    }

    if (prefersReduced) {
      [copy, quote].forEach(function (el) {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
      if (video) gsap.set(video, { clearProps: "transform,filter" });
      return;
    }

    if (copy) {
      gsap.fromTo(
        copy,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 1.05,
          ease: "power4.out",
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
            once: true,
          },
        }
      );
    }

    if (quote) {
      gsap.fromTo(
        quote,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.95,
          ease: "power3.out",
          delay: 0.15,
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            once: true,
          },
        }
      );
    }

    if (video) {
      gsap.fromTo(
        video,
        {
          scale: 1.05,
          yPercent: 0,
          filter: "brightness(0.92)",
        },
        {
          scale: 1.25,
          yPercent: -3,
          filter: "brightness(1.05)",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        }
      );
    }
  }

  /* ----------------------------------------
     STORY — Scroll-triggered reveals
  ---------------------------------------- */

  function initStory() {
    var section = document.querySelector(".story");
    if (!section) return;

    var heroVideo = document.getElementById("heroVideo");
    var processorVideo = document.getElementById("storyProcessorVideo");
    var whyCopy = section.querySelector(".story__why-copy");
    var pillarsBlock = section.querySelector(".story__pillars-block");
    var pillars = section.querySelectorAll(".story__pillar");
    var techCopy = section.querySelector(".story__tech-copy");
    var visual = section.querySelector(".story__visual");

    function playVideo(vid) {
      if (!vid) return;
      vid.muted = true;
      vid.setAttribute("playsinline", "");
      vid.removeAttribute("controls");
      var p = vid.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }

    function playVideos() {
      playVideo(heroVideo);
      playVideo(processorVideo);
    }

    playVideos();

    if (prefersReduced) {
      return;
    }

    if (whyCopy) {
      gsap.fromTo(
        whyCopy.children,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: whyCopy,
            start: "top 80%",
            once: true,
          },
        }
      );
    }

    if (pillars.length) {
      gsap.fromTo(
        pillars,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section.querySelector(".story__pillars") || section,
            start: "top 82%",
            once: true,
            onEnter: function () {
              playVideo(processorVideo);
            },
          },
        }
      );
    }

    if (pillarsBlock) {
      var processorStage = pillarsBlock.querySelector(".story__processor");
      if (processorStage) {
        gsap.fromTo(
          processorStage,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: pillarsBlock,
              start: "top 84%",
              once: true,
              onEnter: function () {
                playVideo(processorVideo);
              },
            },
          }
        );
      }
    }

    if (techCopy) {
      gsap.fromTo(
        techCopy.children,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: techCopy,
            start: "top 82%",
            once: true,
          },
        }
      );
    }

    if (visual) {
      gsap.fromTo(
        visual,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: visual,
            start: "top 85%",
            once: true,
            onEnter: playVideos,
          },
        }
      );

      gsap.fromTo(
        section.querySelectorAll(".story__visual-stage .story__media-video"),
        { scale: 1.08 },
        {
          scale: 1.02,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: visual,
            start: "top 85%",
            once: true,
          },
        }
      );

      var railItems = Array.prototype.slice.call(
        section.querySelectorAll(".story__rail li")
      );
      if (railItems.length) {
        ScrollTrigger.create({
          trigger: visual,
          start: "top 85%",
          once: true,
          onEnter: function () {
            railItems.forEach(function (item, index) {
              window.setTimeout(function () {
                item.classList.add("is-lit", "is-glow");
              }, index * 220);
            });
          },
        });
      }
    }
  }

  /* ----------------------------------------
     TECH SHOWCASE — Staggered reveals
  ---------------------------------------- */

  function initTechShowcase() {
    var section = document.querySelector(".tech-showcase");
    if (!section) return;

    var header = section.querySelector(".tech-showcase__header");
    var aside = section.querySelector(".tech-showcase__aside");
    var track = section.querySelector(".tech-showcase__track");
    var cards = Array.prototype.slice.call(section.querySelectorAll(".tech-showcase__card"));
    var videos = Array.prototype.slice.call(section.querySelectorAll(".tech-showcase__video"));
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var canTilt = finePointer && !prefersReduced;

    function tryPlayVideo(video) {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      var playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch(function () {});
      }
    }

    videos.forEach(function (video) {
      tryPlayVideo(video);
    });

    if ("IntersectionObserver" in window && videos.length) {
      var videoVis = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var video = entry.target.querySelector
              ? entry.target.querySelector(".tech-showcase__video")
              : null;
            if (!video) return;
            if (entry.isIntersecting) tryPlayVideo(video);
            else video.pause();
          });
        },
        { threshold: 0.25 }
      );

      cards.forEach(function (card) {
        videoVis.observe(card);
      });
    }

    function resetCardVars(card) {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--lift", "0px");
      card.style.setProperty("--card-scale", "1");
      card.style.setProperty("--card-z", card.dataset.restZ || "0px");
      card.style.setProperty("--img-shift-x", "0px");
      card.style.setProperty("--img-shift-y", "0px");
      card.style.setProperty("--label-shift-y", "0px");
      card.style.setProperty("--shine-x", "50%");
      card.style.setProperty("--shine-y", "50%");
    }

    cards.forEach(function (card, index) {
      var depth = Number(card.getAttribute("data-depth") || 1);
      var restZ = ((depth - 1.5) * 10).toFixed(1) + "px";
      card.dataset.restZ = restZ;
      resetCardVars(card);
      card.style.setProperty("--card-z", restZ);
    });

    if (prefersReduced) {
      if (header) {
        header.style.opacity = "1";
        header.style.transform = "none";
      }
      cards.forEach(function (card) {
        card.style.opacity = "1";
        card.style.transform = "none";
        resetCardVars(card);
      });
      return;
    }

    if (header) {
      gsap.fromTo(
        header,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
            once: true,
          },
        }
      );
    }

    if (aside) {
      gsap.fromTo(
        aside,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
            once: true,
          },
        }
      );
    }

    if (cards.length) {
      gsap.set(cards, {
        opacity: 0,
        y: 48,
        rotateX: 14,
        transformPerspective: 900,
      });

      cards.forEach(function (card, i) {
        gsap.set(card, { rotateY: (i - (cards.length - 1) / 2) * 7 });
      });

      gsap.to(cards, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 0.85,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: track || section,
          start: "top 80%",
          once: true,
          onComplete: function () {
            if (canTilt) {
              cards.forEach(function (card) {
                card.classList.add("is-floating");
              });
            }
          },
        },
      });
    }

    function setActive(activeCard) {
      cards.forEach(function (card) {
        var isActive = card === activeCard;
        card.classList.toggle("is-active", isActive);
        card.classList.toggle("is-dimmed", !!activeCard && !isActive);
        if (!isActive) {
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
          card.style.setProperty("--lift", "0px");
          card.style.setProperty("--card-scale", activeCard ? "0.97" : "1");
          card.style.setProperty("--card-z", activeCard ? "-28px" : card.dataset.restZ || "0px");
          card.style.setProperty("--img-shift-x", "0px");
          card.style.setProperty("--img-shift-y", "0px");
          card.style.setProperty("--label-shift-y", "0px");
        } else {
          card.style.setProperty("--card-scale", "1.06");
          card.style.setProperty("--card-z", "42px");
          card.style.setProperty("--lift", "-8px");
          card.style.setProperty("--label-shift-y", "-8px");
        }
      });
    }

    function clearActive() {
      cards.forEach(function (card) {
        card.classList.remove("is-active", "is-dimmed");
        resetCardVars(card);
      });
    }

    function updateTilt(card, clientX, clientY) {
      var rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var px = (clientX - rect.left) / rect.width;
      var py = (clientY - rect.top) / rect.height;
      var nx = Math.max(0, Math.min(1, px));
      var ny = Math.max(0, Math.min(1, py));
      var rotY = (nx - 0.5) * 14;
      var rotX = (0.5 - ny) * 10;
      var imgX = (nx - 0.5) * -10;
      var imgY = (ny - 0.5) * -8;

      card.style.setProperty("--tilt-x", rotX.toFixed(2) + "deg");
      card.style.setProperty("--tilt-y", rotY.toFixed(2) + "deg");
      card.style.setProperty("--img-shift-x", imgX.toFixed(2) + "px");
      card.style.setProperty("--img-shift-y", imgY.toFixed(2) + "px");
      card.style.setProperty("--shine-x", (nx * 100).toFixed(1) + "%");
      card.style.setProperty("--shine-y", (ny * 100).toFixed(1) + "%");
    }

    if (canTilt) {
      cards.forEach(function (card) {
        card.addEventListener("pointerenter", function () {
          card.classList.remove("is-floating");
          setActive(card);
        });

        card.addEventListener("pointermove", function (event) {
          updateTilt(card, event.clientX, event.clientY);
        });

        card.addEventListener("pointerleave", function () {
          clearActive();
          card.classList.add("is-floating");
        });

        card.addEventListener("focus", function () {
          setActive(card);
        });

        card.addEventListener("blur", function () {
          clearActive();
        });
      });
    } else if (!prefersReduced) {
      cards.forEach(function (card) {
        card.addEventListener("pointerdown", function (event) {
          setActive(card);
          updateTilt(card, event.clientX, event.clientY);
        });

        card.addEventListener("pointerup", function () {
          window.setTimeout(clearActive, 180);
        });

        card.addEventListener("pointercancel", clearActive);
        card.addEventListener("focus", function () {
          setActive(card);
        });
        card.addEventListener("blur", clearActive);
      });
    }
  }

  /* ----------------------------------------
     TV SERIES — Tab switching
  ---------------------------------------- */

  function initTvSeries() {
    var section = document.querySelector(".tv-series");
    if (!section) return;

    var track = document.getElementById("tvSeriesTrack");
    var prev = document.getElementById("tvSeriesPrev");
    var next = document.getElementById("tvSeriesNext");
    var videos = section.querySelectorAll(".tv-series__video");

    function tryPlay(video) {
      if (!video) return;
      video.muted = true;
      var p = video.play();
      if (p && typeof p.then === "function") {
        p.catch(function () {});
      }
    }

    videos.forEach(function (video) {
      tryPlay(video);
    });

    if ("IntersectionObserver" in window) {
      var vis = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var video = entry.target.querySelector
              ? entry.target.querySelector(".tv-series__video")
              : null;
            if (!video && entry.target.classList.contains("tv-series__video")) {
              video = entry.target;
            }
            if (!video) return;
            if (entry.isIntersecting) tryPlay(video);
            else video.pause();
          });
        },
        { threshold: 0.35 }
      );

      section.querySelectorAll(".tv-series__card").forEach(function (card) {
        vis.observe(card);
      });
    }

    function scrollByCard(dir) {
      if (!track) return;
      var card = track.querySelector(".tv-series__card");
      var amount = card ? card.getBoundingClientRect().width + 12 : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
    }

    if (prev) {
      prev.addEventListener("click", function () {
        scrollByCard(-1);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        scrollByCard(1);
      });
    }

    if (!prefersReduced) {
      gsap.fromTo(
        section.querySelector(".tv-series__header"),
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
          },
        }
      );

      gsap.fromTo(
        section.querySelectorAll(".tv-series__card"),
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
          },
        }
      );
    }
  }

  /* ----------------------------------------
     PROMISE — Progressive column reveal
  ---------------------------------------- */

  function initPromise() {
    var items = document.querySelectorAll(".promise-acc");
    var shots = document.querySelectorAll(".promise-v2__shot");
    if (!items.length) return;

    var activeKey = null;
    var hoverTimer = null;
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function setShot(key) {
      shots.forEach(function (shot) {
        shot.classList.toggle(
          "is-active",
          shot.getAttribute("data-promise-shot") === key
        );
      });
    }

    function openItem(target) {
      var key = target.getAttribute("data-promise");
      if (!key || key === activeKey) return;
      activeKey = key;

      items.forEach(function (item) {
        var open = item === target;
        item.classList.toggle("is-open", open);
        var btn = item.querySelector(".promise-acc__trigger");
        if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
      });

      setShot(key);
    }

    var openNow = document.querySelector(".promise-acc.is-open");
    activeKey = openNow ? openNow.getAttribute("data-promise") : null;
    if (activeKey) setShot(activeKey);

    items.forEach(function (item) {
      var btn = item.querySelector(".promise-acc__trigger");
      if (!btn) return;

      if (canHover) {
        item.addEventListener("mouseenter", function () {
          window.clearTimeout(hoverTimer);
          hoverTimer = window.setTimeout(function () {
            openItem(item);
          }, 40);
        });
      }

      btn.addEventListener("click", function () {
        if (item.classList.contains("is-open")) return;
        openItem(item);
      });

      btn.addEventListener("focus", function () {
        openItem(item);
      });
    });
  }

  /* ----------------------------------------
     BRAND FILM — Living banner modal
  ---------------------------------------- */

  function initBrandFilm() {
    var openBtn = document.getElementById("brandFilmOpen");
    var modal = document.getElementById("brandFilmModal");
    var video = document.getElementById("brandFilmVideo");
    if (!openBtn || !modal || !video) return;

    var lastFocus = null;

    function openModal() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var play = video.play();
      if (play && typeof play.catch === "function") play.catch(function () {});
      var closer = modal.querySelector("[data-brand-film-close]");
      if (closer) closer.focus();
    }

    function closeModal() {
      video.pause();
      try {
        video.currentTime = 0;
      } catch (e) {}
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    openBtn.addEventListener("click", openModal);
    modal.querySelectorAll("[data-brand-film-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  /* ----------------------------------------
     GENERIC REVEAL — data-hp-reveal
  ---------------------------------------- */

  function initReveals() {
    var els = document.querySelectorAll("[data-hp-reveal]");
    if (prefersReduced) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach(function (el) {
      obs.observe(el);
    });
  }

  /* ----------------------------------------
     FEATURE LAB — The future of colour zoom
  ---------------------------------------- */

  function initFeatureLab() {
    var section = document.querySelector(".feature-lab");
    if (!section) return;

    var title = section.querySelector(".feature-lab__title");
    var description = section.querySelector(".feature-lab__description");
    var imageWrap = section.querySelector(".feature-lab__image-wrapper");
    var image = section.querySelector(".feature-lab__image");
    var mqTablet = window.matchMedia("(max-width: 1024px)");
    var mqMobile = window.matchMedia("(max-width: 700px)");

    function imageEndScale() {
      if (mqMobile.matches) return 1.25;
      if (mqTablet.matches) return 1.35;
      return 1.52;
    }

    function wrapEndScale() {
      if (mqMobile.matches) return 1.08;
      if (mqTablet.matches) return 1.12;
      return 1.18;
    }

    if (image && image.tagName === "VIDEO") {
      image.muted = true;
      image.defaultMuted = true;
      image.setAttribute("playsinline", "");
      image.setAttribute("muted", "");
      image.removeAttribute("controls");

      function playFeatureVideo() {
        var playPromise = image.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
      }

      playFeatureVideo();

      if ("IntersectionObserver" in window) {
        var videoObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) playFeatureVideo();
              else image.pause();
            });
          },
          { threshold: 0.15 }
        );
        videoObserver.observe(section);
      }
    }

    if (prefersReduced) {
      [title, description, imageWrap].forEach(function (el) {
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
      if (image) gsap.set(image, { clearProps: "transform,filter" });
      return;
    }

    if (title) {
      gsap.to(title, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true,
        },
      });
    }

    if (description) {
      gsap.to(description, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true,
        },
      });
    }

    if (imageWrap) {
      gsap.to(imageWrap, {
        opacity: 1,
        y: 0,
        duration: 1.05,
        delay: 0.16,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 72%",
          once: true,
        },
      });
    }

    if (imageWrap && image) {
      gsap.fromTo(
        image,
        {
          scale: 1,
          yPercent: 0,
          filter: "brightness(0.92)",
        },
        {
          scale: imageEndScale,
          yPercent: -4,
          filter: "brightness(1.05)",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            end: "bottom top",
            scrub: 0.75,
            invalidateOnRefresh: true,
          },
        }
      );

      gsap.fromTo(
        imageWrap,
        { scale: 1 },
        {
          scale: wrapEndScale,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            end: "bottom top",
            scrub: 0.75,
            invalidateOnRefresh: true,
          },
        }
      );
    }
  }

  /* ----------------------------------------
     BOOT
  ---------------------------------------- */

  function boot() {
    initVoirHero();
    initBelief();
    initStory();
    initTechShowcase();
    initFeatureLab();
    initTvSeries();
    initPromise();
    initBrandFilm();
    initReveals();
  }

  /* Wait for preloader to finish, then init */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      /* Give preloader time to settle */
      setTimeout(boot, 200);
    });
  } else {
    setTimeout(boot, 200);
  }
})();
