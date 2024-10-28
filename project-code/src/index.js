import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(`\nExpress Server Error: \n${error}`);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `\nExpress Server Running On PORT: ${process.env.PORT || 8000}`
      );
    });
  })
  .catch((error) => {
    console.log(`\nMongoDB Connection Failed: \n${error}`);
  });
