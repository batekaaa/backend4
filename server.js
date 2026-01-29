require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const measurementsRoutes = require("./routes/measurements");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(express.static("public"));
app.use("/api/measurements", measurementsRoutes);
app.use(errorHandler);

async function start() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is missing in .env");

    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");

    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));
  } catch (e) {
    console.error("❌ Startup error:", e.message);
    process.exit(1);
  }
}

start();
