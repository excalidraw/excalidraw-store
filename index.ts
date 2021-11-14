import { Storage } from "@google-cloud/storage";
import cors from "cors";
import express from "express";
import { nanoid } from "nanoid";

const PROJECT_NAME = process.env.GOOGLE_CLOUD_PROJECT || "excalidraw-json-dev";
const PROD = PROJECT_NAME === "excalidraw-json";
const LOCAL = process.env.NODE_ENV !== "production";
const BUCKET_NAME = PROD
  ? "excalidraw-json.appspot.com"
  : "excalidraw-json-dev.appspot.com";

const FILE_SIZE_LIMIT = 2 * 1024 * 1024;
const storage = new Storage(
  LOCAL
    ? {
        projectId: PROJECT_NAME,
        keyFilename: `${__dirname}/keys/${PROJECT_NAME}.json`,
      }
    : undefined
);

const bucket = storage.bucket(BUCKET_NAME);
const app = express();

let allowOrigins = [
  "excalidraw.vercel.app",
  "https://dai-shi.github.io",
  "https://excalidraw.com",
  "https://www.excalidraw.com",
];
if (!PROD) {
  allowOrigins.push("http://localhost:");
}

const corsGet = cors();
const corsPost = cors((req, callback) => {
  const origin = req.headers.origin;
  let isGood = false;
  if (origin) {
    for (const allowOrigin of allowOrigins) {
      if (origin.indexOf(allowOrigin) >= 0) {
        isGood = true;
        break;
      }
    }
  }
  callback(null, { origin: isGood });
});

app.get("/", (req, res) => res.sendFile(`${process.cwd()}/index.html`));

app.get("/api/v2/:key", corsGet, async (req, res) => {
  try {
    const key = req.params.key;
    const file = bucket.file(key);
    await file.getMetadata();
    res.status(200);
    res.setHeader("content-type", "application/octet-stream");
    file.createReadStream().pipe(res);
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "Could not find the file." });
  }
});

app.post("/api/v2/post/", corsPost, (req, res) => {
  try {
    let fileSize = 0;
    const id = nanoid();
    const blob = bucket.file(id);
    const blobStream = blob.createWriteStream({ resumable: false });

    blobStream.on("error", (error) => {
      console.error(error);
      res.status(500).json({ message: error.message });
    });

    blobStream.on("finish", async () => {
      res.status(200).json({
        id,
        data: `${LOCAL ? "http" : "https"}://${req.get("host")}/api/v2/${id}`,
      });
    });

    req.on("data", (chunk) => {
      blobStream.write(chunk);
      fileSize += chunk.length;
      if (fileSize > FILE_SIZE_LIMIT) {
        const error = {
          message: "Data is too large.",
          max_limit: FILE_SIZE_LIMIT,
        };
        blobStream.destroy();
        console.error(error);
        return res.status(413).json(error);
      }
    });
    req.on("end", () => {
      blobStream.end();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not upload the data." });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`http://localhost:${port}`));
