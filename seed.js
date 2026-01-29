require("dotenv").config();
const mongoose = require("mongoose");
const Measurement = require("./models/Measurement");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB for seeding");

    const baseDate = new Date("2026-01-01");
    const data = [];

    for (let i = 0; i < 30; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);

      data.push({
        timestamp: d,
        field1: Math.random() * 100,
        field2: 50 + Math.random() * 10,
        field3: 1000 + Math.random() * 200
      });
    }

    await Measurement.deleteMany({});
    await Measurement.insertMany(data);

    console.log(`✅ Seed completed: ${data.length} documents inserted`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
}

seed();
