import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\nDataBase Connection Succesfull.\nDB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(`\nMongoDB Connection Failed:\n${error}`);
    process.exit(1);
  }
};

export default connectDB;
