const puppeteer = require("puppeteer");

const FRUIT_KEYWORDS = [
  "Dragon", "Leopard", "Kitsune", "Venom", "Mammoth", "Gas",
  "Spirit", "Dough", "Shadow", "Blizzard", "Magma", "Quake",
  "Buddha", "Spider", "Gravity", "Phoenix", "Rumble", "Paw",
  "Flame", "Ice", "Light", "Smoke", "Spike", "Chop",
  "Spring", "Bomb", "Rocket", "Spin", "Barrier", "Door",
  "Diamond", "Love", "Rubber", "Sand", "Dark", "Revive",
  "Falcon", "Plant", "Sonic", "String", "Pika", "Ghost",
  "Control", "Ope", "Mochi", "Yeti", "T-Rex", "Nature",
  "Natural", "Human", "Bari", "Gum", "Kilo", "Slow",
  "Elemental", "Beast", "Blade",
];

const SKIP_WORDS = [
  "fruityblox", "sign in", "browse trades", "post trade", "discord",
  "more", "privacy policy", "terms of service", "blox fruits stock",
  "live blox", "the normal", "the mirage", "check back",
  "updates automatically", "next reset", "©", "2026", "faq", "home", "stock",
];

function parseSection(sectionLines) {
  const fruits = [];
  let currentFruit = null;

  for (const line of sectionLines) {
    const lower = line.toLowerCase();

    if (SKIP_WORDS.some((w) => lower.includes(w))) break;
    if (lower === "normal" || lower === "mirage") break;
    if (/^\d{2}:\d{2}:\d{2}$/.test(line)) continue;

    const isFruit = FRUIT_KEYWORDS.some((f) => lower === f.toLowerCase());
    const isCaps = /^[A-Z][A-Z\s\-]+$/.test(line) && line.length > 2 && line.length < 30;
    const isPrice = /^[\d,]+$/.test(line);

    if (isFruit || isCaps) {
      currentFruit = { name: line, price: null };
      fruits.push(currentFruit);
    } else if (isPrice && currentFruit) {
      currentFruit.price = line;
    }
  }

  return fruits;
}

async function scrapeStock() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  try {
    await page.goto("https://fruityblox.com/stock", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await new Promise((r) => setTimeout(r, 10000));

    // Scroll untuk trigger lazy-load
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const t = setInterval(() => {
          window.scrollBy(0, 300);
          totalHeight += 300;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(t);
            resolve();
          }
        }, 150);
      });
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 2000));

    const data = await page.evaluate(() => {
      const rawText = document.body.innerText;
      const timers = [];

      document.querySelectorAll("*").forEach((el) => {
        if (el.children.length === 0) {
          const t = (el.innerText || "").trim();
          if (/^\d{2}:\d{2}:\d{2}$/.test(t)) timers.push(t);
        }
      });

      return { rawText, timers: [...new Set(timers)] };
    });

    const lines = data.rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    let normalStart = -1;
    let mirageStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase() === "normal" && normalStart === -1) normalStart = i;
      if (lines[i].toLowerCase() === "mirage" && mirageStart === -1) mirageStart = i;
    }

    const normalLines = normalStart !== -1
      ? lines.slice(normalStart + 1, mirageStart !== -1 ? mirageStart : undefined)
      : [];
    const mirageLines = mirageStart !== -1
      ? lines.slice(mirageStart + 1)
      : [];

    return {
      success: true,
      timestamp: new Date().toISOString(),
      timer: {
        normal: data.timers[0] || null,
        mirage: data.timers[1] || null,
      },
      normal: parseSection(normalLines),
      mirage: parseSection(mirageLines),
    };

  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeStock };
