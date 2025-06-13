// pages/api/upload-image.js
import { bucket } from "./firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

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

    // Buffer aus Base64
    const buffer = Buffer.from(imageBase64, "base64");
    const uniqueName = `${Date.now()}_${fileName}`;
    const file = bucket.file(`bilder/${uniqueName}`);
    const uuid = uuidv4();

    // Speichern
    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: { firebaseStorageDownloadTokens: uuid },
      },
      public: true,           // <── macht die Datei öffentlich
      validation: "md5",
    });

    // Direkte öffentliche URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/bilder/${encodeURIComponent(uniqueName)}`;

    return res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Upload failed", error: error.toString() });
  }
}
