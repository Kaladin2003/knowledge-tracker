// Knowledge Garden: an isometric grid where every finished lesson is a tree.
// Click (or Enter) on a tree to see why it was planted.

const TILE_W = 96; // width of one diamond-shaped tile on screen
const TILE_H = 48; // height of one tile (half the width = classic isometric look)
const SOIL = 22; // thickness of the soil under the grass
const HEADROOM = 110; // space above the back row so the tallest trees fit
const SVG_NS = "http://www.w3.org/2000/svg"; // SVG elements need their own namespace

// Each topic has its own kind of tree. Unknown topics get a color from their id.
const TOPIC_STYLES = {
  bikes: { crown: "#43a047", shade: "#2e7d32", fruit: "#e53935" },
  space: { crown: "#5c6bc0", shade: "#3949ab", fruit: "#ffeb3b" },
};
const THIRSTY = { crown: "#a1887f", shade: "#8d6e63", fruit: "#bcaaa4" };

function topicStyle(topicId) {
  if (TOPIC_STYLES[topicId]) return TOPIC_STYLES[topicId];
  // Turn the id into a number (a tiny "hash"), then into a hue on the color wheel
  let hash = 0;
  for (const char of topicId) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return { crown: `hsl(${hash} 55% 50%)`, shade: `hsl(${hash} 55% 38%)`, fruit: "#fff59d" };
}

// Grid cell (x, y) -> point on screen (top corner of the diamond).
// Moving +1 in x goes down-right, +1 in y goes down-left.
function toScreen(x, y, size) {
  const originX = (size * TILE_W) / 2;
  return {
    sx: originX + ((x - y) * TILE_W) / 2,
    sy: HEADROOM + ((x + y) * TILE_H) / 2,
  };
}

// Order in which cells get planted: back corner first, then row by row towards the front.
// Sorting by x + y also gives the right DRAWING order: back trees first, front trees on top.
function plantingOrder(size) {
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) cells.push({ x, y });
  }
  return cells.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
}

function svgElement(tag, attributes, parent) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (parent) parent.appendChild(element);
  return element;
}

function drawGround(svg, size) {
  const left = toScreen(0, size, size);
  const right = toScreen(size, 0, size);
  const front = toScreen(size, size, size);
  // Two soil sides under the grass
  svgElement("polygon", {
    points: `${left.sx},${left.sy} ${front.sx},${front.sy} ${front.sx},${front.sy + SOIL} ${left.sx},${left.sy + SOIL}`,
    fill: "#7a5230",
  }, svg);
  svgElement("polygon", {
    points: `${right.sx},${right.sy} ${front.sx},${front.sy} ${front.sx},${front.sy + SOIL} ${right.sx},${right.sy + SOIL}`,
    fill: "#5e3d22",
  }, svg);
  // Grass tiles, checkerboard
  for (const { x, y } of plantingOrder(size)) {
    const { sx, sy } = toScreen(x, y, size);
    svgElement("polygon", {
      points: `${sx},${sy} ${sx + TILE_W / 2},${sy + TILE_H / 2} ${sx},${sy + TILE_H} ${sx - TILE_W / 2},${sy + TILE_H / 2}`,
      fill: (x + y) % 2 ? "#8bc34a" : "#9ccc65",
      stroke: "#7cb342",
      "stroke-width": 1,
      "data-cell": `${x},${y}`,
    }, svg);
  }
}

