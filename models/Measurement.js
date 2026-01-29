const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true, index: true },
    field1: { type: Number, default: null },
    field2: { type: Number, default: null },
    field3: { type: Number, default: null }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Measurement", measurementSchema);
