(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  const VIEW_WIDTH = 320;
  const VIEW_HEIGHT = 180;
  const world = { width: 640, height: 420 };

  const player = {
    x: 280,
    y: 218,
    speed: 78,
    facing: "down",
    moving: true
  };

  const camera = {
    x: player.x - VIEW_WIDTH / 2,
    y: player.y - VIEW_HEIGHT / 2
  };

  const keys = new Set();

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  function pixel(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), width, height);
  }

  // Seeded randomness keeps the landscape consistent each time.
  let seed = 17;

  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  const grass = Array.from({ length: 230 }, () => ({
    x: random() * world.width,
    y: random() * world.height,
    shade: random()
  }));

  const trees = [];

  for (let x = 24; x < world.width; x += 38) {
    trees.push({
      x,
      y: 24 + random() * 14,
      size: 1 + Math.floor(random() * 2)
    });

    trees.push({
      x: x + 12,
      y: world.height - 34 - random() * 14,
      size: 1 + Math.floor(random() * 2)
    });
  }

  for (let i = 0; i < 40; i++) {
    const rightSide = i % 2 === 0;
    const edge = rightSide ? world.width : 0;

    trees.push({
      x: edge + (rightSide ? -random() * 22 : random() * 22),
      y: 55 + random() * (world.height - 110),
      size: 1 + Math.floor(random() * 2)
    });
  }

  function drawTree(x, y, size) {
    pixel(x - 7 * size + 2, y + 8 * size, 15 * size, 4 * size, "#26372b");
    pixel(x - 2 * size, y + size, 4 * size, 10 * size, "#574633");
    pixel(x - 5 * size, y - 5 * size, 10 * size, 5 * size, "#294332");
    pixel(x - 7 * size, y - 2 * size, 14 * size, 5 * size, "#31503a");
    pixel(x - 9 * size, y + size, 18 * size, 5 * size, "#263d31");
    pixel(x - 3 * size, y - 5 * size, 3 * size, 2 * size, "#3b5c40");
  }

  function drawHester(time) {
    const x = Math.round(player.x - camera.x);
    const y = Math.round(player.y - camera.y);
    const bob = player.moving ? (Math.sin(time * 0.018) | 0) : 0;

    // Shadow, auburn hair, face, dress, and scarlet letter.
    pixel(x - 5, y + 6 + bob, 11, 3, "#20271f");
    pixel(x - 4, y - 7 + bob, 8, 5, "#713d2b");
    pixel(x - 5, y - 4 + bob, 10, 4, "#9b5634");
    pixel(x - 3, y - 3 + bob, 6, 4, "#e1b88a");
    pixel(x - 4, y + 1 + bob, 9, 9, "#353b43");
    pixel(x - 5, y + 2 + bob, 11, 5, "#45434a");
    pixel(x - 4, y + 4 + bob, 2, 5, "#8e2630");
    pixel(x - 3, y + 4 + bob, 1, 3, "#c84a46");

    const step = player.moving && Math.floor(time / 130) % 2;
    pixel(x - 4, y + 10 + bob, 3, 2, "#282c30");
    pixel(x + (step ? 2 : 1), y + 10 + bob, 3, 2, "#282c30");
  }

  function draw(time) {
    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.save();
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

    pixel(0, 0, world.width, world.height, "#596342");

    for (const spot of grass) {
      const color = spot.shade > 0.5 ? "#68704a" : "#4f5c3f";
      pixel(spot.x, spot.y, 1, 1, color);
    }

    // Worn path through the clearing.
    pixel(266, 0, 107, world.height, "#74684d");
    pixel(273, 0, 91, world.height, "#817456");
    pixel(282, 0, 4, world.height, "#8b7a5a");

    for (let y = 0; y < world.height; y += 18) {
      pixel(280 + (y % 3) * 15, y, 2, 1, "#695e48");
      pixel(333 - (y % 4) * 11, y + 8, 3, 1, "#91815e");
    }

    // Simple world boundary.
    pixel(0, 0, world.width, 7, "#303c31");
    pixel(0, world.height - 7, world.width, 7, "#303c31");
    pixel(0, 0, 7, world.height, "#303c31");
    pixel(world.width - 7, 0, 7, world.height, "#303c31");

    for (const tree of trees) {
      drawTree(tree.x, tree.y, tree.size);
    }

    // Fallen branch and stones.
    pixel(212, 161, 17, 3, "#514332");
    pixel(217, 158, 2, 3, "#71563a");
    pixel(396, 264, 5, 3, "#77735c");
    pixel(404, 267, 3, 2, "#77735c");

    drawHester(time);
    ctx.restore();

    // Nameplate.
    ctx.fillStyle = "rgba(20, 22, 19, 0.72)";
    ctx.fillRect(7, 7, 66, 13);
    ctx.fillStyle = "#ddd1b2";
    ctx.font = "8px monospace";
    ctx.fillText("Hester Prynne", 11, 16);
  }

  let previousTime = performance.now();

  function frame(time) {
    const deltaTime = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;

    let dx = 0;
    let dy = 0;

    if (keys.has("ArrowLeft") || keys.has("a")) dx--;
    if (keys.has("ArrowRight") || keys.has("d")) dx++;
    if (keys.has("ArrowUp") || keys.has("w")) dy--;
    if (keys.has("ArrowDown") || keys.has("s")) dy++;

    player.moving = dx !== 0 || dy !== 0;

    // Keep diagonal movement at the same speed.
    if (dx && dy) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    if (dx || dy) {
      player.facing =
        Math.abs(dx) > Math.abs(dy)
          ? (dx < 0 ? "left" : "right")
          : (dy < 0 ? "up" : "down");
    }

    player.x = clamp(
      player.x + dx * player.speed * deltaTime,
      14,
      world.width - 14
    );

    player.y = clamp(
      player.y + dy * player.speed * deltaTime,
      17,
      world.height - 17
    );

    // Ease the camera toward Hester and keep it inside the world.
    const targetX = clamp(player.x - VIEW_WIDTH / 2, 0, world.width - VIEW_WIDTH);
    const targetY = clamp(player.y - VIEW_HEIGHT / 2, 0, world.height - VIEW_HEIGHT);

    camera.x += (targetX - camera.x) * Math.min(1, deltaTime * 7);
    camera.y += (targetY - camera.y) * Math.min(1, deltaTime * 7);

    draw(time);
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }

    keys.add(event.key.toLowerCase());
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  window.addEventListener("blur", () => keys.clear());

  requestAnimationFrame(frame);
})();