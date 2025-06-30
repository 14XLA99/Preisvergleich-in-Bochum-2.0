import { put } from "@vercel/blob";
import formidable from "formidable";
import fs from "fs/promises";

export const config = {
  api: {
    bodyParser: false,
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  const form = formidable({ multiples: false });

  try {
    const [fields, files] = await form.parse(req);

    const file = files.file;
    if (!file || !file.filepath || !file.originalFilename) {
      return res.status(400).json({ error: "Datei fehlt oder ungültig" });
    }

    const fileBuffer = await fs.readFile(file.filepath);
    const blob = await put(file.originalFilename, fileBuffer, {
      access: "public",
      allowOverwrite: true,
    });

    return res.status(200).json({ url: blob.url });

  } catch (err) {
    console.error("❌ Upload fehlgeschlagen:", err);
    return res.status(500).json({ error: "Upload fehlgeschlagen", details: err.message });
  }
}
