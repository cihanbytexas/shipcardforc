import { createCanvas, loadImage, registerFont } from "canvas";
import axios from "axios";
import FormData from "form-data";
import path from "path";
import fs from "fs";

const IMGBB_KEY = "b9db5cf8217dccada264cff99e9742bd";

// Font
const fontPath = path.resolve("./public/fonts/Poppins-Bold.ttf");
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: "Poppins" });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  try {
    const {
      username1,
      username2,
      avatar1,
      avatar2,
      banner,
      bar_color = "ff4d6d",
      number_color = "ff4d6d",
    } = req.body;

    if (!username1 || !username2 || !avatar1 || !avatar2) {
      return res.status(400).json({ error: "Eksik parametreler" });
    }

    const width = 800;
    const height = 300;
    const avatarSize = 180;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Arka plan
    const bannerUrl = banner || "https://i.ibb.co/sKtpPR1/default-banner.jpg";
    let bg;
    try { bg = await loadImage(encodeURI(bannerUrl)); }
    catch { bg = await loadImage("https://i.ibb.co/sKtpPR1/default-banner.jpg"); }
    ctx.filter = "blur(4px)";
    ctx.drawImage(bg, 0, 0, width, height);
    ctx.filter = "none";

    // Avatarlar
    const loadAvatar = async (url) => {
      try { return await loadImage(encodeURI(url)); }
      catch { return await loadImage("https://i.ibb.co/sKtpPR1/default-avatar.png"); }
    };
    const avatarLeft = await loadAvatar(avatar1);
    const avatarRight = await loadAvatar(avatar2);

    // Avatar çizimi
    const drawAvatar = (image, x, y) => {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, x - avatarSize / 2, y - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
    };
    drawAvatar(avatarLeft, 160, 150);
    drawAvatar(avatarRight, 640, 150);

    // Kullanıcı isimleri
    const drawUsername = (name, x, y) => {
      const maxLength = 20;
      let displayName = name.length > maxLength ? name.slice(0, maxLength - 3) + "..." : name;
      ctx.font = "bold 36px Poppins";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(displayName, x, y);
    };
    drawUsername(username1, 160, 150 + avatarSize / 2 + 40);
    drawUsername(username2, 640, 150 + avatarSize / 2 + 40);

    // Aşk yüzdesi
    const lovePercent = Math.floor(Math.random() * 101);
    const gradientText = ctx.createLinearGradient(320, 0, 480, 0);
    gradientText.addColorStop(0, `#${number_color}`);
    gradientText.addColorStop(1, `#${number_color}`);
    ctx.font = "bold 52px Poppins";
    ctx.fillStyle = gradientText;
    const r = parseInt(number_color.slice(0,2),16);
    const g = parseInt(number_color.slice(2,4),16);
    const b = parseInt(number_color.slice(4,6),16);
    ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
    ctx.shadowBlur = 20;
    ctx.fillText(`${lovePercent}%`, width / 2, 170);
    ctx.shadowBlur = 0;

    // Alt progress bar
    const barWidth = 500;
    const barHeight = 14;
    const barX = (width - barWidth) / 2;
    const barY = 260;
    const radius = 7;

    const drawRoundedBar = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // Bar arka plan
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    drawRoundedBar(barX, barY, barWidth, barHeight, radius);
    ctx.fill();

    // Bar doluluk
    const gradientBar = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradientBar.addColorStop(0, `#${bar_color}`);
    gradientBar.addColorStop(1, `#${bar_color}`);
    ctx.fillStyle = gradientBar;
    ctx.shadowColor = `rgba(${parseInt(bar_color.slice(0,2),16)},${parseInt(bar_color.slice(2,4),16)},${parseInt(bar_color.slice(4,6),16)},0.8)`;
    ctx.shadowBlur = 8;

    drawRoundedBar(barX, barY, (lovePercent/100)*barWidth, barHeight, radius);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bar border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    drawRoundedBar(barX, barY, barWidth, barHeight, radius);
    ctx.stroke();

    // PNG → IMGBB
    const buffer = canvas.toBuffer("image/png");
    const form = new FormData();
    form.append("image", buffer.toString("base64"));

    const uploadRes = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
      form,
      { headers: form.getHeaders() }
    );

    const imageUrl = uploadRes.data?.data?.url;
    if (!imageUrl) throw new Error("IMGBB upload başarısız");

    return res.status(200).json({ success: true, lovePercent, image: imageUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
