function formatStock(data) {
  if (!data.success) {
    return `❌ Gagal mengambil data stock.\nError: ${data.error}`;
  }

  const { normal, mirage, timer, timestamp } = data;

  const time = new Date(timestamp).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let msg = "";
  msg += `🍎 *BLOX FRUITS STOCK*\n`;
  msg += `🕐 ${time} WIB\n`;
  msg += `${"─".repeat(28)}\n\n`;

  // Normal Stock
  msg += `🟢 *NORMAL STOCK*\n`;
  if (timer.normal) msg += `⏱️ Reset dalam: *${timer.normal}*\n`;
  msg += `\n`;

  if (normal.length > 0) {
    normal.forEach((f) => {
      const price = f.price
        ? ` — 💰 ${Number(f.price.replace(/,/g, "")).toLocaleString("id-ID")} Beli`
        : "";
      msg += `▸ ${f.name}${price}\n`;
    });
  } else {
    msg += `▸ (Tidak ada data)\n`;
  }

  msg += `\n${"─".repeat(28)}\n\n`;

  // Mirage Stock
  msg += `🔵 *MIRAGE STOCK*\n`;
  if (timer.mirage) msg += `⏱️ Reset dalam: *${timer.mirage}*\n`;
  msg += `\n`;

  if (mirage.length > 0) {
    mirage.forEach((f) => {
      const price = f.price
        ? ` — 💰 ${Number(f.price.replace(/,/g, "")).toLocaleString("id-ID")} Beli`
        : "";
      msg += `▸ ${f.name}${price}\n`;
    });
  } else {
    msg += `▸ (Tidak ada data)\n`;
  }

  msg += `\n${"─".repeat(28)}\n`;
  msg += `_📡 Data dari fruityblox.com_`;

  return msg;
}

module.exports = { formatStock };
