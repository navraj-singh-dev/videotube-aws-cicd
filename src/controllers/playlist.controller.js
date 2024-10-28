import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validationResult } from "express-validator";

export const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist

  // validate the data
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ApiError(
      400,
      "Validation Error",
      errors.array()
    );
    return res.status(validationError.statusCode).json(validationError);
  }

  try {
    const { name, description } = req.body;

    const playlistObj = new Playlist({
      name,
      description,
      owner: req.user._id,
    });

    // playlist name must be unique for all the user's playlists
    // on database level name do not needs to be unique
    const playlistAlreadyExists = await Playlist.findOne({
      owner: req.user._id,
      name: name,
    });
    if (playlistAlreadyExists) {
      const playlistAlreadyExistsError = new ApiError(
        400,
        "you already have a another playlist with this name, choose unique name"
      );
      return res
        .status(playlistAlreadyExistsError.statusCode)
        .json(playlistAlreadyExistsError);
    }

    // create a playlist
    const playlistDoc = await playlistObj.save();
    if (!playlistDoc) {
      const playlistDocError = new ApiError(500, "playlist create error", [
        { msg: "playlist cannot be created" },
      ]);
      return res.status(playlistDocError.statusCode).json(playlistDocError);
    }

    // success response
    if (playlistDoc) {
      const successResponse = new ApiResponse(
        201,
        "Playlist Created Successfully",
        playlistDoc._doc
      );
      return res.status(successResponse.statusCode).json(successResponse);
    }
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists

  const { userId } = req.params;
  if (!userId || !isValidObjectId(userId)) {
    const userIdError = new ApiError(400, "correct userId is required");
    return res.status(userIdError.statusCode).json(userIdError);
  }

  try {
    // get user playlists by aggregation pipelines
    const userPlaylists = await Playlist.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
    ]);

    // success response
    if (userPlaylists.length > 0) {
      const successResponse = new ApiResponse(
        201,
        "User Playlists Fetched Successfully",
        userPlaylists
      );
      return res.status(successResponse.statusCode).json(successResponse);
    } else {
      const successResponse = new ApiResponse(
        201,
        "User Has Zero Playlists",
        userPlaylists
      );
      return res.status(successResponse.statusCode).json(successResponse);
    }
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id

  const { playlistId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    const playlistIdError = new ApiError(400, "correct playlistId is required");
    return res.status(playlistIdError.statusCode).json(playlistIdError);
  }

  try {
    // find playlist if exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      const playlistError = new ApiError(400, "playlist not found in database");
      return res.status(playlistError).json(playlistError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Playlist Fetched Successfully",
      playlist
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId)) {
      const validIdError = new ApiError(400, "Correct playlistId is reqired");
      return res.status(validIdError.statusCode).json(validIdError);
    }

    /*
      use custom middleware to check if videoId is correct
      & if it already exists in database before pushing
      it to playlist
    */

    // check if playlist exists
    const playlistExists = await Playlist.findById(playlistId);
    if (!playlistExists) {
      const playlistExistsError = new ApiError(
        400,
        "playlist do not exist in database"
      );
      return res
        .status(playlistExistsError.statusCode)
        .json(playlistExistsError);
    }

    // update playlist document to add new video
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $push: { video: videoId },
      },
      { new: true }
    );

    if (!updatePlaylist) {
      const updatePlaylistError = new ApiError(400, "Video add unsuccessful");
      return res
        .status(updatePlaylistError.statusCode)
        .json(updatePlaylistError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Video Added To Playlist Successfully",
      updatedPlaylist._doc
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  try {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId)) {
      const validIdError = new ApiError(400, "Correct playlistId is reqired");
      return res.status(validIdError.statusCode).json(validIdError);
    }

    /*
      use custom middleware to check if videoId is correct
      & if it already exists in database before pushing
      it to playlist
    */

    // check if playlist exists
    const playlistExists = await Playlist.findById(playlistId);
    if (!playlistExists) {
      const playlistExistsError = new ApiError(
        400,
        "playlist do not exist in database"
      );
      return res
        .status(playlistExistsError.statusCode)
        .json(playlistExistsError);
    }

    // update playlist document to add new video
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: { video: videoId },
      },
      { new: true }
    );

    if (!updatePlaylist) {
      const updatePlaylistError = new ApiError(
        400,
        "Video remove unsuccessful"
      );
      return res
        .status(updatePlaylistError.statusCode)
        .json(updatePlaylistError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Video Removed From Playlist Successfully",
      updatedPlaylist._doc
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  try {
    const { playlistId } = req.params;
    if (!playlistId || !isValidObjectId(playlistId)) {
      const playlistIdError = new ApiError(
        400,
        "correct playlistId is required"
      );
      return res.status(playlistIdError.statusCode).json(playlistIdError);
    }

    // check if playlist exists
    const playlistExists = await Playlist.findById(playlistId);
    if (!playlistExists) {
      const playlistExistsError = new ApiError(
        400,
        "playlist do not exists in database"
      );
      return res
        .status(playlistExistsError.statusCode)
        .json(playlistExistsError);
    }

    // delete the playlist
    const playlistDeleted = await Playlist.findByIdAndDelete(
      playlistExists._id
    );
    if (!playlistDeleted) {
      const playlistDeletedError = new ApiError(
        400,
        "playlist delete unsuccessfull"
      );
      return res
        .status(playlistDeletedError.statusCode)
        .json(playlistDeletedError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Playlist Deleted Successfully",
      playlistDeleted
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  const { playlistId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    const playlistIdError = new ApiError(400, "correct playlistId is required");
    return res.status(playlistIdError.statusCode).json(playlistIdError);
  }

  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ApiError(
      400,
      "validation error",
      errors.array()
    );
    return res.status(validationError.statusCode).json(validationError);
  }
  try {
    const { name, description } = req.body;

    // check if playlist exist in database
    const playlistExists = await Playlist.findById(playlistId);
    if (!playlistExists) {
      const playlistExistsError = new ApiError(
        400,
        "playlist do not exist in database"
      );
      return res
        .status(playlistExistsError.statusCode)
        .json(playlistExistsError);
    }

    /*
      All playlist's made by user cannot have
      same name. Name must be unique for every
      playlist made by user.

      But the name of playlist in the entire
      "playlist" collection of database can 
      be same and do not needs to be unique.
    */
    const sameNameCheck = await Playlist.findOne({
      // ne opearator means [not equals to]
      _id: { $ne: playlistId },
      name: name,
      owner: req.user._id,
    });
    if (sameNameCheck) {
      const sameNameCheckError = new ApiError(
        400,
        "you already have a another playlist with this name, choose unique name",
        sameNameCheck
      );
      return res.status(sameNameCheckError.statusCode).json(sameNameCheckError);
    }

    // update the playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      { name, description },
      { new: true }
    );
    if (!updatePlaylist) {
      const updatedPlaylistError = new ApiError(
        400,
        "playlist update unsuccessful"
      );
      return res
        .status(updatedPlaylistError.statusCode)
        .json(updatedPlaylistError);
    }

    // success response
    const successResponse = new ApiResponse(
      201,
      "Playlist Updated Successfully",
      updatedPlaylist
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});
