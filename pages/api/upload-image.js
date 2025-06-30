import { put } from "@vercel/blob";
import formidable from "formidable";
import fs from "fs/promises";

export const config = {
  api: {
    bodyParser: false, // wichtig für formidable
  }
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
      if (!file) {
        return res.status(400).json({ error: "Keine Datei empfangen" });
      }

      const fileBuffer = await fs.readFile(file.filepath);
      const fileName = file.originalFilename;

      const blob = await put(fileName, fileBuffer, {
        access: "public",
        allowOverwrite: true
      });

      return res.status(200).json({ url: blob.url });
    } catch (uploadErr) {
      console.error("❌ Fehler beim Upload:", uploadErr);
      return res.status(500).json({ error: "Upload fehlgeschlagen", details: uploadErr.message });
    }
  });
}
