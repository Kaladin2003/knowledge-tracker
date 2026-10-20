// Tree species: every category grows its own kind of tree (Step 11).
// Used by the garden, the index and the topic page. Needs SVG_NS from common.js.
//
// Every species is drawn by one function with the same arguments:
//   draw(group, x, y, size, palette, full)
//   (x, y) = the point where the trunk meets the ground
//   size   = 1 for a normal tree; the garden makes young trees smaller
//   full   = best score 3/3: the tree also gets fruit or flowers

// category id -> which species grows for it
const CATEGORY_SPECIES = {
  technology: "pine",
  science: "lantern",
  nature: "apple",
  psychology: "blossom",
  philosophy: "olive",
  history: "oak",
  arts: "flowerBush",
  society: "maple",
  mathematics: "topiary",
};

const SPECIES = {
  pine: { name: "Pine", dark: "#2b6e3f", mid: "#3d8f50", light: "#62b46a", draw: drawPine },
  lantern: { name: "Lantern tree", dark: "#23707a", mid: "#33909a", light: "#5fbdbd", fruit: "#f6e27a", draw: drawRoundTree },
  apple: { name: "Apple tree", dark: "#357f37", mid: "#4c9c45", light: "#7cc464", fruit: "#d9473b", draw: drawRoundTree },
  blossom: { name: "Blossom tree", dark: "#c76489", mid: "#e58aac", light: "#f6bccf", fruit: "#ffffff", draw: drawBlossom },
  olive: { name: "Olive tree", dark: "#557a3f", mid: "#729a55", light: "#a6c588", fruit: "#3f3350", draw: drawOlive },
  oak: { name: "Oak", dark: "#4a6f2c", mid: "#638f39", light: "#8db657", fruit: "#9a6a35", draw: drawOak },
  flowerBush: { name: "Flower bush", dark: "#357f45", mid: "#4b9b57", light: "#7cc277", draw: drawFlowerBush },
  maple: { name: "Maple", dark: "#b2462a", mid: "#d06535", light: "#ee9b55", fruit: "#f6d36b", draw: drawRoundTree },
  topiary: { name: "Topiary", dark: "#257a52", mid: "#35986a", light: "#64c592", draw: drawTopiary },
};

// A thirsty garden (broken streak): every species turns dry and brown, without fruit
const DRY = { dark: "#7d6346", mid: "#9b7d58", light: "#bc9f76" };
const TRUNK = { dark: "#6b4630", light: "#8d6142" };
const FLOWER_COLORS = ["#f5d34a", "#ec7aa0", "#ffffff", "#9c86e6"];

function speciesFor(categoryId) {
  return SPECIES[CATEGORY_SPECIES[categoryId]] || SPECIES.oak;
}

// ---------- small drawing helpers ----------

function shape(tag, attributes, parent) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  parent.appendChild(element);
  return element;
}

// A ball of leaves with light from the upper right: dark base, mid colour, a soft highlight
function blob(group, cx, cy, r, palette) {
  shape("circle", { cx, cy, r, fill: palette.dark }, group);
  shape("circle", { cx: cx + r * 0.12, cy: cy - r * 0.14, r: r * 0.84, fill: palette.mid }, group);
  shape("circle", { cx: cx + r * 0.32, cy: cy - r * 0.36, r: r * 0.34, fill: palette.light, opacity: 0.85 }, group);
}

// The trunk: a left (shaded) half and a right (lit) half
function trunk(group, x, y, height, width) {
  shape("rect", { x: x - width / 2, y: y - height, width: width / 2, height, fill: TRUNK.dark }, group);
  shape("rect", { x, y: y - height, width: width / 2, height, fill: TRUNK.light }, group);
}

// Small dots (fruit or flowers) placed around a point. The pattern is fixed, so a tree never changes.
function dots(group, cx, cy, spread, colors, count, radius) {
  const pattern = [[-0.55, -0.1], [0.45, -0.35], [0.1, 0.35], [-0.2, -0.6], [0.65, 0.2], [-0.6, 0.4], [0.25, -0.75]];
  for (let i = 0; i < count; i++) {
    const [dx, dy] = pattern[i % pattern.length];
    shape("circle", { cx: cx + dx * spread, cy: cy + dy * spread, r: radius, fill: colors[i % colors.length] }, group);
  }
}

// ---------- the species ----------

function drawPine(group, x, y, size, palette) {
  trunk(group, x, y, 12 * size, 6 * size);
  const tiers = size >= 1 ? 3 : 2;
  const width = 30 * size;
  let base = y - 8 * size;
  for (let i = 0; i < tiers; i++) {
    const w = width * (1 - i * 0.22);
    const h = 30 * size * (1 - i * 0.12);
    // each tier is a triangle split in two: shaded left half, lit right half
    shape("polygon", { points: `${x - w},${base} ${x},${base - h} ${x},${base}`, fill: palette.dark }, group);
    shape("polygon", { points: `${x},${base} ${x},${base - h} ${x + w},${base}`, fill: palette.mid }, group);
    shape("polygon", { points: `${x + 2},${base - 3} ${x + 2},${base - h * 0.75} ${x + w * 0.45},${base - 3}`, fill: palette.light, opacity: 0.55 }, group);
    base -= h * 0.55;
  }
}

