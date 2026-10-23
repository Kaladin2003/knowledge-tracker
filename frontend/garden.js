// Knowledge Garden: an isometric grid where every learned lesson is a tree.
// Click (or Enter) on a tree to open its field-guide entry: why it was planted.
// SVG_NS, entryNumber and fetchJson come from common.js; drawSpecies and speciesFor from trees.js.

const TILE_W = 96; // width of one diamond-shaped tile on screen
const TILE_H = 48; // height of one tile (half the width = classic isometric look)
const SOIL = 30; // thickness of the block under the grass
const LIP = 9; // how far the grass hangs over the soil
const HEADROOM = 56; // space above the back row so the tallest trees fit

const GRASS = { light: "#a6d46b", dark: "#97c95c", lip: "#7fb04a", lipShade: "#6c9a3d", tuft: "#6fa043" };
const SOIL_COLORS = { left: "#8d5d3b", right: "#6f4630", pebble: "#5b3825" };
const SMALL_FLOWERS = ["#ffffff", "#f5d34a", "#ec7aa0"];

let gardenSections = {}; // topic id -> section number, for entry numbers like 2.3

// A fixed "random" number from 0 to 1 for a grid cell, so decorations never move between visits
function cellNoise(x, y, salt = 0) {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
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
  const back = toScreen(0, 0, size);
  const left = toScreen(0, size, size);
  const right = toScreen(size, 0, size);
  const front = toScreen(size, size, size);

  // Soil: the two visible sides of the block
  svgElement("polygon", {
    points: `${left.sx},${left.sy} ${front.sx},${front.sy} ${front.sx},${front.sy + SOIL} ${left.sx},${left.sy + SOIL}`,
    fill: SOIL_COLORS.left,
  }, svg);
  svgElement("polygon", {
    points: `${right.sx},${right.sy} ${front.sx},${front.sy} ${front.sx},${front.sy + SOIL} ${right.sx},${right.sy + SOIL}`,
    fill: SOIL_COLORS.right,
  }, svg);
  drawPebbles(svg, left, front, size, 1);
  drawPebbles(svg, right, front, size, 2);

  // Grass hanging over the edge, with a wavy bottom
  drawLip(svg, left, front, size, GRASS.lip);
  drawLip(svg, right, front, size, GRASS.lipShade);

  // The top: one diamond per tile, checkerboard
  for (const { x, y } of plantingOrder(size)) {
    const { sx, sy } = toScreen(x, y, size);
    svgElement("polygon", {
      points: `${sx},${sy} ${sx + TILE_W / 2},${sy + TILE_H / 2} ${sx},${sy + TILE_H} ${sx - TILE_W / 2},${sy + TILE_H / 2}`,
      fill: (x + y) % 2 ? GRASS.dark : GRASS.light,
    }, svg);
  }
  // A thin light line on the back edges, so the block has a crisp top
  svgElement("polyline", {
    points: `${left.sx},${left.sy} ${back.sx},${back.sy} ${right.sx},${right.sy}`,
    fill: "none",
    stroke: "#c3e58d",
    "stroke-width": 2,
  }, svg);
}

// The grass band along one front side: straight on top, wavy at the bottom
function drawLip(svg, from, to, size, color) {
  const steps = size * 6;
  const bottom = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = from.sx + (to.sx - from.sx) * t;
    const py = from.sy + (to.sy - from.sy) * t;
    bottom.push(`${px},${py + (i % 2 ? LIP + 4 : LIP)}`);
  }
  svgElement("polygon", {
    points: `${from.sx},${from.sy} ${to.sx},${to.sy} ${bottom.reverse().join(" ")}`,
    fill: color,
  }, svg);
}

// Little stones in the soil
function drawPebbles(svg, from, to, size, salt) {
  for (let i = 0; i < size * 3; i++) {
    const t = cellNoise(i, salt, 1);
    const depth = LIP + 6 + cellNoise(i, salt, 2) * (SOIL - LIP - 10);
    svgElement("ellipse", {
      cx: from.sx + (to.sx - from.sx) * t,
      cy: from.sy + (to.sy - from.sy) * t + depth,
      rx: 2.5 + cellNoise(i, salt, 3) * 2,
      ry: 1.6,
      fill: SOIL_COLORS.pebble,
      opacity: 0.6,
    }, svg);
  }
}

