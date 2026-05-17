const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// Load Next.js from frontend's node_modules (no separate install needed)
const next = require(path.join(__dirname, "../frontend/node_modules/next"));

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev, dir: path.join(__dirname, "../frontend") });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();

  app.use(express.json());

  // API Routes
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/projects", require("./routes/projects"));
  app.use("/api/tasks", require("./routes/tasks"));
  app.use("/api/invite", require("./routes/invite"));

  // Next.js frontend — handles all non-API requests
  app.all("*", (req, res) => handle(req, res));

  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ MongoDB Connected");
      app.listen(process.env.PORT || 5000, () =>
        console.log(`🚀 Server + Frontend running on http://localhost:${process.env.PORT || 5000}`)
      );
    })
    .catch((err) => console.error("❌ DB Error:", err));
});
