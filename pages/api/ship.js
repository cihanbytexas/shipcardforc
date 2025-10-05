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
    const { username1, username2, avatar1, avatar2, banner } = req.body;

    if (!username1 || !username2 || !avatar1 || !avatar2) {
      return res.status(400).json({ error: "Eksik parametreler" });
    }

    const width = 800;
    const height = 300;
    const avatarSize = 180;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Arka plan
    const bannerUrl = banner || "https://i.ibb.co/sKtpPR1/default-banner.jpg";
    let bg;
    try { bg = await loadImage(encodeURI(bannerUrl)); } 
    catch { bg = await loadImage("https://i.ibb.co/sKtpPR1/default-banner.jpg"); }
    ctx.filter = "blur(4px)";
    ctx.drawImage(bg, 0, 0, width, height);
    ctx.filter = "none";

    // Avatarlar
    let avatarLeft, avatarRight;
    try { avatarLeft = await loadImage(encodeURI(avatar1)); } 
    catch { avatarLeft = await loadImage("https://i.ibb.co/sKtpPR1/default-avatar.png"); }
    try { avatarRight = await loadImage(encodeURI(avatar2)); } 
    catch { avatarRight = await loadImage("https://i.ibb.co/sKtpPR1/default-avatar.png"); }

    // Sol avatar + gölge
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(160, 150, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarLeft, 80, 70, avatarSize, avatarSize);
    ctx.restore();

    // Sağ avatar + gölge
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(640, 150, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarRight, 560, 70, avatarSize, avatarSize);
    ctx.restore();

    // Kullanıcı isimleri hizalı
    ctx.font = "bold 36px Poppins";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(username1, 160, 150 + avatarSize / 2 + 30);
    ctx.fillText(username2, 640, 150 + avatarSize / 2 + 30);

    // Ortadaki aşk yüzdesi + gradient + glow
    const lovePercent = Math.floor(Math.random() * 101);
    const gradientText = ctx.createLinearGradient(320, 0, 480, 0);
    gradientText.addColorStop(0, "#ff4d6d");
    gradientText.addColorStop(1, "#ffb86c");
    ctx.font = "bold 52px Poppins";
    ctx.fillStyle = gradientText;
    ctx.shadowColor = "rgba(255,77,109,0.8)";
    ctx.shadowBlur = 20;
    ctx.fillText(`${lovePercent}%`, width / 2, 170);
    ctx.shadowBlur = 0;

    // Alt progress bar (gradient + glow + border radius)
    const barWidth = 500;
    const barHeight = 14;
    const barX = (width - barWidth) / 2;
    const barY = 250;
    const radius = 7; // rounded corners

    // Bar arka plan
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.moveTo(barX + radius, barY);
    ctx.lineTo(barX + barWidth - radius, barY);
    ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + radius);
    ctx.lineTo(barX + barWidth, barY + barHeight - radius);
    ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - radius, barY + barHeight);
    ctx.lineTo(barX + radius, barY + barHeight);
    ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - radius);
    ctx.lineTo(barX, barY + radius);
    ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
    ctx.closePath();
    ctx.fill();

    // Gradient doluluk
    const gradientBar = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradientBar.addColorStop(0, "#ff4d6d");
    gradientBar.addColorStop(1, "#ffb86c");
    ctx.fillStyle = gradientBar;
    ctx.shadowColor = "rgba(255,77,109,0.8)";
    ctx.shadowBlur = 8;

    // Doluluk çizimi
    const filledWidth = (lovePercent / 100) * barWidth;
    ctx.beginPath();
    ctx.moveTo(barX + radius, barY);
    ctx.lineTo(barX + filledWidth - radius, barY);
    ctx.quadraticCurveTo(barX + filledWidth, barY, barX + filledWidth, barY + radius);
    ctx.lineTo(barX + filledWidth, barY + barHeight - radius);
    ctx.quadraticCurveTo(barX + filledWidth, barY + barHeight, barX + filledWidth - radius, barY + barHeight);
    ctx.lineTo(barX + radius, barY + barHeight);
    ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - radius);
    ctx.lineTo(barX, barY + radius);
    ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bar border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(barX + radius, barY);
    ctx.lineTo(barX + barWidth - radius, barY);
    ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + radius);
    ctx.lineTo(barX + barWidth, barY + barHeight - radius);
    ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - radius, barY + barHeight);
    ctx.lineTo(barX + radius, barY + barHeight);
    ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - radius);
    ctx.lineTo(barX, barY + radius);
    ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
    ctx.closePath();
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
