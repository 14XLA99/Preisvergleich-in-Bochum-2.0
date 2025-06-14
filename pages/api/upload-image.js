// pages/api/upload-image.js

const { put } = require("@vercel/blob");

// Unser Upload-Endpoint: /api/upload-image
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { imageBase64, fileName } = req.body;
  if (!imageBase64 || !fileName) {
    return res.status(400).json({ message: "Missing imageBase64 or fileName" });
  }

  try {
    // Base64 → Buffer (strippe evtl. "data:...;base64,"-Prefix)
    const base64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;
    const buffer = Buffer.from(base64, "base64");

    // Upload an Vercel Blob
    // fileName sollte keinen Pfad enthalten, nur z.B. "markt_123.jpg"
    const blob = await put(fileName, buffer, {
      access: "public",
    });

    // blob.url ist die public URL
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return res
      .status(500)
      .json({ message: "Upload failed", error: err.message });
  }
};
