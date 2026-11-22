(function () {
  "use strict";

  const DATA = window.ANDONG_DATA;
  const STORAGE_SAVED_KEY = "andong_saved_ids_v1";
  const STORAGE_NOTES_KEY = "andong_trip_notes_v1";

  const state = {
    lang: "en",
    tab: "explore",
    filter: "all",
    search: "",
    saved: loadSaved(),
    currentBigKorean: ""
  };

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveSaved() {
    try {
      localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(state.saved));
    } catch (e) {
      // Ignore storage quota / private mode errors
    }
  }

  function t(key) {
    return (DATA.ui[state.lang] && DATA.ui[state.lang][key]) || DATA.ui.en[key] || key;
  }

  function loc(obj) {
    if (!obj) return "";
    return obj[state.lang] || obj.en || "";
  }

  function toggleSave(id) {
    const idx = state.saved.indexOf(id);
    if (idx >= 0) {
      state.saved.splice(idx, 1);
    } else {
      state.saved.push(id);
    }
    saveSaved();
    updateSavedBadge();
    renderAttractions();
    renderFoods();
    renderSaved();
  }

  function updateSavedBadge() {
    const badge = document.getElementById("savedCountBadge");
    if (badge) badge.textContent = String(state.saved.length);
  }

  function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(key));
    });
  }

  function renderAttractions() {
    const grid = document.getElementById("attractionsGrid");
    if (!grid) return;

    const query = state.search.trim().toLowerCase();
    const list = DATA.attractions.filter((item) => {
      const matchesCat = state.filter === "all" || item.category === state.filter;
      if (!matchesCat) return false;
      if (!query) return true;
      const haystack = `${loc(item.name)} ${item.koreanName} ${loc(item.desc)} ${item.tag}`.toLowerCase();
      return haystack.includes(query);
    });

    if (list.length === 0) {
      grid.innerHTML = `<div class="empty-state">No matching places found.</div>`;
      return;
    }

    grid.innerHTML = list.map((item) => createPlaceCardHTML(item, "attraction")).join("");
  }

  function renderFoods() {
    const grid = document.getElementById("foodGrid");
    if (!grid) return;
    grid.innerHTML = DATA.foods.map((item) => createPlaceCardHTML(item, "food")).join("");
  }

  function createPlaceCardHTML(item, type) {
    const isSaved = state.saved.includes(item.id);
    const meta1 = type === "attraction" ? `🎟️ ${item.fee}` : `💰 ${item.price}`;
    const meta2 = type === "attraction" ? `🕒 ${item.hours}` : `🌶️ ${item.spice}`;

    return `
      <article class="card">
        <div class="card-banner" style="background: ${item.gradient}">
          ${item.image ? `<img class="card-banner-img" src="${item.image}" alt="${loc(item.name)}" loading="lazy" onerror="this.style.display='none'" />` : ""}
          <div class="card-banner-top">
            <span class="card-tag">${item.tag}</span>
            <button type="button" class="save-btn ${isSaved ? "saved" : ""}" data-action="save" data-id="${item.id}" aria-label="Save">
              ${isSaved ? "♥" : "♡"}
            </button>
          </div>
          <div class="card-banner-icon" aria-hidden="true">${item.icon}</div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${loc(item.name)}</h3>
          <p class="card-korean">${item.koreanName} · ${item.roman}</p>
          <p class="card-desc">${loc(item.desc)}</p>
          <div class="card-meta">
            <span class="meta-pill">${meta1}</span>
            <span class="meta-pill">${meta2}</span>
          </div>
          <div class="card-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-action="detail" data-type="${type}" data-id="${item.id}">${t("btnDetails")}</button>
            <button type="button" class="btn btn-outline btn-sm" data-action="taxi" data-type="${type}" data-id="${item.id}">${t("btnTaxiCard")}</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderItineraries() {
    const container = document.getElementById("itineraryList");
    if (!container) return;

    container.innerHTML = DATA.itineraries
      .map(
        (plan) => `
        <article class="itinerary-card">
          <h3>${loc(plan.title)}</h3>
          <p class="itinerary-subtitle">${loc(plan.subtitle)}</p>
          <ol class="timeline">
            ${plan.steps
              .map(
                (s) => `
                <li>
                  <div class="timeline-time">${s.time}</div>
                  <div class="timeline-title">${s.title}</div>
                  <p class="timeline-desc">${s.desc}</p>
                </li>
              `
              )
              .join("")}
          </ol>
        </article>
      `
      )
      .join("");
  }

  function renderPhrases() {
    const taxiGrid = document.getElementById("taxiCardsGrid");
    if (taxiGrid) {
      taxiGrid.innerHTML = DATA.attractions
        .map(
          (item) => `
          <button type="button" class="taxi-card" data-action="taxi" data-type="attraction" data-id="${item.id}">
            <div class="taxi-card-title">${item.icon} ${loc(item.name)}</div>
            <div class="taxi-card-kr">${item.koreanName}</div>
          </button>
        `
        )
        .join("");
    }

    const phraseList = document.getElementById("phraseList");
    if (phraseList) {
      phraseList.innerHTML = DATA.phrases
        .map(
          (p, idx) => `
          <article class="phrase-card">
            <div class="phrase-meaning">${loc(p.meaning)}</div>
            <div class="phrase-kr">${p.korean}</div>
            <div class="phrase-roman">${p.roman}</div>
            <div class="phrase-actions">
              <button type="button" class="btn btn-secondary btn-sm" data-action="show-phrase" data-idx="${idx}">${t("btnShowBig")}</button>
              <button type="button" class="btn btn-outline btn-sm" data-action="speak" data-text="${p.korean}">${t("btnListen")}</button>
            </div>
          </article>
        `
        )
        .join("");
    }
  }

  function renderTips() {
    const grid = document.getElementById("tipsGrid");
    if (!grid) return;

    grid.innerHTML = DATA.tips
      .map(
        (tip) => `
        <article class="tip-card">
          <h3><span>${tip.icon}</span> ${loc(tip.title)}</h3>
          <p>${loc(tip.body)}</p>
        </article>
      `
      )
      .join("");
  }

  function renderSaved() {
    const container = document.getElementById("savedContainer");
    if (!container) return;

    const allItems = [
      ...DATA.attractions.map((x) => ({ item: x, type: "attraction" })),
      ...DATA.foods.map((x) => ({ item: x, type: "food" }))
    ];
    const savedItems = allItems.filter((entry) => state.saved.includes(entry.item.id));

    if (savedItems.length === 0) {
      container.innerHTML = `<div class="empty-state">${t("emptySaved")}</div>`;
      return;
    }

    container.innerHTML = savedItems.map((entry) => createPlaceCardHTML(entry.item, entry.type)).join("");
  }

  function openDetailModal(type, id) {
    const list = type === "food" ? DATA.foods : DATA.attractions;
    const item = list.find((x) => x.id === id);
    if (!item) return;

    const body = document.getElementById("detailModalBody");
    const rows =
      type === "attraction"
        ? `
          <li><strong>${t("labelFee")}:</strong> ${item.fee}</li>
          <li><strong>${t("labelHours")}:</strong> ${item.hours}</li>
          <li><strong>${t("labelTransit")}:</strong> ${item.transit}</li>
          <li><strong>${t("labelTip")}:</strong> ${item.tip}</li>
        `
        : `
          <li><strong>${t("labelPrice")}:</strong> ${item.price}</li>
          <li><strong>${t("labelSpice")}:</strong> ${item.spice}</li>
          <li><strong>${t("labelOrderTip")}:</strong> ${item.orderTip}</li>
        `;

    body.innerHTML = `
      ${item.image ? `<img class="modal-hero-img" src="${item.image}" alt="${loc(item.name)}" onerror="this.style.display='none'" />` : `<div style="font-size: 2rem; margin-bottom: 6px;">${item.icon}</div>`}
      <h2 style="margin: 0 0 4px;">${loc(item.name)}</h2>
      <p style="margin: 0 0 12px; color: var(--primary); font-weight: 600;">${item.koreanName} (${item.roman})</p>
      <p style="margin: 0; color: var(--text-muted);">${loc(item.desc)}</p>
      <ul class="detail-list">${rows}</ul>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button type="button" class="btn btn-primary" data-action="taxi" data-type="${type}" data-id="${item.id}">${t("btnTaxiCard")}</button>
        <button type="button" class="btn btn-outline" data-action="speak" data-text="${item.koreanName}">${t("btnListen")}</button>
      </div>
    `;

    const modal = document.getElementById("detailModal");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function openShowBigModal(koreanText, romanText, meaningText) {
    state.currentBigKorean = koreanText;
    document.getElementById("showBigKorean").textContent = koreanText;
    document.getElementById("showBigRoman").textContent = romanText || "";
    document.getElementById("showBigMeaning").textContent = meaningText || "";

    const modal = document.getElementById("showBigModal");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModals() {
    ["detailModal", "showBigModal"].forEach((id) => {
      const m = document.getElementById(id);
      if (m) {
        m.classList.remove("open");
        m.setAttribute("aria-hidden", "true");
      }
    });
  }

  function speakKorean(text) {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  }

  function updateConverter() {
    const krwInput = document.getElementById("krwInput");
    const currencySelect = document.getElementById("targetCurrency");
    const out = document.getElementById("convertedValue");
    if (!krwInput || !currencySelect || !out) return;

    const krw = Math.max(0, Number(krwInput.value) || 0);
    const code = currencySelect.value;
    const rateObj = DATA.rates[code] || DATA.rates.USD;
    const val = krw * rateObj.perKrw;
    const formatted = code === "JPY" ? Math.round(val).toLocaleString() : val.toFixed(2);
    out.textContent = `${rateObj.symbol}${formatted}`;
  }

  function switchTab(tabName) {
    state.tab = tabName;
    document.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `panel-${tabName}`);
    });
  }

  function renderAll() {
    applyStaticTranslations();
    updateSavedBadge();
    renderAttractions();
    renderFoods();
    renderItineraries();
    renderPhrases();
    renderTips();
    renderSaved();
    updateConverter();
  }

  function bindEvents() {
    // Language switcher
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.lang = btn.getAttribute("data-lang");
        document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b === btn));
        renderAll();
      });
    });

    // Navigation tabs
    document.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab")));
    });

    // Hero buttons
    document.getElementById("heroExploreBtn").addEventListener("click", () => {
      switchTab("explore");
      document.getElementById("panel-explore").scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("heroTaxiBtn").addEventListener("click", () => {
      switchTab("phrases");
      document.getElementById("panel-phrases").scrollIntoView({ behavior: "smooth" });
    });

    // Explore filters
    document.querySelectorAll("#exploreFilters .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.filter = chip.getAttribute("data-filter");
        document.querySelectorAll("#exploreFilters .chip").forEach((c) => c.classList.toggle("active", c === chip));
        renderAttractions();
      });
    });

    // Search
    document.getElementById("exploreSearch").addEventListener("input", (e) => {
      state.search = e.target.value;
      renderAttractions();
    });

    // Global delegated clicks for cards & modals
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      const type = btn.getAttribute("data-type");

      if (action === "save") {
        toggleSave(id);
      } else if (action === "detail") {
        openDetailModal(type, id);
      } else if (action === "taxi") {
        const list = type === "food" ? DATA.foods : DATA.attractions;
        const item = list.find((x) => x.id === id);
        if (item) {
          closeModals();
          openShowBigModal(item.taxiKorean, item.roman, loc(item.name));
        }
      } else if (action === "show-phrase") {
        const p = DATA.phrases[Number(btn.getAttribute("data-idx"))];
        if (p) openShowBigModal(p.korean, p.roman, loc(p.meaning));
      } else if (action === "speak") {
        speakKorean(btn.getAttribute("data-text"));
      }
    });

    // Modal close handlers
    document.getElementById("closeDetailModal").addEventListener("click", closeModals);
    document.getElementById("closeShowBigModal").addEventListener("click", closeModals);
    document.getElementById("showBigSpeakBtn").addEventListener("click", () => speakKorean(state.currentBigKorean));

    ["detailModal", "showBigModal"].forEach((id) => {
      document.getElementById(id).addEventListener("click", (e) => {
        if (e.target.id === id) closeModals();
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModals();
    });

    // Converter
    document.getElementById("krwInput").addEventListener("input", updateConverter);
    document.getElementById("targetCurrency").addEventListener("change", updateConverter);
    document.querySelectorAll(".mini-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById("krwInput").value = btn.getAttribute("data-krw");
        updateConverter();
      });
    });

    // Clear saved
    document.getElementById("clearSavedBtn").addEventListener("click", () => {
      state.saved = [];
      saveSaved();
      updateSavedBadge();
      renderAttractions();
      renderFoods();
      renderSaved();
    });

    // Personal notes
    const notesEl = document.getElementById("tripNotes");
    const statusEl = document.getElementById("notesStatus");
    try {
      notesEl.value = localStorage.getItem(STORAGE_NOTES_KEY) || "";
    } catch (e) {
      // Ignore
    }
    notesEl.addEventListener("input", () => {
      try {
        localStorage.setItem(STORAGE_NOTES_KEY, notesEl.value);
        statusEl.textContent = t("notesSaved");
      } catch (e) {
        // Ignore
      }
    });
  }

  bindEvents();
  renderAll();
})();
