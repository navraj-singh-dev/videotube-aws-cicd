// Assuming you have access to your User model and Video model
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "./apiResponse.js";
import { ApiError } from "./apiError.js";

// Function to generate random users
export async function genUsers(numUsers) {
  const users = [];
  for (let i = 0; i < numUsers; i++) {
    const user = new User({
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      fullName: `User ${i + 1}`,
      avatar: "avatar_url_here", // Add actual avatar URL if available
      coverImage: "coverImage_url_here", // Add actual avatar URL if available
      password: "password_here", // Add hashed password or use a dummy password
      refreshToken: "refresh_token_here", // Add refresh token if needed
    });
    await user.save();
    users.push(user);
  }
  console.log(`\n${numUsers} users created.`);
  return users;
}

// Function to generate random videos for a user
export async function genVideosForUser(user, numVideos) {
  const videos = [];
  for (let i = 0; i < numVideos; i++) {
    const video = new Video({
      videoFile: "video_file_url_here", // Add actual video file URL
      thumbnail: "thumbnail_url_here", // Add actual thumbnail URL
      title: `Video ${i + 1} by ${user.username}`,
      owner: user._id,
      description: `Description for Video ${i + 1}`,
      duration: 0, // Add actual duration if available
      views: 0, // Default views to 0
      isPublished: true, // Set video as published
    });
    await video.save();
    videos.push(video);
  }
  console.log(`\n${numVideos} videos created for user: ${user.username}`);
  return videos;
}

// Function to populate watch history for each user
export async function populateWatchHistory(users, maxVideosInWatchHistory) {
  for (const userData of users) {
    // Retrieve user as an instance of the Mongoose User model
    const user = await User.findById(userData._id);

    // Randomly select a subset of videos
    const numVideosToWatch =
      Math.floor(Math.random() * maxVideosInWatchHistory) + 1;
    const videos = await Video.find({ owner: { $ne: user._id } }); // Exclude user's own videos
    const watchedVideos = videos
      .sort(() => 0.5 - Math.random())
      .slice(0, numVideosToWatch);

    // Update user's watch history and save the document
    user.watchHistory = watchedVideos.map((video) => video._id);
    await user.save();
    console.log(`Watch history populated for ${user.username} user.`);
  }
  console.log("\nWatch history populated for all users.");
}

// Usage
export async function gen_user_video_watchHistory(_, res) {
  const NUM_USERS_TO_GENERATE = 100;
  const NUM_VIDEOS_PER_USER = 17;
  const MAX_VIDEOS_IN_WATCH_HISTORY = 60;

  generateUsers(NUM_USERS_TO_GENERATE)
    .then((users) =>
      Promise.all(
        users.map((user) => generateVideosForUser(user, NUM_VIDEOS_PER_USER))
      )
    )
    .then((usersVideos) => {
      const users = usersVideos.map((userVideos) => userVideos[0].owner);
      populateWatchHistory(users, MAX_VIDEOS_IN_WATCH_HISTORY);
      return res.status(200).json({ Msg: "Done" });
    })
    .catch((error) => {
      console.error(error);
      const serverError = new ApiError(500, "Internal Server Error");
      return res.status(serverError.statusCode).json(serverError);
    });
}

// Function to populate subscriptions
export async function populateSubscriptions(users) {
  const subscriptions = [];

  for (const subscriber of users) {
    // Randomly select another user (channel) to subscribe to
    const channels = users.filter((user) => user._id !== subscriber._id);
    const randomChannel = channels[Math.floor(Math.random() * channels.length)];

    // Create subscription document
    const subscription = new Subscription({
      subscriber: subscriber._id,
      channel: randomChannel._id,
    });
    await subscription.save();
    console.log(
      `subscriber ${subscriber.username} \nchannel ${randomChannel.username}`
    );
    subscriptions.push(subscription);
  }
  console.log("Subscriptions populated.");
  return subscriptions;
}

// Usage
export async function gen_Random_Subscriptions(_, res) {
  try {
    const users = await User.find();
    const result = await populateSubscriptions(users);
    const successResponse = new ApiResponse(
      200,
      "Subscriptions created successfully",
      result
    );
    return res.status(successResponse.statusCode).json(successResponse);
  } catch (error) {
    console.error(error);
    const serverError = new ApiError(500, "Internal Server Error");
    return res.status(serverError.statusCode).json(serverError);
  }
}
