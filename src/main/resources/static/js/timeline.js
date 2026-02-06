(function () {
    "use strict";

    const entries = Array.isArray(window.TIMELINE_ENTRIES) ? window.TIMELINE_ENTRIES : [];

    const stage = document.getElementById("stage");
    const svg = document.getElementById("snakeSvg");
    const path = document.getElementById("snakePath");
    const dotsGroup = document.getElementById("snakeDots");
    const labelsLayer = document.getElementById("labels");

    const modal = document.getElementById("modal");
    const modalDialog = modal?.querySelector(".modal__dialog");
    const modalImg = document.getElementById("modalImg");
    const modalImgFallback = document.getElementById("modalImgFallback");
    const modalTitle = document.getElementById("modalTitle");
    const modalDesc = document.getElementById("modalDesc");

    let activeIndex = null;
    let lastFocus = null;

    function clamp(n, a, b) {
        return Math.max(a, Math.min(b, n));
    }

    function toIsoDateString(value) {
        if (value == null) return "";

        if (typeof value === "string") return value;

        // Sometimes LocalDate-like objects are serialized as {year, monthValue, dayOfMonth}
        if (typeof value === "object") {
            const y = value.year;
            const m = value.monthValue ?? value.month; // just in case
            const d = value.dayOfMonth ?? value.day;

            if (Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d)) {
                const mm = String(m).padStart(2, "0");
                const dd = String(d).padStart(2, "0");
                return `${y}-${mm}-${dd}`;
            }
        }

        return String(value);
    }

    function formatDate(input) {
        // entries from Thymeleaf may serialize LocalDate as an object; normalize first.
        const iso = toIsoDateString(input);

        // Keep it simple and locale-friendly.
        const d = new Date(iso + "T00:00:00");
        if (Number.isNaN(d.getTime())) return String(iso);
        return new Intl.DateTimeFormat("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
    }

    function setStageHeight() {
        const n = Math.max(entries.length, 1);

        // Space between milestones; tweak for density/responsiveness
        const isMobile = window.matchMedia("(max-width: 720px)").matches;
        const topPad = isMobile ? 90 : 120;
        const bottomPad = isMobile ? 120 : 160;
        const spacing = isMobile ? 140 : 180;

        const height = topPad + (n - 1) * spacing + bottomPad;
        stage.style.height = `${Math.max(height, Math.floor(window.innerHeight * 0.70))}px`;
        return { topPad, bottomPad, spacing, height: Math.max(height, Math.floor(window.innerHeight * 0.70)) };
    }

    function buildSnakePath(viewW, viewH) {
        // Create a sinusoidal-like vertical snake using cubic segments.
        // X oscillates around center, Y increases linearly.
        const cx = viewW * 0.50;
        const amp = viewW * 0.22;
        const segments = 10; // geometry smoothness; independent from item count
        const segH = viewH / segments;

        let d = `M ${cx} 0`;
        for (let i = 0; i < segments; i++) {
            const y0 = i * segH;
            const y1 = (i + 1) * segH;

            const dir = i % 2 === 0 ? 1 : -1;
            const x1 = cx + amp * dir;

            // cubic control points
            const cp1x = cx + amp * dir;
            const cp1y = y0 + segH * 0.25;
            const cp2x = cx + amp * dir;
            const cp2y = y0 + segH * 0.75;

            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`;
        }
        return d;
    }

    function clearChildren(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    function createCircle(index) {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("r", "9");
        c.setAttribute("tabindex", "0");
        c.setAttribute("role", "button");
        c.setAttribute("aria-label", `Otevřít milník ${index + 1}`);
        c.dataset.index = String(index);
        return c;
    }

    function createLabel(index, xPx, yPx) {
        const e = entries[index];
        const label = document.createElement("div");
        label.className = "label";

        const shiftX = -48; // <-- posun všech tlačítek/labelů doleva (uprav dle chuti)
        label.style.left = `${xPx + shiftX}px`;
        label.style.top = `${yPx}px`;

        const side = index % 2 === 0 ? 1 : -1;
        const dx = side === 1 ? 18 : -18;
        label.style.transform = `translate(${dx}px, -50%)`;

        const pill = document.createElement("button");
        pill.className = "label__pill";
        pill.type = "button";
        pill.dataset.index = String(index);
        pill.setAttribute("aria-label", `Otevřít fotku pro datum ${formatDate(e.datumFotky ?? e.datum_fotky ?? "")}`);
        pill.textContent = formatDate(e.datumFotky ?? e.datum_fotky ?? "");

        label.appendChild(pill);

        // Popis necháme pryč v timeline (zobrazí se až v modalu)
        return label;
    }

    function positionMilestones() {
        if (!stage || !svg || !path || !dotsGroup || !labelsLayer) return;

        const rect = stage.getBoundingClientRect();
        const stageW = rect.width;
        const stageH = rect.height;

        // We use a fixed viewBox width for stable geometry; height maps to stage height.
        const viewW = 1000;
        const viewH = Math.max(600, Math.floor(stageH * 1.0));

        svg.setAttribute("viewBox", `0 0 ${viewW} ${viewH}`);
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");

        path.setAttribute("d", buildSnakePath(viewW, viewH));

        // Use real path geometry to place items.
        const total = path.getTotalLength();
        const n = entries.length;

        clearChildren(dotsGroup);
        clearChildren(labelsLayer);

        for (let i = 0; i < n; i++) {
            const t = n === 1 ? 0.5 : i / (n - 1);
            // Keep circles away from extreme ends a little (so they don't clip)
            const tSafe = clamp(t, 0.02, 0.98);
            const point = path.getPointAtLength(total * tSafe);

            // Create SVG circle at exact point on the path
            const c = createCircle(i);
            c.setAttribute("cx", String(point.x));
            c.setAttribute("cy", String(point.y));
            dotsGroup.appendChild(c);

            // Convert viewBox coords to pixel coords for label positioning
            const xPx = (point.x / viewW) * stageW;
            const yPx = (point.y / viewH) * stageH;

            labelsLayer.appendChild(createLabel(i, xPx, yPx));
        }

        // Re-apply active highlight (if modal open)
        syncActiveDotClass();
    }

    function syncActiveDotClass() {
        const circles = dotsGroup?.querySelectorAll("circle");
        if (!circles) return;
        circles.forEach((c) => {
            const idx = Number(c.dataset.index);
            c.classList.toggle("is-active", Number.isFinite(activeIndex) && idx === activeIndex);
        });
    }

    function openModal(index, { pushHash = true } = {}) {
        if (!modal || !modalDialog || !modalImg || !modalTitle || !modalDesc) return;
        if (!entries[index]) return;

        activeIndex = index;
        syncActiveDotClass();

        const e = entries[index];
        const filename = e.nazevFotky ?? e.nazev_fotky ?? "";
        const iso = e.datumFotky ?? e.datum_fotky ?? "";
        const desc = e.popis ?? "";

        modalTitle.textContent = formatDate(iso);
        modalDesc.textContent = String(desc);

        modalImgFallback.hidden = true;
        modalImg.hidden = false;

        modalImg.alt = `Fotka: ${formatDate(iso)}`;
        modalImg.onerror = function () {
            modalImg.hidden = true;
            modalImgFallback.hidden = false;
        };
        modalImg.src = `/images/${encodeURIComponent(String(filename))}`;

        lastFocus = document.activeElement;

        modal.hidden = false;
        document.body.style.overflow = "hidden";
        modalDialog.focus();

        if (pushHash) {
            history.replaceState(null, "", `#item-${index}`);
        }
    }

    function closeModal({ keepHash = false } = {}) {
        if (!modal) return;

        modal.hidden = true;
        document.body.style.overflow = "";

        activeIndex = null;
        syncActiveDotClass();

        if (!keepHash && location.hash.startsWith("#item-")) {
            history.replaceState(null, "", "#");
        }

        if (lastFocus && typeof lastFocus.focus === "function") {
            lastFocus.focus();
        }
    }

    function focusTrap(e) {
        if (!modal || modal.hidden) return;
        if (e.key !== "Tab") return;

        const focusables = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
        if (list.length === 0) return;

        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function findCircleByIndex(index) {
        return dotsGroup?.querySelector(`circle[data-index="${index}"]`) ?? null;
    }

    function scrollToIndex(index) {
        const circle = findCircleByIndex(index);
        if (!circle || !svg) return;

        // circle cy is in viewBox units; map to stage pixel Y and scroll the page to it.
        const stageRect = stage.getBoundingClientRect();
        const viewBox = svg.viewBox.baseVal;
        if (!viewBox || viewBox.height === 0) return;

        const cy = Number(circle.getAttribute("cy"));
        const yInStage = (cy / viewBox.height) * stageRect.height;
        const yOnPage = window.scrollY + stageRect.top + yInStage;

        window.scrollTo({ top: Math.max(0, yOnPage - 120), behavior: "smooth" });
    }

    function tryOpenFromHash() {
        const m = location.hash.match(/^#item-(\d+)$/);
        if (!m) return;
        const idx = Number(m[1]);
        if (!Number.isInteger(idx) || idx < 0 || idx >= entries.length) return;

        scrollToIndex(idx);
        // Slight delay so scroll starts, then open modal.
        window.setTimeout(() => openModal(idx, { pushHash: false }), 250);
    }

    function wireEvents() {
        // Click/keyboard on circles
        dotsGroup?.addEventListener("click", (ev) => {
            const t = ev.target;
            if (!(t instanceof SVGCircleElement)) return;
            const idx = Number(t.dataset.index);
            if (!Number.isFinite(idx)) return;
            openModal(idx);
        });

        dotsGroup?.addEventListener("keydown", (ev) => {
            const t = ev.target;
            if (!(t instanceof SVGCircleElement)) return;
            if (ev.key !== "Enter" && ev.key !== " ") return;
            ev.preventDefault();
            const idx = Number(t.dataset.index);
            if (!Number.isFinite(idx)) return;
            openModal(idx);
        });

        // NEW: click on date pill (labels)
        labelsLayer?.addEventListener("click", (ev) => {
            const t = ev.target;
            if (!(t instanceof HTMLElement)) return;
            if (!t.classList.contains("label__pill")) return;

            const idx = Number(t.dataset.index);
            if (!Number.isFinite(idx)) return;
            openModal(idx);
        });

        // Fallback SR list buttons open modal too
        document.querySelectorAll(".sr-list__btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = Number(btn.dataset.index);
                if (!Number.isFinite(idx)) return;
                openModal(idx);
            });
        });

        // Modal close behaviors
        modal?.addEventListener("click", (ev) => {
            const t = ev.target;
            if (!(t instanceof HTMLElement)) return;
            if (t.dataset.close === "backdrop" || t.dataset.close === "x") closeModal();
        });

        document.addEventListener("keydown", (ev) => {
            if (!modal || modal.hidden) return;

            if (ev.key === "Escape") {
                ev.preventDefault();
                closeModal({ keepHash: true });
                return;
            }
            focusTrap(ev);
        });

        // Resize -> re-position
        window.addEventListener("resize", () => {
            positionMilestones();
        });

        // Hash navigation
        window.addEventListener("hashchange", () => {
            tryOpenFromHash();
        });
    }

    function init() {
        if (!stage || !svg || !path || !dotsGroup || !labelsLayer) return;

        setStageHeight();
        positionMilestones();
        wireEvents();
        tryOpenFromHash();
    }

    // Delay to ensure layout is stable
    window.addEventListener("DOMContentLoaded", init);
})();