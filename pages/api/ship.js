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
    const avatarSize = 120;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Arka plan
    const bannerUrl = banner || "https://i.ibb.co/sKtpPR1/default-banner.jpg";
    const bg = await loadImage(bannerUrl);
    ctx.drawImage(bg, 0, 0, width, height);

    // Avatarlar
    const avatarLeft = await loadImage(avatar1);
    const avatarRight = await loadImage(avatar2);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(160, 150, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarLeft, 100, 90, avatarSize, avatarSize);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(640, 150, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarRight, 580, 90, avatarSize, avatarSize);
    ctx.restore();

    // Kullanıcı isimleri
    ctx.font = "bold 24px Poppins";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(username1, 160, 250);
    ctx.fillText(username2, 640, 250);

    // Aşk yüzdesi
    const lovePercent = Math.floor(Math.random() * 101);
    const gradient = ctx.createLinearGradient(320, 0, 480, 0);
    gradient.addColorStop(0, "#ff4d6d");
    gradient.addColorStop(1, "#ffb86c");
    ctx.font = "bold 48px Poppins";
    ctx.fillStyle = gradient;
    ctx.fillText(`${lovePercent}%`, width / 2, 170);

    // Alt glow
    ctx.beginPath();
    ctx.moveTo(150, 280);
    ctx.lineTo(650, 280);
    ctx.strokeStyle = "rgba(255, 77, 109, 0.5)";
    ctx.lineWidth = 6;
    ctx.shadowColor = "rgba(255, 77, 109, 0.8)";
    ctx.shadowBlur = 15;
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
