import { bucket } from "./firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

// 🔒 Optionales Passwort (zur späteren Aktivierung)
// const UPLOAD_SECRET = "deinSicheresPasswort123";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  // 🔒 Passwortschutz – derzeit deaktiviert
  /*
  if (req.headers.authorization !== UPLOAD_SECRET) {
    return res.status(403).json({ message: "Nicht erlaubt – falsches Passwort" });
  }
  */

  try {
    const { imageBase64, fileName } = req.body;

    if (!imageBase64 || !fileName) {
      return res.status(400).json({ message: "Missing imageBase64 or fileName" });
    }

    const buffer = Buffer.from(imageBase64, "base64");
    const file = bucket.file(`bilder/${fileName}`);
    const uuid = uuidv4();

    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      file.name
    )}?alt=media&token=${uuid}`;

    res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error });
  }
}
