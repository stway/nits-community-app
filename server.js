// --- start of replaceable block (FULL header) ---
const path = require("path");
const fs = require("fs");
const express = require("express");
const next = require("next");
const dotenv = require("dotenv");
const multer = require("multer");
const cors = require("cors");
const { v2: cloudinary } = require("cloudinary");

dotenv.config();

// is this a dev environment?
const dev = process.env.NODE_ENV !== "production";

// point Next to the frontend folder (important)
const FRONTEND_DIR = path.join(__dirname, "frontend");

// create Next app instance and request handler
const appNext = next({ dev, dir: FRONTEND_DIR });
const handle = appNext.getRequestHandler();
// --- end of replaceable block ---


const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" }));

// --------- Data storage (simple JSON files) ----------
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");
if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, "[]");
if (!fs.existsSync(PROFILES_FILE)) fs.writeFileSync(PROFILES_FILE, "{}");

function readPosts() {
  try {
    return JSON.parse(fs.readFileSync(POSTS_FILE, "utf8") || "[]");
  } catch (e) {
    return [];
  }
}
function writePosts(data) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2));
}
function readProfiles() {
  try {
    return JSON.parse(fs.readFileSync(PROFILES_FILE, "utf8") || "{}");
  } catch (e) {
    return {};
  }
}
function writeProfiles(data) {
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
}

// --------- Cloudinary config (from .env) ----------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// --------- Hidden admin (from .env) ----------
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "neelakshi_admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "NITS2025";

// --------- Simple auth middleware (Authorization header contains username) ----------
const requireAuth = (req, res, next) => {
  const token = (req.headers.authorization || "").trim();
  if (!token) return res.status(401).json({ ok: false, error: "Unauthorized" });
  req.user = token;
  next();
};

// --------- Uploads via multer -> Cloudinary ----------
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 12 * 1024 * 1024 } });

app.post("/api/uploads", requireAuth, upload.array("files", 8), async (req, res) => {
  try {
    const uploaded = [];
    // helper to upload buffer
    const uploadBuffer = (buffer, filename) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "nits_community",
            use_filename: true,
            unique_filename: false,
            resource_type: "auto",
          },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        stream.end(buffer);
      });

    for (const f of req.files || []) {
      const result = await uploadBuffer(f.buffer, f.originalname);
      uploaded.push({
        filename: f.originalname,
        url: result.secure_url,
        public_id: result.public_id,
      });
    }

    res.json({ ok: true, files: uploaded });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ ok: false, error: "Upload failed" });
  }
});

// --------- Profile routes ----------
app.post("/api/profile", requireAuth, (req, res) => {
  try {
    const user = req.user;
    const { avatar } = req.body;
    const profiles = readProfiles();
    profiles[user] = profiles[user] || {};
    if (avatar) profiles[user].avatar = avatar;
    writeProfiles(profiles);
    res.json({ ok: true, profile: profiles[user] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Could not save profile" });
  }
});

app.get("/api/profile/:name", (req, res) => {
  const profiles = readProfiles();
  res.json({ profile: profiles[req.params.name] || null });
});

// --------- Login route (admin check) ----------
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username) return res.status(400).json({ success: false, error: "username required" });

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      username,
      role: "admin",
      token: "secret-admin-token",
    });
  }

  return res.json({ success: true, username, role: "user" });
});

// --------- Posts API ----------
app.post("/api/posts", requireAuth, (req, res) => {
  const posts = readPosts();
  const { type, title, body, media = [], anonymous = false } = req.body || {};
  const profiles = readProfiles();

  const author = req.user;
  const authorAvatar = profiles[author]?.avatar || null;

  const post = {
    id: Date.now().toString(),
    type,
    title: title || null,
    body: body || "",
    media,
    anonymous,
    author,
    authorAvatar,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };

  posts.unshift(post);
  writePosts(posts);
  res.json({ ok: true, post });
});

app.get("/api/posts", (req, res) => {
  const { type, q } = req.query;
  const profiles = readProfiles();
  let posts = readPosts();

  // attach avatar
  posts = posts.map((p) => ({
    ...p,
    authorAvatar: p.authorAvatar || profiles[p.author]?.avatar || null,
  }));

  // filter
  if (type) posts = posts.filter((p) => p.type === type);
  if (q) {
    const search = q.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.body.toLowerCase().includes(search) ||
        (p.author && p.author.toLowerCase().includes(search))
    );
  }

  // sort newest first
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ posts });
});

app.post("/api/posts/:id/like", requireAuth, (req, res) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ ok: false, error: "Post not found" });

  const user = req.user;
  if (post.likedBy.includes(user)) return res.json({ ok: false, error: "Already liked" });

  post.likes++;
  post.likedBy.push(user);
  writePosts(posts);
  res.json({ ok: true, likes: post.likes });
});

// --------- Delete route: author or admin (server checks ADMIN_USERNAME) ----------
app.delete("/api/posts/:id", requireAuth, (req, res) => {
  try {
    const posts = readPosts();
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ ok: false, error: "Post not found" });

    const requester = req.user;
    if (post.author !== requester && requester !== ADMIN_USERNAME) {
      return res.status(403).json({ ok: false, error: "Unauthorized" });
    }

    for (const m of post.media || []) {
      if (m.public_id) {
        cloudinary.uploader.destroy(m.public_id, { resource_type: "auto" }).catch(() => {});
      }
    }

    const remaining = posts.filter((p) => p.id !== req.params.id);
    writePosts(remaining);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// --------- Serve Next.js pages for everything else ----------
appNext.prepare().then(() => {
  app.all("*", (req, res) => handle(req, res));
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`🚀 Combined server running at http://localhost:${PORT}`));
}).catch((err) => {
  console.error("Next prepare error:", err);
});
