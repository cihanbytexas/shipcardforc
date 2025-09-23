import express from "express";
import { createCanvas, loadImage, registerFont } from "canvas";
import FormData from "form-data";
import axios from "axios";
import path from "path";

const app = express();
app.use(express.json());

const IMGBB_KEY = "BURAYA_IMGBB_KEYIN"; // imgbb key

// Fontu yükle
const fontPath = path.resolve("./public/fonts/Poppins-Bold.ttf");
registerFont(fontPath, { family: "Poppins" });

app.post("/ship", async (req, res) => {
  try {
    const {
      user1Name = "User1",
      user2Name = "User2",
      user1Avatar,
      user2Avatar,
      background
    } = req.body;

    // Canvas boyutu
    const width = 1080;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Arka plan
    try {
      const bg = await loadImage(background);
      ctx.drawImage(bg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = "#2c2f33";
      ctx.fillRect(0, 0, width, height);
    }

    // Avatar boyutu
    const avatarSize = 150;

    // Sol avatar
    try {
      const avatar1 = await loadImage(user1Avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(150, height / 2, avatarSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar1, 150 - avatarSize/2, height/2 - avatarSize/2, avatarSize, avatarSize);
      ctx.restore();
    } catch {}

    // Sağ avatar
    try {
      const avatar2 = await loadImage(user2Avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(width - 150, height / 2, avatarSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar2, width - 150 - avatarSize/2, height/2 - avatarSize/2, avatarSize, avatarSize);
      ctx.restore();
    } catch {}

    // İsimler
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 30px Poppins";
    ctx.textAlign = "center";
    ctx.fillText(user1Name, 150, height/2 + avatarSize/2 + 40);
    ctx.fillText(user2Name, width - 150, height/2 + avatarSize/2 + 40);

    // Ship yüzdesi
    const shipPercent = Math.floor(Math.random() * 101);
    ctx.fillStyle = "#FF69B4";
    ctx.font = "bold 60px Poppins";
    ctx.fillText(`${shipPercent}%`, width/2, height/2);

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
});

app.listen(3000, () => console.log("Ship API running on port 3000"));
