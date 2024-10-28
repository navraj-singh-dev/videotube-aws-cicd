import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const registerUser = asyncHandler(async (req, res) => {
  // validate user's input
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ApiError(
      400,
      "Validation Error",
      errors.array()
    );
    return res.status(validationError.statusCode).json(validationError);
  } else {
    try {
      // destructure the user info
      const { username, email, fullName, password } = req.body;

      // check if user already exist
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        const userExistsError = new ApiError(400, "User Already Exists", [
          { msg: "username or email already exist." },
        ]);
        return res.status(userExistsError.statusCode).json(userExistsError);
      }

      // multer to upload files temporarily on server
      let avatarLocalPath;
      let coverImageLocalPath = "";
      if (req.files) {
        if (Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
          avatarLocalPath = req.files.avatar[0].path;
        }
        if (
          Array.isArray(req.files.coverImage) &&
          req.files.coverImage.length > 0
        ) {
          coverImageLocalPath = req.files.coverImage[0].path;
        }
      }
      if (!req.files || !req.files.avatar) {
        const filesError = new ApiError(400, "Avatar is Required", [
          { msg: "avatar image is not provided" },
        ]);
        return res.status(filesError.statusCode).json(filesError);
      }

      // upload on cloudianry
      let cloudinaryAvatarResponse;
      let cloudinaryCoverImageResponse;

      if (avatarLocalPath) {
        cloudinaryAvatarResponse = await uploadOnCloudinary(avatarLocalPath);

        if (!cloudinaryAvatarResponse) {
          const avatarError = new ApiError(500, "Avatar Upload Error", [
            { msg: "avatar cannot be uploaded" },
          ]);
          return res.status(avatarError.statusCode).json(avatarError);
        }
      }
      if (coverImageLocalPath) {
        cloudinaryCoverImageResponse = await uploadOnCloudinary(
          coverImageLocalPath
        );
      }

      // create & save new user to DB
      const newUserObj = new User({
        username,
        fullName,
        email,
        password,
        avatar: cloudinaryAvatarResponse.url,
        coverImage: cloudinaryCoverImageResponse?.url || "",
      });

      const newUser = await newUserObj.save();
      if (!newUser) {
        const newUserError = new ApiError(500, "User Creation Error", [
          { msg: "user cannot be created" },
        ]);
        return res.status(newUserError.statusCode).json(newUserError);
      }
      // Including this if-block-check decreases time taken to register a user in database
      // If this if-block-check is removed "password" variable's scope error conflicts with req.body
      if (newUser) {
        const { _id, password, refreshToken, ...sanitizedUser } = newUser._doc;
        const successResponse = new ApiResponse(
          201,
          "User Registered Successfully",
          sanitizedUser
        );
        return res.status(successResponse.statusCode).json(successResponse);
      }
    } catch (error) {
      console.log(error);
      const serverError = new ApiError(500, "Internal Server Error");
      return res.status(serverError.statusCode).json(serverError);
    }
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  // validate user input
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
    // check if user exist maybe through email or username
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) {
      const identifierType = /@/.test(identifier) ? "Email" : "Username";
      const userNotExistError = new ApiError(404, [
        { msg: `${identifierType} doesn't exist` },
        { param: identifier },
      ]);
      return res.status(userNotExistError.statusCode).json(userNotExistError);
    }

    // check password
    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      const passwordError = new ApiError(401, "Incorrect Password");
      return res.status(passwordError.statusCode).json(passwordError);
    }

    // generate access and refresh token
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // update user with refresh token
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { refreshToken } },
      { new: true }
    );

    // remove sensitive info
    const sanitizedUpdatedUser = {
      accessToken,
      refreshToken,
      user: {
        ...updatedUser._doc,
        password: undefined,
      },
    };

    const successResponse = new ApiResponse(
      201,
      "User logged in successfully",
      sanitizedUpdatedUser
    );

    // make cookie secure
    const cookieSettings = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(successResponse.statusCode)
      .cookie("AccessToken", accessToken, cookieSettings)
      .cookie("RefreshToken", refreshToken, cookieSettings)
      .json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  try {
    // take the id
    const _id = req.user._id;

    // delete refreshToken
    const user = await User.findByIdAndUpdate(
      { _id },
      { $set: { refreshToken: "" } },
      { new: true }
    ).select("-password");

    const successResponse = new ApiResponse(
      200,
      "User logged out successfully",
      {
        user: {
          user,
        },
      }
    );

    // delete cookies
    const cookieSettings = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(successResponse.statusCode)
      .clearCookie("AccessToken", cookieSettings)
      .clearCookie("RefreshToken", cookieSettings)
      .json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal server error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const regenerateTokens = asyncHandler(async (req, res) => {
  // take the refresh token
  const incomingRefreshToken =
    req.cookies?.RefreshToken ||
    req.headers.authorization?.replace("Bearer ", "") ||
    req.body.RefreshToken;

  // validate if token is not empty
  if (!incomingRefreshToken) {
    const noTokenError = new ApiError(401, "No token provided");
    return res.status(noTokenError.statusCode).json(noTokenError);
  }

  try {
    // extract payload
    const userPayloadObj = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const sanitizedUser = await User.findById(userPayloadObj?._id).select(
      "-password"
    );

    if (!sanitizedUser) {
      const tokenMatchError = new ApiError(401, "No user match this token");
      return res.status(tokenMatchError.statusCode).json(tokenMatchError);
    }

    if (!(sanitizedUser.refreshToken === incomingRefreshToken)) {
      const tokenMatchError = new ApiError(
        401,
        "Token do not match, token might be expired or invalid"
      );
      return res.status(tokenMatchError.statusCode).json(tokenMatchError);
    }

    // generate both tokens
    const accessToken = await sanitizedUser.generateAccessToken();
    const refreshToken = await sanitizedUser.generateRefreshToken();

    // update refresh token of user in database
    const updatedUser = await User.findOneAndUpdate(
      { _id: userPayloadObj?._id },
      { $set: { refreshToken } },
      { new: true }
    );

    /* 
    create object with newly generated
    access & refresh token and sanitized 
    updated user for response
    */
    const sanitizedUpdatedUser = {
      accessToken,
      refreshToken,
      user: {
        ...updatedUser._doc,
        password: undefined,
      },
    };

    const successResponse = new ApiResponse(
      201,
      "New tokens generated successfully",
      sanitizedUpdatedUser
    );

    // make cookie secure
    const cookieSettings = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(successResponse.statusCode)
      .cookie("AccessToken", accessToken, cookieSettings)
      .cookie("RefreshToken", refreshToken, cookieSettings)
      .json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

// controllers for updating user

export const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const successResponse = new ApiResponse(
      200,
      "User fetched successfully",
      req.user || "Req.user not found, No data found for current user."
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = new ApiError(
      400,
      "Validation errors",
      errors.array()
    );
    return res.status(validationErrors.statusCode).json(validationErrors);
  }

  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    const passwordNotMatchError = new ApiError(
      400,
      "New password & confirm password do not match"
    );
    return res
      .status(passwordNotMatchError.statusCode)
      .json(passwordNotMatchError);
  }

  try {
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user?.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      const wrongPasswordError = new ApiError(400, "Wrong old password");
      return res.status(wrongPasswordError.statusCode).json(wrongPasswordError);
    }

    user.password = newPassword;
    const updatedUser = await user.save({ validateBeforeSave: false });
    const successResponse = new ApiResponse(
      200,
      "User new password updated successfully",
      {
        ...updatedUser._doc,
        password: undefined,
        refreshToken: undefined,
      }
    );

    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const changeFullName = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = new ApiError(
      400,
      "Validation errors",
      errors.array()
    );
    return res.status(validationErrors.statusCode).json(validationErrors);
  }

  const { fullName } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { fullName } },
      { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      const noUserFoundError = new ApiError(400, "No user found");
      return res.status(noUserFoundError.statusCode).json(noUserFoundError);
    }

    const successResponse = new ApiResponse(
      200,
      "Full name updated successfully",
      updatedUser._doc
    );

    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const changeAvatar = asyncHandler(async (req, res) => {
  let avatarLocalPath = "";

  if (req.file) {
    console.log(`File received (changeAvatar): ${req.file.path}`);
    avatarLocalPath = req.file.path;
  }

  if (!req.file || !req.file.fieldname) {
    const fileError = new ApiError(400, "Avatar is Required", [
      { msg: "avatar image is not provided" },
    ]);
    return res.status(fileError.statusCode).json(fileError);
  }

  try {
    let avatarResponse;
    if (avatarLocalPath) {
      avatarResponse = await uploadOnCloudinary(avatarLocalPath);

      if (!avatarResponse) {
        const uploadError = new ApiError(400, "Avatar cannot be uploaded", [
          { msg: avatarResponse },
        ]);
        return res.status(uploadError.statusCode).json(uploadError);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: avatarResponse?.url } },
      { new: true }
    );

    const successResponse = new ApiResponse(
      200,
      "Avatar updated successfully",
      { ...updatedUser._doc, password: undefined, refreshToken: undefined }
    );

    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

export const changeCoverImage = asyncHandler(async (req, res) => {
  let coverImageLocalPath = "";

  if (req.file) {
    console.log(`File received (changeCoverImage): ${req.file.path}`);
    coverImageLocalPath = req.file.path;
  }

  if (!req.file || !req.file.fieldname) {
    const fileError = new ApiError(400, "Cover image is Required", [
      { msg: "cover image is not provided" },
    ]);
    return res.status(fileError.statusCode).json(fileError);
  }

  try {
    let coverImageResponse;
    if (coverImageLocalPath) {
      coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);

      if (!coverImageResponse) {
        const uploadError = new ApiError(
          400,
          "Cover image cannot be uploaded",
          [{ msg: coverImageResponse }]
        );
        return res.status(uploadError.statusCode).json(uploadError);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { coverImage: coverImageResponse?.url } },
      { new: true }
    );

    const successResponse = new ApiResponse(
      200,
      "Cover image updated successfully",
      { ...updatedUser._doc, password: undefined, refreshToken: undefined }
    );

    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});

// aggregation
export const getChannelProfileDetails = asyncHandler(async (req, res) => {
  const { channelName } = req.params;

  // Validate channel name
  if (!channelName.trim()) {
    const error = new ApiError(400, "Please provide channel name");
    return res.status(error.statusCode).json(error);
  }

  try {
    const channelDetails = await User.aggregate([
      // Match the specified channel name
      { $match: { username: channelName.toLowerCase().trim() } },

      // Lookup channels that are subscribers to the specified channel
      {
        $lookup: {
          from: "subscriptions",
          let: { channelId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$channel", "$$channelId"] } } },
            {
              $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
              },
            },
            { $unwind: "$subscriberDetails" },
            { $project: { _id: 0, username: "$subscriberDetails.username" } },
          ],
          as: "subscribers",
        },
      },

      // Lookup channels that the specified channel is subscribed to
      {
        $lookup: {
          from: "subscriptions",
          let: { subscriberId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$subscriber", "$$subscriberId"] } } },
            {
              $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
              },
            },
            { $unwind: "$channelDetails" },
            { $project: { _id: 0, username: "$channelDetails.username" } },
          ],
          as: "subscribedTo",
        },
      },

      // Project required fields
      {
        $project: {
          username: 1,
          fullName: 1,
          email: 1,
          avatar: 1,
          coverImage: 1,
          subscribersCount: { $size: "$subscribers" },
          subscribedToCount: { $size: "$subscribedTo" },
          isActiveUserSubscribed: {
            $cond: {
              if: { $in: [req.user?.username, "$subscribers.username"] },
              then: true,
              else: false,
            },
          },
          subscribers: 1,
          subscribedTo: 1,
        },
      },
    ]);

    // Check if channel details found
    if (channelDetails.length === 0) {
      const error = new ApiError(404, "Channel not found");
      return res.status(error.statusCode).json(error);
    }

    const response = new ApiResponse(
      200,
      "Channel & its details obtained successfully",
      channelDetails[0]
    );
    return res.status(response.statusCode).json(response);
  } catch (error) {
    console.log(error);
    const err = new ApiError(500, "Internal Server Error");
    return res.status(err.statusCode).json(err);
  }
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  // make sure user is logged-in
  if (!req.user) {
    const notLoggedIn = new ApiError(400, "User is not logged-In");
    return res.status(notLoggedIn.statusCode).json(notLoggedIn);
  }

  try {
    // get user history using aggregation
    const history = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchedVideosDocs",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDoc",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      fullName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                ownerDoc: {
                  $first: "$ownerDoc",
                },
              },
            },
          ],
        },
      },
    ]);

    // return error response if aggregation gave no data
    if (!history) {
      const historyNotFoundError = new ApiError(400, "No History Found");
      res.status(historyNotFoundError.statusCode).json(historyNotFoundError);
    }

    const successResponse = new ApiResponse(
      200,
      "History fetched succesfully",
      history[0].watchedVideosDocs
    );
    res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.log(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
});