// One tree. 3/3 = full tree with fruit, 2/3 = young tree.
function drawTree(svg, tree, cell, size, thirsty, onSelect) {
  const style = thirsty ? THIRSTY : topicStyle(tree.topic_id);
  const full = tree.best_score >= 3;
  const trunk = full ? 38 : 26;
  const radius = full ? 26 : 18;
  const { sx, sy } = toScreen(cell.x, cell.y, size);
  const baseX = sx;
  const baseY = sy + TILE_H / 2; // centre of the tile
  const crownY = baseY - trunk - radius * 0.6;

  const group = svgElement("g", {
    class: "tree",
    tabindex: "0",
    role: "button",
    "aria-label": `${tree.topic_title}: ${tree.lesson_title}`,
  }, svg);
  svgElement("title", {}, group).textContent = tree.lesson_title; // tooltip on hover

  svgElement("ellipse", { cx: baseX, cy: baseY + 4, rx: radius * 0.9, ry: radius * 0.35, fill: "rgba(0,0,0,0.18)" }, group);
  svgElement("rect", { x: baseX - 3, y: baseY - trunk, width: 6, height: trunk, rx: 2, fill: "#6d4c41" }, group);
  svgElement("circle", { cx: baseX, cy: crownY, r: radius, fill: style.crown }, group);
  svgElement("circle", { cx: baseX - radius * 0.45, cy: crownY + radius * 0.3, r: radius * 0.62, fill: style.shade }, group);
  if (full) {
    for (const [dx, dy] of [[-8, -8], [9, 0], [3, -15]]) {
      svgElement("circle", { cx: baseX + dx, cy: crownY + dy, r: 3.2, fill: style.fruit }, group);
    }
  }

  group.addEventListener("click", () => onSelect(tree, group));
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(tree, group);
    }
  });
}

function renderGarden(garden, thirsty) {
  const container = document.getElementById("garden");
  const size = garden.size;
  const width = size * TILE_W;
  const height = HEADROOM + size * TILE_H + SOIL + 10;

  // viewBox = the drawing's own coordinates; the SVG then scales to any screen width
  const svg = svgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "garden-svg", role: "img", "aria-label": "Knowledge garden" });
  drawGround(svg, size);

  const cells = plantingOrder(size);
  garden.trees.forEach((tree, index) => {
    drawTree(svg, tree, cells[index], size, thirsty, selectTree);
  });

  container.replaceChildren(svg);
}

function selectTree(tree, group) {
  document.querySelectorAll(".tree.selected").forEach((element) => element.classList.remove("selected"));
  group.classList.add("selected");
  showTreeInfo(tree);
}

// The card under the garden: why this tree was planted
function showTreeInfo(tree) {
  const info = document.getElementById("tree-info");
  const planted = new Date(tree.planted_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const title = document.createElement("h3");
  title.textContent = `🌳 ${tree.lesson_title}`;

  const why = document.createElement("p");
  why.textContent = `Planted on ${planted}, when you finished this lesson in ${tree.topic_emoji} ${tree.topic_title}.`;

  const score = document.createElement("p");
  score.className = "muted";
  score.textContent =
    tree.best_score >= 3
      ? `Best quiz score: ${tree.best_score}/3, a fully grown tree.`
      : `Best quiz score: ${tree.best_score}/3. Get 3/3 to grow it to full size.`;

  const link = document.createElement("a");
  link.href = `lesson.html?id=${encodeURIComponent(tree.lesson_id)}`;
  link.textContent = "Read this lesson again →";

  info.replaceChildren(title, why, score, link);
  info.hidden = false;
}

async function loadGarden() {
  const status = document.getElementById("garden-status");
  const info = document.getElementById("tree-info");
  info.hidden = true;

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [gardenResponse, streakResponse] = await Promise.all([
      fetch("/api/garden"),
      fetch(`/api/streak?tz=${encodeURIComponent(timeZone)}`),
    ]);
    if (!gardenResponse.ok) throw new Error(`HTTP ${gardenResponse.status}`);
    const garden = await gardenResponse.json();
    const streak = streakResponse.ok ? await streakResponse.json() : { current: 1 };

    // Thirsty: there are trees, but the streak is broken
    const thirsty = garden.trees.length > 0 && streak.current === 0;
    renderGarden(garden, thirsty);

    const count = garden.trees.length;
    if (count === 0) {
      status.textContent = "Finish a lesson to plant your first tree 🌱";
    } else if (thirsty) {
      status.textContent = `${count} ${count === 1 ? "tree" : "trees"} · Your garden is thirsty 💧 Learn something today to water it.`;
    } else {
      status.textContent = `${count} ${count === 1 ? "tree" : "trees"} · Click a tree to see why it was planted.`;
    }
  } catch (error) {
    status.textContent = `Could not load the garden: ${error.message}`;
  }
}

loadGarden();
