import { Router } from "express";
import {
  changeAvatar,
  changeCoverImage,
  changeCurrentPassword,
  changeFullName,
  getChannelProfileDetails,
  getCurrentUser,
  getWatchHistory,
  loginUser,
  logoutUser,
  regenerateTokens,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { body } from "express-validator";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  gen_Random_Subscriptions,
  gen_user_video_watchHistory,
} from "../utils/createFakeData.js";

const router = Router();

router.route("/register").post(
  [
    upload.fields([
      {
        name: "avatar",
        maxCount: 1,
      },
      {
        name: "coverImage",
        maxCount: 1,
      },
    ]),

    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .trim()
      .toLowerCase(),
    body("fullName").notEmpty().withMessage("Full name is required").trim(),
    body("email").isEmail().withMessage("Invalid email").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character"
      ),
  ],
  registerUser
);
router
  .route("/login")
  .post(
    [
      body("identifier")
        .notEmpty()
        .withMessage("Username or email is required")
        .trim()
        .toLowerCase(),
      body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    ],
    loginUser
  );

// secured routes (require tokens)
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/regenerate-tokens").post(regenerateTokens);
router.route("/get-current-user").get(verifyJWT, getCurrentUser);
router
  .route("/update-user-fullname")
  .patch(
    [
      verifyJWT,
      body("fullName").notEmpty().withMessage("Full name is required"),
    ],
    changeFullName
  );
router.route("/update-user-password").patch(
  [
    verifyJWT,
    body("oldPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .trim(),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character"
      ),
    body("confirmPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  changeCurrentPassword
);
router
  .route("/update-user-avatar")
  .patch([verifyJWT, upload.single("avatar")], changeAvatar);
router
  .route("/update-user-coverImage")
  .patch([verifyJWT, upload.single("coverImage")], changeCoverImage);

// aggregation routes
router.route("/channel/:channelName").get(verifyJWT, getChannelProfileDetails);
router.route("/get-watch-history").get(verifyJWT, getWatchHistory);

// testing purpose routes to create fake data
router
  .route("/gen-users-videos-watchHistory")
  .post(gen_user_video_watchHistory);
router.route("/gen-random-subscriptions").post(gen_Random_Subscriptions);

// exports
export default router;
