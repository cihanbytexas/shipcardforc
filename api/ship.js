import { createCanvas, loadImage, registerFont } from "canvas";
import FormData from "form-data";
import axios from "axios";
import path from "path";

// Poppins fontu public/fonts içinde olmalı
const fontPath = path.resolve("./public/fonts/Poppins-Bold.ttf");
registerFont(fontPath, { family: "Poppins" });

const IMGBB_KEY = "BURAYA_IMGBB_KEYIN"; // kendi imgbb keyini buraya koy

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      user1Name = "User1",
      user1Avatar,
      user2Name = "User2",
      user2Avatar,
      shipPercent = 50,
      background
    } = req.body;

    // Dikdörtgen boyut
    const width = 1080;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Arka plan
    try {
      const bg = await loadImage(background);
      ctx.drawImage(bg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);
    }

    // Avatar boyutları ve konumu
    const avatarSize = 180;
    const padding = 40;

    // User1 avatar (sol)
    try {
      const avatar1Img = await loadImage(user1Avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(padding + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar1Img, padding, height / 2 - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
    } catch {}

    // User2 avatar (sağ)
    try {
      const avatar2Img = await loadImage(user2Avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(width - padding - avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar2Img, width - padding - avatarSize, height / 2 - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
    } catch {}

    // Ship yüzdesi kutusu (ortada)
    const boxWidth = 250;
    const boxHeight = 80;
    const boxX = width / 2 - boxWidth / 2;
    const boxY = height / 2 - boxHeight / 2;

    ctx.fillStyle = "#ff4d6d";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 40px Poppins`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${shipPercent}%`, width / 2, height / 2);

    // İsimler
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Poppins";
    ctx.textAlign = "left";
    ctx.fillText(user1Name, padding, height - padding);
    ctx.textAlign = "right";
    ctx.fillText(user2Name, width - padding, height - padding);

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
    res.status(500).json({ error: "Failed to generate ship image" });
  }
}
