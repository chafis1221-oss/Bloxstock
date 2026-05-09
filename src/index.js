require("dotenv").config();
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const cron = require("node-cron");
const qrcode = require("qrcode-terminal");
const { scrapeStock } = require("./scraper");
const { formatStock } = require("./formatter");

// ── KONFIGURASI ─────────────────────────────────────────────
// Nomor tujuan untuk kirim stock otomatis (format: 628xxx@s.whatsapp.net)
// Bisa diisi lebih dari satu
const TARGET_NUMBERS = (process.env.TARGET_NUMBERS || "")
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);

// Jadwal kirim otomatis (default: tiap 4 jam, menyesuaikan reset normal stock)
// Format cron: menit jam * * *
// "0 */4 * * *" = setiap 4 jam (00:00, 04:00, 08:00, ...)
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 */4 * * *";

// Folder simpan session WA
const SESSION_DIR = "./auth";
// ────────────────────────────────────────────────────────────

let sock = null;
let isConnected = false;

async function sendToTargets(message) {
  if (!isConnected || !sock) {
    console.log("⚠️  Bot belum terhubung, pesan tidak dikirim.");
    return;
  }

  if (TARGET_NUMBERS.length === 0) {
    console.log("⚠️  TARGET_NUMBERS kosong, set di .env atau env variable.");
    return;
  }

  for (const number of TARGET_NUMBERS) {
    try {
      await sock.sendMessage(number, { text: message });
      console.log(`✅ Pesan terkirim ke ${number}`);
    } catch (err) {
      console.error(`❌ Gagal kirim ke ${number}:`, err.message);
    }
  }
}

async function fetchAndSend() {
  console.log("🔄 Mengambil data stock...");
  const data = await scrapeStock();
  const message = formatStock(data);
  await sendToTargets(message);
  return message;
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Blox Bot", "Chrome", "1.0.0"],
  });

  // Tampilkan QR code
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 Scan QR Code ini dengan WhatsApp:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      isConnected = false;
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("🔌 Koneksi terputus.", shouldReconnect ? "Reconnecting..." : "Logged out.");

      if (shouldReconnect) {
        setTimeout(startBot, 5000);
      }
    }

    if (connection === "open") {
      isConnected = true;
      console.log("✅ Bot WhatsApp terhubung!\n");

      // Kirim stock pertama kali saat connect
      console.log("📦 Mengambil stock pertama kali...");
      await fetchAndSend();
    }
  });

  // Simpan credentials
  sock.ev.on("creds.update", saveCreds);

  // Handle pesan masuk
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue; // Abaikan pesan dari bot sendiri

      const from = msg.key.remoteJid;
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";

      const command = text.trim().toLowerCase();

      // Command !stock
      if (command === "!stock") {
        console.log(`📨 Command !stock dari ${from}`);
        await sock.sendMessage(from, {
          text: "⏳ Sedang mengambil data stock, mohon tunggu...",
        });

        const data = await scrapeStock();
        const message = formatStock(data);

        await sock.sendMessage(from, { text: message });
        console.log(`✅ Stock terkirim ke ${from}`);
      }

      // Command !help
      if (command === "!help") {
        const help =
          `🤖 *Blox Fruits Stock Bot*\n\n` +
          `*Command tersedia:*\n` +
          `▸ \`!stock\` — Cek stock buah sekarang\n` +
          `▸ \`!help\` — Tampilkan bantuan ini\n\n` +
          `_Stock otomatis dikirim setiap 4 jam._`;
        await sock.sendMessage(from, { text: help });
      }
    }
  });
}

// ── CRON SCHEDULER ──────────────────────────────────────────
cron.schedule(CRON_SCHEDULE, async () => {
  console.log(`⏰ [CRON] Jadwal otomatis: ${new Date().toLocaleString("id-ID")}`);
  await fetchAndSend();
}, {
  timezone: "Asia/Jakarta",
});

console.log(`📅 Cron aktif: "${CRON_SCHEDULE}" (Asia/Jakarta)`);
console.log(`🎯 Target: ${TARGET_NUMBERS.length > 0 ? TARGET_NUMBERS.join(", ") : "(belum diset)"}\n`);

// Start bot
startBot().catch(console.error);
