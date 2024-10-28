import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validationResult } from "express-validator";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// get videos based on search
export const getAllVideos = asyncHandler(async (req, res) => {
  try {
    // extract details from query
    const userId = req.user._id;
    const { query, sortBy, sortType, limit = 10, page = 1 } = req.query;

    // validate userId
    // console.log("userID: ", userId);
    if (!userId || !isValidObjectId(userId)) {
      const userIdError = new ApiError(400, "Correct userId is required");
      return res.status(userIdError.statusCode).json(userIdError);
    }

    // now make pipeline in steps:
    const pipeline = [];

    // userID, get all videos made by user
    if (userId && isValidObjectId(userId)) {
      pipeline.push({
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      });
    }

    // query, use regex to get all videos of user which match the query
    if (query) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: query, $option: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      });
    }

    // sort, sort in ascending or descending based on a parameter like "views" or "createdAt"
    if (sortBy) {
      const fieldToSort = sortBy === "views" ? "views" : "createdAt";
      const orderOfSorting = sortType === "des" ? -1 : 1;
      pipeline.push({
        $sort: { [fieldToSort]: orderOfSorting },
      });
    }

    // count total number of videos by executing pipeline
    const totalVideosAggregate = await Video.aggregate([
      ...pipeline,
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const totalVideosInteger =
      totalVideosAggregate.length > 0 ? totalVideosAggregate[0].count : 0;

    const totalPages = Math.ceil(totalVideosInteger / limit);

    // add more steps to pipeline for limit and skip
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // get all the videos for the current active page
    const pageVideosAggregate = await Video.aggregate(pipeline);

    // successresponse
    const successResponse = new ApiResponse(
      201,
      "All Videos Fetched Successfully",
      {
        videos: pageVideosAggregate,
        paginate: {
          currentPage: parseInt(page),
          totalPages: parseInt(totalPages),
          limit: parseInt(limit),
          totalVideos: totalVideosInteger,
        },
      }
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

// upload video
export const publishVideo = asyncHandler(async (req, res) => {
  try {
    // take title, description from body and validate also
    const { title, description } = req.body;
    if (!title || !description) {
      const videoDataError = new ApiError(
        400,
        "Title and Description is Required",
        [{ msg: "Title and Description is not provided" }]
      );
      return res.status(videoDataError.statusCode).json(videoDataError);
    }

    // take video, thumbnail from multer
    let videoLocalPath;
    let thumbnailLocalPath;

    if (req.files) {
      if (
        Array.isArray(req.files.videoFile) &&
        req.files.videoFile.length > 0
      ) {
        videoLocalPath = req.files.videoFile[0].path;
      }
      if (
        Array.isArray(req.files.thumbnail) &&
        req.files.thumbnail.length > 0
      ) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
      }
    }
    // give error if video or thumbnail not given
    if (!req.files.videoFile && !req.files.thumbnail) {
      const filesError = new ApiError(400, "Video and Thumbnail is Required", [
        { msg: "Video and Thumbnail is not provided" },
      ]);
      return res.status(filesError.statusCode).json(filesError);
    }
    if (!req.files.videoFile) {
      const videoError = new ApiError(400, "Video is Required", [
        { msg: "Video is not provided" },
      ]);
      return res.status(videoError.statusCode).json(videoError);
    }
    if (!req.files.thumbnail) {
      const thumbnailError = new ApiError(400, "Thumbnail is Required", [
        { msg: "Thumbnail is not provided" },
      ]);
      return res.status(thumbnailError.statusCode).json(thumbnailError);
    }

    // upload to cloudinary using await
    let cloudinaryVideoResponse;
    let cloudinaryThumbnailResponse;

    if (videoLocalPath) {
      cloudinaryVideoResponse = await uploadOnCloudinary(videoLocalPath);
      // give error if cannot upload
      if (!cloudinaryVideoResponse) {
        const videoError = new ApiError(500, "Video Upload Error", [
          { msg: "video cannot be uploaded" },
        ]);
        return res.status(videoError.statusCode).json(videoError);
      }
    }
    if (thumbnailLocalPath) {
      cloudinaryThumbnailResponse = await uploadOnCloudinary(
        thumbnailLocalPath
      );
      // give error if cannot upload
      if (!cloudinaryThumbnailResponse) {
        const thumbnailError = new ApiError(500, "Thumbnail Upload Error", [
          { msg: "thumbnail cannot be uploaded" },
        ]);
        return res.status(thumbnailError.statusCode).json(thumbnailError);
      }
    }

    // create and save the video document in database (keep in mind the owner linking)
    const newVideoDoc = new Video({
      videoFile: cloudinaryVideoResponse.url,
      thumbnail: cloudinaryThumbnailResponse.url,
      title,
      description,
      owner: req.user?._id,
      duration: cloudinaryVideoResponse.duration,
    });

    // save to database
    const saveVideoDoc = await newVideoDoc.save();
    if (!saveVideoDoc) {
      const saveVideoDocError = new ApiError(500, "Video create Error", [
        { msg: "video cannot be created" },
      ]);
      return res.status(saveVideoDocError.statusCode).json(saveVideoDocError);
    }

    // success response
    if (saveVideoDoc) {
      const successResponse = new ApiResponse(
        201,
        "Video Created Successfully",
        saveVideoDoc._doc
      );
      return res.status(successResponse.statusCode).json(successResponse);
    }
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

// get video by its _id
export const getVideoById = asyncHandler(async (req, res) => {
  try {
    // use middleware to get video

    // success response
    const successResponse = new ApiResponse(
      201,
      "Video Found Successfully",
      req.video
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

// update video title, description & thumbnail at once
export const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail

  // middleware used will check if video exist or not

  // express-validator validation checks
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ApiError(
      400,
      "Validation Error",
      errors.array()
    );
    return res.status(validationError.statusCode).json(validationError);
  }

  // setup try/catch
  try {
    const { title, description } = req.body;

    let thumbnailLocalPath;
    if (req.file) {
      thumbnailLocalPath = req.file.path;
    }
    if (!req.file || !req.file.fieldname) {
      const fileError = new ApiError(400, "Thumbnail is Required", [
        { msg: "thumbnail is not provided" },
      ]);
      return res.status(fileError.statusCode).json(fileError);
    }

    // upload thumbnail to cloudinary
    let thumbnailResponse;
    if (thumbnailLocalPath) {
      thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);
      if (!thumbnailResponse) {
        const uploadError = new ApiError(400, "Thumbnail cannot be uploaded");
        return res.status(uploadError.statusCode).json(uploadError);
      }
    }

    // use mongoose to update the details
    const updatedVideo = await Video.findByIdAndUpdate(
      req.video._id,
      { $set: { title, thumbnail: thumbnailResponse.url, description } },
      { new: true }
    );

    // validate update
    if (!updatedVideo) {
      const updateVideoError = new ApiError(400, "Video update un-successful");
      return res.status(updateVideoError.statusCode).json(updateVideoError);
    }

    // send success response
    const successResponse = new ApiResponse(
      201,
      "Video Updated Successfully",
      updatedVideo
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

// delete a video from database
export const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video

  // middleware will check if video exist or not

  // delete the video
  try {
    const deletedVideo = await Video.findByIdAndDelete(req.video._id);
    if (!deletedVideo) {
      const deletedVideoError = new ApiError(400, "Video delete un-successful");
      return res.status(deleteVideo.statusCode).json(deletedVideoError);
    }

    // send success response
    const successResponse = new ApiResponse(
      201,
      "Video Deleted Successfully",
      deletedVideo._doc
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

// toggle publish status
export const togglePublishStatus = asyncHandler(async (req, res) => {
  // middleware will check if video exist

  // check current value of toggle
  let toggledVideo;
  if (req.video.isPublished === true) {
    // toggle the isPublished field value to "false"
    toggledVideo = await Video.findByIdAndUpdate(
      req.video._id,
      { $set: { isPublished: false } },
      { new: true }
    );
  } else {
    toggledVideo = await Video.findByIdAndUpdate(
      req.video._id,
      { $set: { isPublished: true } },
      { new: true }
    );
  }

  // validate if toggle was successful
  if (!toggledVideo) {
    const toggledVideoError = new ApiErro(
      400,
      "toggle publish status un-successful"
    );
    return res.status(toggledVideoError.statusCode).json(toggledVideoError);
  }

  // send success response
  const successResponse = new ApiResponse(
    201,
    "Publish Status Toggled Successfully",
    toggledVideo._doc
  );
  return res.status(successResponse.statusCode).json(successResponse);
});
