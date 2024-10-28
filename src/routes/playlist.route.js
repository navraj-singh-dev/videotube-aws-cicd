import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { body, param } from "express-validator";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { fetchVideoById } from "../middlewares/video.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .post(
    [
      body("name").notEmpty().withMessage("name is required"),
      body("description").notEmpty().withMessage("description is required"),
    ],
    createPlaylist
  );

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(
    [
      body("name").notEmpty().withMessage("name is required"),
      body("description").notEmpty().withMessage("description is required"),
    ],
    updatePlaylist
  )
  .delete(deletePlaylist);

router
  .route("/add/:videoId/:playlistId")
  .patch(
    [
      param("playlistId").notEmpty().withMessage("playlistId is required"),
      param("videoId").notEmpty().withMessage("videoId is required"),
      fetchVideoById,
    ],
    addVideoToPlaylist
  );
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router;
