import express from "express";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import morgan from "morgan";

const PROJECT_NAME = process.env.GOOGLE_CLOUD_PROJECT || "excalidraw-json-dev";
const PROD = PROJECT_NAME === "excalidraw-json";
const LOCAL = process.env.NODE_ENV !== "production";
const BUCKET_NAME = PROD
  ? "excalidraw-json.appspot.com"
  : "excalidraw-json-dev.appspot.com";

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

app.set("json spaces", 2);
app.use(morgan("tiny"));

const allowOrigins = [
  "http://localhost:",
  "https://www.excalidraw.com",
  "https://excalidraw.com",
  "excalidraw.vercel.app",
  "https://dai-shi.github.io",
];

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

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.get("/.delme", (req, res) => {
  res.json({ headers: req.headers, env: process.env });
});

app.get("/api/v2/:key", corsGet, async (req, res) => {
  try {
    const key = req.params.key;
    const file = bucket.file(key);
    const fileSize = (await file.getMetadata())[0].size;
    res.status(200);
    res.setHeader("content-type", "application/octet-stream");
    res.setHeader("content-length", fileSize);
    file.createReadStream().pipe(res);
  } catch (error) {
    console.error(error);
    res.status(404).json({
      message: "Could not find the file.",
    });
  }
});

app.post("/api/v2/post/", corsGet, (req, res) => {
  const id = uuid();
  try {
    const blob = bucket.file(id);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

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
    });
    req.on("end", () => {
      blobStream.end();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not upload the data.",
    });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("http://localhost:" + port, "dev =", LOCAL));

function uuid() {
  return uuidv4().replace(/-/g, "");
}
