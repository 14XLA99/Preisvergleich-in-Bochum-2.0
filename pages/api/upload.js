import { bucket } from "./firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import * as busboy from "busboy";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const bb = busboy({ headers: req.headers });
  let uploadUrl = "";

  bb.on("file", (_name, file, info) => {
    const { filename, mimeType } = info;
    const uniqueFilename = `${Date.now()}_${filename}`;
    const fileUpload = bucket.file(`bilder/${uniqueFilename}`);

    const stream = file.pipe(fileUpload.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
    }));

    stream.on("error", (err) => {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    });

    stream.on("finish", async () => {
      const [url] = await fileUpload.getSignedUrl({
        action: "read",
        expires: "03-01-2030",
      });

      uploadUrl = url;
      res.status(200).json({ url });
    });
  });

  req.pipe(bb);
}
