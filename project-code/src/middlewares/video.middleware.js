import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Video } from "../models/video.model.js";
import { isValidObjectId } from "mongoose";

export const fetchVideoById = asyncHandler(async (req, res, next) => {
  // take video id
  const { videoId } = req.params;

  // validate video id
  if (!videoId || !isValidObjectId(videoId)) {
    const videoIdError = new ApiError(400, "Correct Video Id is required");
    return res.status(videoIdError.statusCode).json(videoIdError);
  }

  try {
    // get video from database
    const video = await Video.findById(videoId);

    // validate if video is found or not
    if (!video) {
      const videoNotFoundError = new ApiError(
        400,
        "Video not found, give correct video id"
      );
      return res.status(videoNotFoundError.statusCode).json(videoNotFoundError);
    }

    req.video = video._doc;
    next();
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});
