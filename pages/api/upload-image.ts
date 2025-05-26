import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "./firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // erlaubt größere Bilder
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const { file, filename } = req.body;

    if (!file || !filename) {
      return res.status(400).json({ message: "Missing file or filename" });
    }

    const buffer = Buffer.from(file, "base64");
    const blob = bucket.file(`bilder/${filename}`);
    const uuid = uuidv4();

    await blob.save(buffer, {
      metadata: {
        contentType: "image/jpeg", // passe an, falls PNG
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      blob.name
    )}?alt=media&token=${uuid}`;

    res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error });
  }
}
