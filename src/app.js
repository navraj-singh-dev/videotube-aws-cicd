import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import fetch from "node-fetch";
import { marked } from "marked";

const app = express();

// Set EJS Properly
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

// Configure marked to use Prism for syntax highlighting
marked.setOptions({
  highlight: function (code, lang) {
    if (Prism.languages[lang]) {
      return Prism.highlight(code, Prism.languages[lang], lang);
    } else {
      return code;
    }
  },
});

// Sweet Little HomePage, It is fetched from the project's github repo ReadME
app.get("/", async (req, res) => {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/navraj-singh-dev/mega-project-javascript-backend/main/README.md"
    );
    const readmeContent = await response.text();
    const parsedContent = marked(readmeContent);

    res.render("index", { readmeContent: parsedContent });
  } catch (error) {
    console.error("Error fetching README:", error);
    res.status(500).send("Error fetching project documentation");
  }
});

//middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use(express.static(path.join(process.cwd(), "public")));

// router's import
import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import playlistRouter from "./routes/playlist.route.js";
import commentRouter from "./routes/comment.route.js";
import tweetRouter from "./routes/tweet.route.js";

// endpoint
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/tweets", tweetRouter);

//exports
export { app };
