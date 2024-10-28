import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { validationResult } from "express-validator";

export const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    const videoIdError = new ApiError(400, "correct videoId is required");
    return res.status(videoIdError.statusCode).json(videoIdError);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ApiError(
      400,
      "Validation Error",
      errors.array()
    );
    return res.status(validationError.statusCode).json(validationError);
  }

  try {
    const { page, limit } = req.query;
    const pipeline = [];

    // stage to get all comments of a video
    pipeline.push({
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    });

    // total comments
    console.log(pipeline);
    const totalCommentsAggregate = await Comment.aggregate([...pipeline]);
    const totalCommentsInteger = totalCommentsAggregate.length;
    const totalPages = Math.ceil(totalCommentsInteger / limit);

    // pagination
    const skip = (page - 1) * limit;
    pipeline.push(
      {
        $skip: parseInt(skip),
      },
      {
        $limit: parseInt(limit),
      }
    );
    const paginateComments = await Comment.aggregate([...pipeline]);

    // success response
    const successResponse = new ApiResponse(
      201,
      "Comments Fetched Successfully",
      {
        comments: paginateComments,
        totalCommentsInteger: parseInt(totalCommentsInteger),
        totalPages: parseInt(totalPages),
        currentPage: parseInt(page),
      }
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ApiError(
      400,
      "Validation Errors",
      errors.array()
    );
    return res.status(validationError.statusCode).json(validationError);
  }

  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    const videoIdError = new ApiError(400, "correct videoId is required");
    return res.status(videoIdError.statusCode).json(videoIdError);
  }

  try {
    // check if video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
      const videoExistsError = new ApiError(
        400,
        "video you are trying to comment on do not exist in database"
      );
      return res.status(videoExistsError.statusCode).json(videoExistsError);
    }

    // add comment on video
    const { content } = req.body;
    const commentObj = new Comment({
      content: content,
      video: videoExists._id,
      owner: req.user._id,
    });

    // save new comment in database
    const comment = await commentObj.save();
    if (!comment) {
      const commentError = new ApiError(400, "comment add unsuccessful");
      return res.status(commentError.statusCode).json(commentError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Comment Added Successfully",
      comment
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ApiError(
      400,
      "Validation Error",
      errors.array()
    );
    return res.status(validationError.statusCode).json(validationError);
  }

  const { commentId } = req.params;
  if (!commentId || !isValidObjectId(commentId)) {
    const commentIdError = new ApiError(400, "correct commentId is required");
    return res.status(commentIdError.statusCode).json(commentIdError);
  }

  try {
    // check if comment exists
    const commentExists = await Comment.findById(commentId);
    if (!commentExists) {
      const commentExistsError = new ApiError(
        400,
        "comment you are trying to update do not exist in database"
      );
      return res.status(commentExistsError.statusCode).json(commentExistsError);
    }

    // update comment
    const { content } = req.body;
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content: content },
      { new: true }
    );
    if (!updatedComment) {
      const updatedCommentError = new ApiError(
        400,
        "comment update unsuccessful"
      );
      return res.status(updatedComment.statusCode).json(updatedCommentError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Comment Updated Successfully",
      updatedComment
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!commentId || !isValidObjectId(commentId)) {
    const commentIdError = new ApiError(400, "correct commentId is required");
    return res.status(commentIdError.statusCode).json(commentIdError);
  }

  try {
    // check if comment exists
    const commentExists = await Comment.findById(commentId);
    if (!commentExists) {
      const commentExistsError = new ApiError(
        400,
        "comment you are trying to delete do not exist"
      );
      return res.status(commentExistsError.statusCode).json(commentExistsError);
    }

    // delete the comment
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!deletedComment) {
      const deletedCommentError = new ApiError(
        400,
        "comment delete unsuccessful"
      );
      return res.status(deletedComment.status).json(deletedCommentError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Comment Deleted Successfully",
      deletedComment
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});
