import { bucket } from "@/pages/api/firebaseAdmin";
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
    return res.status(405).json({ error: "Only POST method is allowed" });
  }

  try {
    const { imageBase64, fileName } = req.body;

    const buffer = Buffer.from(imageBase64, "base64");
    const uuid = uuidv4();

    const file = bucket.file(`bilder/${fileName}`);
    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        },
      },
      public: true,
      validation: "md5",
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      file.name
    )}?alt=media&token=${uuid}`;

    res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error("Fehler beim Bild-Upload:", error);
    res.status(500).json({ error: "Fehler beim Bild-Upload" });
  }
}
