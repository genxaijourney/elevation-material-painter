// Vercel serverless function: Telegram QC notification for the Painter.
// The painter page POSTs here when a user saves or exports a painted design;
// we forward an album (original CAD + colored map) to the owner's Telegram.
// Dormant unless TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID env vars are set.
// Always answers 200 — a notification problem must never surface in the app.

const MAX_PHOTO_BYTES = 9500000;

function decode(img) {
  const m = typeof img?.dataUrl === "string" && img.dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!m) return null;
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > MAX_PHOTO_BYTES) return null;
  return { bytes, mime: m[1], label: typeof img.label === "string" ? img.label.slice(0, 40) : "image" };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(200).json({ ok: false, off: true });

  try {
    const { event = "activity", project = "", images = [] } = req.body || {};
    const photos = images.map(decode).filter(Boolean).slice(0, 4);
    const when = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    const order = photos.length > 1 ? [`📸 ${photos.map((p, i) => `${i + 1}) ${p.label}`).join("  ")}`] : [];
    const caption = [
      `🖌️ Elevation Painter — ${String(event).slice(0, 60)}`,
      ...(project ? [`📁 ${String(project).slice(0, 80)}`] : []),
      ...order,
      `🕐 ${when} ET`,
    ].join("\n").slice(0, 1000);

    if (photos.length >= 2) {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("media", JSON.stringify(photos.map((p, i) => ({
        type: "photo",
        media: `attach://p${i}`,
        ...(i === 0 ? { caption } : {}),
      }))));
      photos.forEach((p, i) => form.append(`p${i}`, new Blob([new Uint8Array(p.bytes)], { type: p.mime }), `p${i}.png`));
      await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, { method: "POST", body: form });
    } else if (photos.length === 1) {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("caption", caption);
      form.append("photo", new Blob([new Uint8Array(photos[0].bytes)], { type: photos[0].mime }), "p0.png");
      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body: form });
    } else {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: caption }),
      });
    }
  } catch (e) {
    /* best-effort only */
  }
  return res.status(200).json({ ok: true });
};
