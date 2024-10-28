import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { body, param } from "express-validator";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .post(
    body("content").notEmpty().withMessage("content for tweet is required"),
    createTweet
  );
router
  .route("/user/:userId")
  .get(
    param("userId").notEmpty().withMessage("userId is required in params"),
    getUserTweets
  );
router
  .route("/:tweetId")
  .patch(
    param("tweetId").notEmpty().withMessage("tweetId is required in params"),
    body("content")
      .notEmpty()
      .withMessage("content is required to update the tweet"),
    updateTweet
  )
  .delete(
    param("tweetId").notEmpty().withMessage("tweetId is required in params"),
    deleteTweet
  );

export default router;
