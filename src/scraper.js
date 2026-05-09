const puppeteer = require("puppeteer");

async function scrapeStock() {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath:
      "/data/data/com.termux/files/usr/bin/chromium-browser",
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

    // tunggu react render
    await new Promise((r) => setTimeout(r, 8000));

    const data = await page.evaluate(() => {
      const cards = [
        ...document.querySelectorAll(".flex.items-center.gap-3"),
      ];

      const fruits = cards
        .map((card) => {
          const lines = card.innerText
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);

          if (lines.length < 4) return null;

          return {
            name: lines[0],
            rarity: lines[1],
            price: lines[2],
            robux: lines[3],
          };
        })
        .filter(Boolean);

      const timers = [];

      document.querySelectorAll("*").forEach((el) => {
        if (el.children.length === 0) {
          const t = (el.innerText || "").trim();

          if (/^\d{2}:\d{2}:\d{2}$/.test(t)) {
            timers.push(t);
          }
        }
      });

      return {
        fruits,
        timers: [...new Set(timers)],
      };
    });

    const normal = data.fruits.slice(0, 3);
    const mirage = data.fruits.slice(3);

    return {
      success: true,
      timestamp: new Date().toISOString(),

      timer: {
        normal: data.timers[0] || null,
        mirage: data.timers[1] || null,
      },

      normal,
      mirage,
    };

  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeStock };
