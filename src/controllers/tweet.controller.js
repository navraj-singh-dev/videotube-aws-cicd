import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validationResult } from "express-validator";

export const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  // get content and validate
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
    const { content } = req.body;

    // create the tweet
    const tweetObj = new Tweet({
      content: content,
      owner: req.user._id,
    });

    // save the tweet
    const tweet = await tweetObj.save();
    if (!tweet) {
      const tweetError = new ApiError(400, "tweet post unsuccessful");
      return res.status(tweetError.statusCode).json(tweetError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Tweet Posted Successfully",
      tweet
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets

  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    const userIdError = new ApiError(400, "correct userId is required");
    return res.status(userIdError.statusCode).json(userIdError);
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
    // check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      const userExistsError = new ApiError(
        400,
        "user do not exists in database"
      );
      return res.status(userExistsError.statusCode).json(userExistsError);
    }

    // get the tweets
    const userTweets = await Tweet.find({ owner: userId });
    if (!userTweets) {
      const userTweets = new ApiError(400, "no tweets found");
      return res.status(userTweets.statusCode).json(userTweets);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "User Tweets Fetched Successfully",
      userTweets
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { content } = req.body;
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    const tweetIdError = new ApiError(400, "correct tweetId is required");
    return res.status(tweetIdError.statusCode).json(tweetIdError);
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
    // check if tweet exists
    const tweetExists = await Tweet.findById(tweetId);
    if (!tweetExists) {
      const tweetExistsError = new ApiError(
        400,
        "tweet you are updating do not exists in database"
      );
      return res.status(tweetExistsError.statusCode).json(tweetExistsError);
    }

    // update the tweet
    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      { content: content },
      { new: true }
    );
    if (!updatedTweet) {
      const updatedTweetError = new ApiError(400, "tweet update unsuccessful");
      return res.status(updatedTweetError.statusCode).json(updatedTweetError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Tweet Updated Successfully",
      updatedTweet
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet

  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    const tweetIdError = new ApiError(400, "correct tweetId is required");
    return res.status(tweetIdError.statusCode).json(tweetIdError);
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
    // check if tweet exists
    const tweetExists = await Tweet.findById(tweetId);
    if (!tweetExists) {
      const tweetExistsError = new ApiError(
        400,
        "tweet you are trying to delete, do not exist in database"
      );
      return res.status(tweetExistsError.statusCode).json(tweetExistsError);
    }

    // delete the tweet
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deletedTweet) {
      const deletedTweetError = new ApiError(400, "tweet delete unsuccessful");
      return res.status(deletedTweetError.statusCode).json(deletedTweetError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Tweet Deleted Successfully",
      deletedTweet
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});
