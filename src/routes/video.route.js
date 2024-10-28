import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { body } from "express-validator";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { fetchVideoById } from "../middlewares/video.middleware.js";

const router = Router();

// middlewares
router.use(verifyJWT);

// endpoints

router.route("/").get(getAllVideos);

router.route("/publish-video").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router
  .route("/:videoId")
  .get(fetchVideoById, getVideoById)
  .patch(
    fetchVideoById,
    upload.single("thumbnail"),
    body("description").notEmpty().withMessage("description is required"),
    body("title").notEmpty().withMessage("title is required"),
    updateVideo
  )
  .delete(fetchVideoById, deleteVideo);

router.route("/toggle/:videoId").patch(fetchVideoById, togglePublishStatus);

// exports
export default router;
