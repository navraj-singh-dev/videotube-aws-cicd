class ApiError extends Error {
  constructor(
    statusCode,
    userMessage = "An error occurred",
    errors = [],
    stack = ""
  ) {
    super(userMessage || "An error occurred"); // calls the constructor function of NodeJS Error class.
    this.statusCode = statusCode;
    this.userMessage = userMessage; // Use a different name here
    this.errors = errors;
    this.success = false;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
