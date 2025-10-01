import { createCanvas, loadImage, registerFont } from "canvas";
import FormData from "form-data";
import axios from "axios";
import path from "path";

// Fontu public/fonts içine koy
const fontPath = path.resolve("./public/fonts/Poppins-Bold.ttf");
registerFont(fontPath, { family: "Poppins" });

const IMGBB_KEY = "b9db5cf8217dccada264cff99e9742bd"; // imgbb API key

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      avatar1,
      avatar2,
      username1 = "User1",
      username2 = "User2",
      background,
      lovePercent = 50,
      textColor = "#FFFFFF"
    } = req.body;

    // Canvas ayarları
    const width = 1200;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    try {
      const bg = await loadImage(background);
      ctx.drawImage(bg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);
    }

    // Avatar boyutu ve konum
    const avatarSize = 200;
    const avatarY = height / 2 - avatarSize / 2;
    const avatarPadding = 50;

    // Avatar1 - Sol
    try {
      const img1 = await loadImage(avatar1);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarPadding + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img1, avatarPadding, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Username1 üstüne yaz
      ctx.fillStyle = textColor;
      ctx.font = `bold 30px Poppins`;
      ctx.textAlign = "center";
      ctx.fillText(username1, avatarPadding + avatarSize / 2, avatarY - 10);
    } catch {}

    // Avatar2 - Sağ
    try {
      const img2 = await loadImage(avatar2);
      const avatarX2 = width - avatarSize - avatarPadding;
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX2 + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img2, avatarX2, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Username2 üstüne yaz
      ctx.fillStyle = textColor;
      ctx.font = `bold 30px Poppins`;
      ctx.textAlign = "center";
      ctx.fillText(username2, avatarX2 + avatarSize / 2, avatarY - 10);
    } catch {}

    // Ortadaki aşk yüzdesi
    ctx.fillStyle = textColor;
    ctx.font = `bold 60px Poppins`;
    ctx.textAlign = "center";
    ctx.fillText(`❤️ ${lovePercent}% ❤️`, width / 2, height / 2 + 20);

    // Canvas → Buffer → Base64
    const buffer = canvas.toBuffer("image/png");
    const base64 = buffer.toString("base64");

    // imgbb upload
    const form = new FormData();
    form.append("image", base64);

    const imgbbRes = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
      form,
      { headers: form.getHeaders() }
    );

    res.status(200).json({ image: imgbbRes.data.data.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate image" });
  }
}
