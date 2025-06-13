// pages/api/upload-image.js
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const { imageBase64, fileName } = req.body;

    if (!imageBase64 || !fileName) {
      return res.status(400).json({ message: "Missing imageBase64 or fileName" });
    }

    const buffer = Buffer.from(imageBase64, "base64");
    const blob = await put(`bilder/${Date.now()}_${fileName}`, buffer, {
      access: "public", // macht das Bild öffentlich zugänglich
      contentType: "image/jpeg",
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Upload failed", error: error.toString() });
  }
}

