// pages/api/upload-image.js
import formidable from "formidable";
import fs from "fs/promises";
import { put } from "@vercel/blob";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Fehler beim Parsen:", err);
      return res.status(400).json({ error: "Fehler beim Parsen" });
    }

    try {
      const file = files.file;
      if (!file || !file.filepath || !file.originalFilename) {
        return res.status(400).json({ error: "Datei fehlt oder ungültig" });
      }

      const buffer = await fs.readFile(file.filepath);
      const blob = await put(file.originalFilename, buffer, {
        access: "public",
        allowOverwrite: true
      });

      res.status(200).json({ url: blob.url });
    } catch (error) {
      console.error("❌ Fehler beim Upload:", error);
      res.status(500).json({ error: "Upload fehlgeschlagen", details: error.message });
    }
  });
}
