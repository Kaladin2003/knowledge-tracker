// Shared by every page: icons, entry numbers, fetchJson and the top bar.
// The tree species (and topicSwatch) live in trees.js.

const SVG_NS = "http://www.w3.org/2000/svg"; // SVG elements need their own namespace

// Authored icons: 24x24, 1.75 stroke, round caps. Each entry is a list of path "d" strings.
const ICON_PATHS = {
  flame: ["M12 3c.6 3.2-1.9 4.9-3 7-1 1.9-1 4 .3 5.7A5 5 0 0 0 17 15c.6-2.2-.4-4-1.6-5.4.2 1.6-.4 2.7-1.4 3.3.4-3.6-.6-7.2-2-9.9Z"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  cross: ["M7 7l10 10M17 7L7 17"],
  arrowRight: ["M5 12h14", "M13 6l6 6-6 6"],
  arrowLeft: ["M19 12H5", "M11 6l-6 6 6 6"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7.5V12l3 2"],
  sprout: ["M12 20v-8", "M12 12c0-3.5-2.5-6-6.5-6 0 3.5 2.5 6 6.5 6Z", "M12 13.5c0-3 2.2-5.5 6-5.5 0 3-2.2 5.5-6 5.5Z", "M7 20h10"],
  search: ["M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z", "M16 16l5 5"],
  leaves: ["M12 21V10", "M12 10c-3.8 0-6-2.6-6-6 3.8 0 6 2.6 6 6Z", "M12 14c3.4 0 5.5-2.3 5.5-5.5-3.4 0-5.5 2.3-5.5 5.5Z"],
};

function icon(name, label) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "icon");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.75");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  if (label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
  } else {
    svg.setAttribute("aria-hidden", "true");
  }
  for (const d of ICON_PATHS[name]) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
}

// Topics are numbered like sections of a field guide, in the order the API lists them.
// Lessons are entries inside a section: entry 2.3 = section 2, lesson 3.
function entryNumber(sectionNumber, position) {
  return `${sectionNumber}.${position}`;
}

// "1/3", green when everything is learned (index and category page)
function progressCount(done, total) {
  const count = document.createElement("span");
  count.className = "index-count";
  count.textContent = `${done}/${total}`;
  count.setAttribute("aria-label", `${done} of ${total} learned`);
  count.classList.toggle("complete", total > 0 && done === total);
  return count;
}

function meter(done, total) {
  const bar = document.createElement("span");
  bar.className = "meter";
  bar.setAttribute("aria-hidden", "true");
  const fill = document.createElement("span");
  fill.style.width = total ? `${(done / total) * 100}%` : "0%";
  bar.appendChild(fill);
  return bar;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

function userTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Top bar: "3-day streak" and "5 entries" on every page
async function loadTopbarStats() {
  const streakSlot = document.getElementById("topbar-streak");
  const entriesSlot = document.getElementById("topbar-entries");
  if (!streakSlot || !entriesSlot) return;

  try {
    const [streak, progress] = await Promise.all([
      fetchJson(`/api/streak?tz=${encodeURIComponent(userTimeZone())}`),
      fetchJson("/api/progress"),
    ]);

    const streakNumber = document.createElement("strong");
    streakNumber.textContent = streak.current;
    const streakLabel = document.createElement("span");
    streakLabel.className = "label";
    streakLabel.textContent = "day streak";
    streakSlot.replaceChildren(icon("flame"), streakNumber, streakLabel);
    streakSlot.classList.toggle("lit", streak.current > 0);
    streakSlot.title = `Best streak: ${streak.best} days`;

    const entriesNumber = document.createElement("strong");
    entriesNumber.textContent = progress.completed_count;
    const entriesLabel = document.createElement("span");
    entriesLabel.className = "label";
    entriesLabel.textContent = `of ${progress.total_lessons} entries learned`;
    entriesSlot.replaceChildren(icon("leaves"), entriesNumber, entriesLabel);
  } catch {
    // The page's own content shows a clearer error when the backend is down
  }
}

loadTopbarStats();