// An empty tile gets a grass tuft or a tiny flower now and then
function drawDecoration(svg, cell, size) {
  const roll = cellNoise(cell.x, cell.y);
  if (roll > 0.55) return; // about half of the empty tiles stay plain
  const { sx, sy } = toScreen(cell.x, cell.y, size);
  const x = sx + (cellNoise(cell.x, cell.y, 4) - 0.5) * 30;
  const y = sy + TILE_H / 2 + (cellNoise(cell.x, cell.y, 5) - 0.5) * 12;
  if (roll < 0.15) {
    const color = SMALL_FLOWERS[Math.floor(cellNoise(cell.x, cell.y, 6) * SMALL_FLOWERS.length)];
    svgElement("line", { x1: x, y1: y, x2: x, y2: y - 6, stroke: GRASS.tuft, "stroke-width": 1.5 }, svg);
    svgElement("circle", { cx: x, cy: y - 7, r: 2.6, fill: color }, svg);
  } else {
    svgElement("path", {
      d: `M${x - 5},${y} L${x - 3},${y - 6} L${x - 1},${y} M${x},${y} L${x + 2},${y - 8} L${x + 4},${y} M${x + 4},${y} L${x + 6},${y - 5} L${x + 8},${y}`,
      fill: "none",
      stroke: GRASS.tuft,
      "stroke-width": 1.5,
      "stroke-linejoin": "round",
    }, svg);
  }
}

// One tree. Its species comes from the topic's category (trees.js).
// 3/3 = fully grown with fruit or flowers, 2/3 = a young, smaller tree.
// growing = this tree was just planted (or grew): play the grow animation once
function drawTree(svg, tree, cell, size, thirsty, onSelect, growing = false) {
  // People who turned on "reduce motion" in their system settings get the tree without the show
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) growing = false;
  const full = tree.best_score >= 3;
  const { sx, sy } = toScreen(cell.x, cell.y, size);
  const baseX = sx;
  const baseY = sy + TILE_H / 2 + 4; // a little in front of the tile centre

  const group = svgElement("g", {
    class: growing ? "tree growing" : "tree",
    "data-lesson": tree.lesson_id,
    tabindex: "0",
    role: "button",
    "aria-label": `${tree.lesson_title}, ${tree.topic_title}. Open its entry.`,
  }, svg);
  svgElement("title", {}, group).textContent = tree.lesson_title; // tooltip on hover

  // The ring shows which tree is selected (CSS makes it visible)
  svgElement("ellipse", { cx: baseX, cy: baseY, rx: 30, ry: 15, class: "tree-ring" }, group);
  svgElement("ellipse", { cx: baseX + 3, cy: baseY + 1, rx: 22, ry: 8, fill: "rgba(40, 70, 20, 0.28)" }, group);
  drawSpecies(group, tree.category_id, baseX, baseY, { size: full ? 1 : 0.72, full, thirsty });
  if (growing) addSparks(group, baseX, baseY - (full ? 48 : 34));

  group.addEventListener("click", () => onSelect(tree, group));
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(tree, group);
    }
  });
}

