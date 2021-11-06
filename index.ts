import express from "express";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

const PROJECT_NAME = process.env.GOOGLE_CLOUD_PROJECT || "excalidraw-json-dev";
const PROD = PROJECT_NAME === "excalidraw-json";
const DEV = !PROD;
const BUCKET_NAME = PROD
  ? "excalidraw-json.appspot.com"
  : "excalidraw-json-dev.appspot.com";

const storage = new Storage({
  projectId: PROJECT_NAME,
  keyFilename: `${__dirname}/keys/${PROJECT_NAME}.json`,
});
const bucket = storage.bucket(BUCKET_NAME);

const app = express();

app.set("json spaces", 2);

const corsOptions = {
  origin: DEV ? "*" : "excalidraw.com",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.get("/.delme", (req, res) => {
  res.json(process.env);
});

app.get("/api/v2/:key", (req, res) => {
  const key = req.params.key;
  // TODO: check what happens if the file does not exist
  const stream = bucket.file(key).createReadStream();
  let first = true;
  stream.on("data", (data) => {
    if (first) {
      res.status(200);
      res.setHeader("content-type", "text/plain"); // TODO: fix me to binary octet stream
      first = false;
    }
    res.send(data);
  });
  stream.on("end", () => {
    res.end();
  });
  stream.on("error", () => {
    res.status(404);
    res.end("404");
  });
});

app.post("/api/v2/post/", (req, res) => {
  const id = uuid();
  try {
    const blob = bucket.file(id);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on("error", (err) => {
      res.status(500).json({ message: err.message });
    });

    blobStream.on("finish", async () => {
      res.status(200).json({
        id,
        data: `${DEV ? "http" : "https"}://${req.get("host")}/api/v2/${id}`,
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
      message: "Could not upload the data",
    });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("http://localhost:" + port, "dev =", DEV));

function uuid() {
  return uuidv4().replace(/-/g, "");
}
