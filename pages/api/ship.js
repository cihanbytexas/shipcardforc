import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST desteklenir" });
  }

  try {
    const {
      username1,
      username2,
      avatar1,
      avatar2,
      bar_color = "ff0055",
      number_color = "ffffff",
      banner,
      lovePercent = 75,
    } = req.body;

    if (!username1 || !username2 || !avatar1 || !avatar2) {
      return res.status(400).json({ error: "Eksik parametre" });
    }

    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Font yükleme
    registerFont(path.resolve("./public/fonts/Poppins-Bold.ttf"), {
      family: "Poppins",
    });

    // Arka plan (banner varsa)
    if (banner) {
      const bg = await loadImage(banner);
      ctx.drawImage(bg, 0, 0, width, height);
      ctx.filter = "blur(8px)";
      ctx.globalAlpha = 0.6;
      ctx.drawImage(bg, 0, 0, width, height);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#101010";
      ctx.fillRect(0, 0, width, height);
    }

    // Avatar yükleme
    const img1 = await loadImage(avatar1);
    const img2 = await loadImage(avatar2);

    const avatarSize = 150;
    const avatarY = 90;
    const avatarX1 = width / 2 - 250;
    const avatarX2 = width / 2 + 100;

    // Yuvarlak avatar çizimi
    const drawCircularImage = (img, x, y, size) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    };

    drawCircularImage(img1, avatarX1, avatarY, avatarSize);
    drawCircularImage(img2, avatarX2, avatarY, avatarSize);

    // İsim yazımı
    ctx.font = "bold 36px Poppins";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 5;

    ctx.fillText(username1, avatarX1 + avatarSize / 2, avatarY + avatarSize + 40);
    ctx.fillText(username2, avatarX2 + avatarSize / 2, avatarY + avatarSize + 40);
    ctx.shadowBlur = 0;

    // Bar konumu
    const barY = avatarY + avatarSize + 100;
    const barWidth = 500;
    const barHeight = 18;
    const barX = (width - barWidth) / 2;
    const radius = 9;

    // Yuvarlak bar
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

    // Boş bar arka planı
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    drawRoundedBar(barX, barY, barWidth, barHeight, radius);
    ctx.fill();

    // Dolu kısmı (yüzdeye göre)
    const filledWidth = (lovePercent / 100) * barWidth;
    ctx.fillStyle = `#${bar_color}`;
    ctx.shadowColor = `#${bar_color}`;
    ctx.shadowBlur = 10;
    drawRoundedBar(barX, barY, filledWidth, barHeight, radius);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Çerçeve
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    drawRoundedBar(barX, barY, barWidth, barHeight, radius);
    ctx.stroke();

    // Aşk yüzdesi
    ctx.font = "bold 42px Poppins";
    ctx.fillStyle = `#${number_color}`;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 8;
    ctx.fillText(`${lovePercent}%`, width / 2, barY + 60);

    // Gönder
    res.setHeader("Content-Type", "image/png");
    res.send(canvas.toBuffer());
  } catch (e) {
    console.error("Hata:", e);
    res.status(500).json({ error: e.message });
  }
}