function renderGarden(garden, thirsty, plantedId = null) {
  const container = document.getElementById("garden");
  const size = garden.size;
  const width = size * TILE_W;
  const height = HEADROOM + size * TILE_H + SOIL + 6;

  // viewBox = the drawing's own coordinates; the SVG then scales to any screen width
  const svg = svgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "garden-svg",
    role: "group",
    "aria-label": `Garden with ${garden.trees.length} trees`,
  });
  drawGround(svg, size);

  // Back to front (painter's order): each cell gets its tree, or a small decoration if it is empty
  plantingOrder(size).forEach((cell, index) => {
    const tree = garden.trees[index];
    if (tree) drawTree(svg, tree, cell, size, thirsty, selectTree, tree.lesson_id === plantedId);
    else drawDecoration(svg, cell, size);
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
    ["Tree", `${speciesFor(tree.category_id).name} (${tree.category_title || "no category"})`],
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

// The key under the plate: a small tree and the name of every category.
// Categories without topics yet are shown faded, so you can see what will grow later.
function renderKey(categories) {
  const key = document.getElementById("tree-key");
  key.replaceChildren(
    ...categories.map((category) => {
      const item = document.createElement("li");
      item.classList.toggle("unused", category.topic_count === 0);
      const name = document.createElement("span");
      name.textContent = category.title;
      const species = document.createElement("span");
      species.className = "visually-hidden";
      species.textContent = `: ${speciesFor(category.id).name}`;
      item.title = category.topic_count === 0 ? `${speciesFor(category.id).name}. No topics yet.` : speciesFor(category.id).name;
      item.append(topicSwatch(category.id), name, species);
      return item;
    }),
  );
}

// Small yellow dots that fly out of the crown while a tree grows.
// Each one gets its own direction through CSS variables (--dx, --dy), used by the "spark" animation.
function addSparks(group, x, y) {
  const directions = [[-26, -14], [24, -18], [-14, -30], [16, -32], [-30, 4], [30, 2]];
  for (const [dx, dy] of directions) {
    const spark = svgElement("circle", { cx: x, cy: y, r: 3.5, class: "spark", style: `--dx: ${dx}px; --dy: ${dy}px` }, group);
    spark.addEventListener("animationend", () => spark.remove()); // each spark cleans up after its own flight
  }
  // When the grow animation ends, remove the class, so hovering works normally again
  group.addEventListener("animationend", (event) => {
    if (event.target === group) group.classList.remove("growing"); // sparks' events bubble up here too
  });
}

// After the grow animation starts: open the new tree's entry, and say what happened
function showPlantedTree(garden, plantedId) {
  // Take ?planted=... out of the address bar, so a reload doesn't replay the animation
  window.history.replaceState(null, "", window.location.pathname);

  const tree = garden.trees.find((item) => item.lesson_id === plantedId);
  const group = document.querySelector(`.tree[data-lesson="${CSS.escape(plantedId)}"]`);
  if (!tree || !group) return;

  selectTree(tree, group);
  const plantedToday = new Date(tree.planted_at).toDateString() === new Date().toDateString();
  document.getElementById("garden-status").textContent =
    `${plantedToday ? "Just planted" : "Just grew"}: ${tree.lesson_title}.`;
}

async function loadGarden() {
  const status = document.getElementById("garden-status");
  const info = document.getElementById("tree-info");
  info.hidden = true;

  try {
    const [garden, streak, topics, categories] = await Promise.all([
      fetchJson("/api/garden"),
      fetchJson(`/api/streak?tz=${encodeURIComponent(userTimeZone())}`).catch(() => ({ current: 1 })),
      fetchJson("/api/topics").catch(() => []),
      fetchJson("/api/categories").catch(() => []),
    ]);
    renderKey(categories);
    gardenSections = Object.fromEntries(topics.map((topic) => [topic.id, topic.section]));

    // Thirsty: there are trees, but the streak is broken
    const thirsty = garden.trees.length > 0 && streak.current === 0;
    // Coming from a passed self-test? The quiz page links here with ?planted=<lesson id>
    const plantedId = new URLSearchParams(window.location.search).get("planted");
    renderGarden(garden, thirsty, plantedId);

    const count = garden.trees.length;
    status.classList.toggle("thirsty", thirsty);
    if (count === 0) {
      status.textContent = "Empty for now: pass your first self-test to plant a tree.";
    } else if (thirsty) {
      status.textContent = "Thirsty: pass a self-test today to water it.";
    } else {
      status.textContent = `${count} ${count === 1 ? "tree" : "trees"}. Select one to read its entry.`;
    }
    if (plantedId) showPlantedTree(garden, plantedId);
  } catch (error) {
    status.textContent = `Could not load the garden: ${error.message}`;
  }
}

loadGarden();