function drawRoundTree(group, x, y, size, palette, full) {
  const r = 22 * size;
  trunk(group, x, y, 26 * size, 6 * size);
  blob(group, x - r * 0.45, y - 26 * size - r * 0.55, r * 0.75, palette);
  blob(group, x + r * 0.45, y - 26 * size - r * 0.5, r * 0.72, palette);
  blob(group, x, y - 26 * size - r * 1.05, r * 0.85, palette);
  if (full && palette.fruit) dots(group, x, y - 26 * size - r * 0.8, r * 0.75, [palette.fruit], 6, 3 * size);
}

function drawBlossom(group, x, y, size, palette, full) {
  const r = 20 * size;
  trunk(group, x, y, 24 * size, 5 * size);
  // two branches that lean out, like a cherry tree
  shape("polygon", { points: `${x - 1},${y - 22 * size} ${x - r * 0.9},${y - 34 * size} ${x - r * 0.8},${y - 37 * size} ${x + 1},${y - 26 * size}`, fill: TRUNK.dark }, group);
  shape("polygon", { points: `${x},${y - 24 * size} ${x + r * 0.9},${y - 36 * size} ${x + r * 0.95},${y - 33 * size} ${x + 2},${y - 21 * size}`, fill: TRUNK.light }, group);
  blob(group, x - r * 0.85, y - 24 * size - r * 0.7, r * 0.62, palette);
  blob(group, x + r * 0.9, y - 24 * size - r * 0.75, r * 0.6, palette);
  blob(group, x, y - 24 * size - r * 1.1, r * 0.8, palette);
  if (full) dots(group, x, y - 24 * size - r * 0.95, r * 0.95, [palette.fruit, "#fde3ec"], 7, 2.6 * size);
}

function drawOlive(group, x, y, size, palette, full) {
  const r = 22 * size;
  // a short, twisted trunk
  shape("polygon", { points: `${x - 4 * size},${y} ${x - 6 * size},${y - 12 * size} ${x - 1 * size},${y - 22 * size} ${x},${y}`, fill: TRUNK.dark }, group);
  shape("polygon", { points: `${x},${y} ${x - 1 * size},${y - 22 * size} ${x + 5 * size},${y - 14 * size} ${x + 4 * size},${y}`, fill: TRUNK.light }, group);
  // a wide, flat crown made of several small clouds
  blob(group, x - r, y - 22 * size - r * 0.35, r * 0.55, palette);
  blob(group, x + r, y - 22 * size - r * 0.4, r * 0.55, palette);
  blob(group, x - r * 0.4, y - 22 * size - r * 0.75, r * 0.62, palette);
  blob(group, x + r * 0.45, y - 22 * size - r * 0.8, r * 0.6, palette);
  if (full && palette.fruit) dots(group, x, y - 22 * size - r * 0.55, r * 1.05, [palette.fruit], 5, 1.8 * size);
}

function drawOak(group, x, y, size, palette, full) {
  const r = 26 * size;
  trunk(group, x, y, 24 * size, 8 * size);
  blob(group, x - r * 0.6, y - 24 * size - r * 0.45, r * 0.6, palette);
  blob(group, x + r * 0.6, y - 24 * size - r * 0.45, r * 0.6, palette);
  blob(group, x - r * 0.3, y - 24 * size - r * 0.95, r * 0.62, palette);
  blob(group, x + r * 0.35, y - 24 * size - r * 1.0, r * 0.58, palette);
  blob(group, x, y - 24 * size - r * 0.55, r * 0.6, palette);
  if (full && palette.fruit) dots(group, x, y - 24 * size - r * 0.7, r * 0.8, [palette.fruit], 5, 2.6 * size);
}

function drawFlowerBush(group, x, y, size, palette, full) {
  const r = 16 * size;
  blob(group, x - r * 0.8, y - r * 0.55, r * 0.75, palette);
  blob(group, x + r * 0.8, y - r * 0.55, r * 0.75, palette);
  blob(group, x, y - r * 0.95, r * 0.95, palette);
  const flowers = full ? FLOWER_COLORS : FLOWER_COLORS.slice(2, 3);
  dots(group, x, y - r * 0.85, r * 1.1, flowers, full ? 7 : 3, 2.8 * size);
}

function drawTopiary(group, x, y, size, palette) {
  trunk(group, x, y, 40 * size, 4 * size);
  // clipped balls stacked on a stick: the tidy, geometric tree
  blob(group, x, y - 14 * size, 12 * size, palette);
  blob(group, x, y - 36 * size, 10 * size, palette);
  if (size >= 1) blob(group, x, y - 54 * size, 7.5 * size, palette);
}

// ---------- public helpers ----------

// Draw the tree of a category into a group. thirsty = dry colours, no fruit.
function drawSpecies(group, categoryId, x, y, { size = 1, full = true, thirsty = false } = {}) {
  const species = speciesFor(categoryId);
  const palette = thirsty ? DRY : species;
  species.draw(group, x, y, size, palette, full && !thirsty);
}

// A small picture of the category's tree: the mark of a topic in lists and headers
function topicSwatch(categoryId) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "-34 -78 68 80");
  svg.setAttribute("class", "swatch");
  svg.setAttribute("aria-hidden", "true");
  drawSpecies(svg, categoryId, 0, 0);
  return svg;
}
