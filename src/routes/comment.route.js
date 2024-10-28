import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { body, param, query } from "express-validator";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/:videoId")
  .get(
    [
      query("page")
        .notEmpty()
        .withMessage("page is required")
        .isInt()
        .withMessage("integer! query field `page` must be integer"),
      query("limit")
        .notEmpty()
        .withMessage("limit is required")
        .isInt()
        .withMessage("integer! query field `limit` must be integer"),
      param("videoId").notEmpty().withMessage("videoId is required"),
    ],
    getVideoComments
  )
  .post(
    body("content").notEmpty().withMessage("comment cannot be empty"),
    addComment
  );
router
  .route("/c/:commentId")
  .delete(deleteComment)
  .patch(
    body("content")
      .notEmpty()
      .withMessage("Content is required to update comment"),
    updateComment
  );

export default router;
