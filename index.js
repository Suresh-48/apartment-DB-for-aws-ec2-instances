import mongoose from "mongoose";
const { connect } = mongoose;
import { config } from "dotenv";
import http from "http";
import express, { json } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import cronSchedule from './controllers/cronScheduler.js';
import cors from './corsConfig.js'; 

const app = express();

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION!!! shutting down....");
  console.error(err.name, err.message);
  process.exit(1);
});

// Load environment variables from .env file
config({
  path: "./.env",
});

// Check if required environment variables are defined
if (!process.env.DATABASE || !process.env.DATABASE_PASSWORD) {
  console.error("Environment variables DATABASE Credentials are required.");
  process.exit(1); // Exit the process with failure code
}

const server = new http.createServer(app);

const database = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// Connect the database
// process.env.LOCAL_DATABASE
connect(database, {})
  .then((con) => {
    console.log("DB connection Successfully!");
  })
  .catch((err) => {
    console.error("DB connection error:", err.message);
    process.exit(1); // Exit the process with failure code
  });

// Start the server
const port = process.env.PORT || 7000;
server.listen(port, () => {
  console.log(`Application is running on port ${port}`);
});

// Listen for connection errors
mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.error("Mongoose connection lost. Please check your network.");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION!!!  shutting down ...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
// Handle SIGINT (Ctrl+C) gracefully
process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully.");
  mongoose.connection.close(() => {
    console.log("Mongoose connection closed.");
    process.exit(0);
  });
});

// Handle SIGTERM (e.g., Heroku dyno cycling) gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully.");
  mongoose.connection.close(() => {
    console.log("Mongoose connection closed.");
    process.exit(0);
  });
});

// import routes
import userRoutes from "./routes/userRoutes.js";
import blockRoutes from "./routes/blockRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import flatRoutes from "./routes/flatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ownerDocumentRoutes from "./routes/ownerDocumentRoutes.js";
import rentalRoutes from "./routes/rentalRoutes.js";
import familyRoutes from "./routes/familyMembersRoutes.js";
import petsRoutes from "./routes/petsRoutes.js";
import vehicleRoutes from "./routes/vehicleDetailsRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import jobSchedulerRoutes from "./routes/jobSchedulerRoutes.js";
import associationRoutes from "./routes/associationRoutes.js";
import associationDetailsRoutes from "./routes/associationDetailsRoutes.js";
import positionRoutes from "./routes/positionRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import maintenanceCalculationRoutes from "./routes/maintenanceCalculationRoutes.js";
import maintenanceConfigRoutes from "./routes/maintenanceConfigurationRoutes.js";
import productWarrantyRoutes from "./routes/productWarrantyRoutes.js";
import bylawRoutes from "./routes/bylawRoutes.js";
import amenityRoutes from "./routes/amenityRoutes.js";
import amenityBookingRoutes from "./routes/amenityBookingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

app.use(cors);



// Set security HTTP headers
app.use(helmet());

// Limit request from the same API
const limiter = rateLimit({
  max: 150000,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: "Too Many Request from this IP, please try again in an hour",
});

app.use("/api", limiter);

// Trust proxy header
app.set("trust proxy", 1); // Replace '1' with 'true' if behind multiple proxies

// Body parser, reading data from body into req.body
app.use(
  json({
    limit: "25MB",
  })
);

// Data sanitization against No sql query injection
app.use(mongoSanitize());

// Data sanitization against XSS(clean user input from malicious HTML code)
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ message: "Welcome to Apartmet application." });
});

// routes path define here
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/blocks", blockRoutes);
app.use("/api/v1/flats", flatRoutes);
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/rental", rentalRoutes);
app.use("/api/v1/owner", ownerDocumentRoutes);
app.use("/api/v1/family", familyRoutes);
app.use("/api/v1/pets", petsRoutes);
app.use("/api/v1/maintenance", maintenanceRoutes);
app.use("/api/v1/vehicle", vehicleRoutes);
app.use("/api/v1/product", productWarrantyRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/query", queryRoutes);
app.use("/api/v1/job-scheduler", jobSchedulerRoutes);
app.use("/api/v1/association", associationRoutes);
app.use("/api/v1/association/details", associationDetailsRoutes);
app.use("/api/v1/position", positionRoutes);
app.use("/api/v1/maintenance/calculation", maintenanceCalculationRoutes);
app.use("/api/v1/maintenance/config", maintenanceConfigRoutes);
app.use("/api/v1/law", bylawRoutes);
app.use("/api/v1/amenity", amenityRoutes);
app.use("/api/v1/amenity/booking", amenityBookingRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/notification", notificationRoutes);

cronSchedule();

export default app;
