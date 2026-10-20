// Knowledge Garden: an isometric grid where every learned lesson is a tree.
// Click (or Enter) on a tree to open its field-guide entry: why it was planted.
// SVG_NS, topicColor, icon, entryNumber and fetchJson come from common.js.

const TILE_W = 96; // width of one diamond-shaped tile on screen
const TILE_H = 48; // height of one tile (half the width = classic isometric look)
const SOIL = 18; // thickness of the soil under the grass
const HEADROOM = 110; // space above the back row so the tallest trees fit

const GRASS = { light: "#c4dbac", dark: "#b3cf98", line: "#a2c287" };
const SOIL_COLORS = { left: "#8a6a4a", right: "#6f533a" };
const THIRSTY = { crown: "#b49a7f", shade: "#94795f", fruit: "#d8c7b2" };

let gardenSections = {}; // topic id -> section number, for entry numbers like 2.3

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
    fill: SOIL_COLORS.left,
  }, svg);
  svgElement("polygon", {
    points: `${right.sx},${right.sy} ${front.sx},${front.sy} ${front.sx},${front.sy + SOIL} ${right.sx},${right.sy + SOIL}`,
    fill: SOIL_COLORS.right,
  }, svg);
  // Grass tiles, checkerboard
  for (const { x, y } of plantingOrder(size)) {
    const { sx, sy } = toScreen(x, y, size);
    svgElement("polygon", {
      points: `${sx},${sy} ${sx + TILE_W / 2},${sy + TILE_H / 2} ${sx},${sy + TILE_H} ${sx - TILE_W / 2},${sy + TILE_H / 2}`,
      fill: (x + y) % 2 ? GRASS.dark : GRASS.light,
      stroke: GRASS.line,
      "stroke-width": 1,
    }, svg);
  }
}

// One tree. 3/3 = full tree with fruit, 2/3 = young tree.
function drawTree(svg, tree, cell, size, thirsty, onSelect) {
  const color = thirsty ? THIRSTY : topicColor(tree.topic_id);
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
    "aria-label": `${tree.lesson_title}, ${tree.topic_title}. Open its entry.`,
  }, svg);
  svgElement("title", {}, group).textContent = tree.lesson_title; // tooltip on hover

  svgElement("ellipse", { cx: baseX, cy: baseY + 4, rx: radius * 0.9, ry: radius * 0.35, fill: "rgba(40, 60, 30, 0.2)" }, group);
  svgElement("rect", { x: baseX - 3, y: baseY - trunk, width: 6, height: trunk, rx: 2, fill: "#6d4c41" }, group);
  svgElement("circle", { cx: baseX, cy: crownY, r: radius, fill: color.crown, class: "tree-crown" }, group);
  svgElement("circle", { cx: baseX - radius * 0.45, cy: crownY + radius * 0.3, r: radius * 0.62, fill: color.shade }, group);
  if (full) {
    for (const [dx, dy] of [[-8, -8], [9, 0], [3, -15]]) {
      svgElement("circle", { cx: baseX + dx, cy: crownY + dy, r: 3.2, fill: color.fruit }, group);
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
  const svg = svgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "garden-svg",
    role: "group",
    "aria-label": `Garden with ${garden.trees.length} trees`,
  });
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

// The field-guide entry under the plate: why this tree was planted
function showTreeInfo(tree) {
  const info = document.getElementById("tree-info");
  const planted = new Date(tree.planted_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const section = gardenSections[tree.topic_id];

  const number = document.createElement("p");
  number.className = "entry-number";
  number.textContent = section ? entryNumber(section, tree.lesson_position) : "";

  const title = document.createElement("h3");
  title.textContent = tree.lesson_title;

  const fields = document.createElement("dl");
  const rows = [
    ["Topic", tree.topic_title],
    ["Planted", planted],
    ["Self-test", tree.best_score >= 3 ? `${tree.best_score}/3, fully grown` : `${tree.best_score}/3, young tree`],
  ];
  for (const [label, value] of rows) {
    const field = document.createElement("div");
    field.className = "entry-field";
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value;
    field.append(term, detail);
    fields.appendChild(field);
  }

  const link = document.createElement("a");
  link.href = `lesson.html?id=${encodeURIComponent(tree.lesson_id)}`;
  link.textContent = tree.best_score >= 3 ? "Read this entry again" : "Retake the self-test to grow it";

  info.replaceChildren(number, title, fields, link);
  info.hidden = false;
}

async function loadGarden() {
  const status = document.getElementById("garden-status");
  const info = document.getElementById("tree-info");
  info.hidden = true;

  try {
    const [garden, streak, topics] = await Promise.all([
      fetchJson("/api/garden"),
      fetchJson(`/api/streak?tz=${encodeURIComponent(userTimeZone())}`).catch(() => ({ current: 1 })),
      fetchJson("/api/topics").catch(() => []),
    ]);
    gardenSections = Object.fromEntries(topics.map((topic, index) => [topic.id, index + 1]));

    // Thirsty: there are trees, but the streak is broken
    const thirsty = garden.trees.length > 0 && streak.current === 0;
    renderGarden(garden, thirsty);

    const count = garden.trees.length;
    status.classList.toggle("thirsty", thirsty);
    if (count === 0) {
      status.textContent = "Empty for now: pass your first self-test to plant a tree.";
    } else if (thirsty) {
      status.textContent = "Thirsty: pass a self-test today to water it.";
    } else {
      status.textContent = `${count} ${count === 1 ? "tree" : "trees"}. Select one to read its entry.`;
    }
  } catch (error) {
    status.textContent = `Could not load the garden: ${error.message}`;
  }
}

loadGarden();
