const express = require("express");
const { query, validationResult } = require("express-validator");
const Measurement = require("../models/Measurement");

const router = express.Router();

const allowedFields = ["field1", "field2", "field3"];

function parseDateYYYYMMDD(s) {
  if (!s) return null;
  const trimmed = String(s).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// GET /api/measurements?field=field1&start_date=2024-10-01&end_date=2024-10-20&page=1&limit=50
router.get(
  "/",
  [
    query("field").custom((v) => allowedFields.includes(v)),
    query("start_date").optional().custom((v) => !!parseDateYYYYMMDD(v)),
    query("end_date").optional().custom((v) => !!parseDateYYYYMMDD(v)),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 500 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid query", details: errors.array() });
      }

      const field = req.query.field;
      const start = parseDateYYYYMMDD(req.query.start_date);
      const end = parseDateYYYYMMDD(req.query.end_date);

      const page = parseInt(req.query.page || "1", 10);
      const limit = parseInt(req.query.limit || "200", 10);
      const skip = (page - 1) * limit;

      const filter = {};
      if (start || end) {
        filter.timestamp = {};
        if (start) filter.timestamp.$gte = start;
        if (end) {
          // включим весь день end_date
          const endPlus = new Date(end);
          endPlus.setDate(endPlus.getDate() + 1);
          filter.timestamp.$lt = endPlus;
        }
      }

      // важно: чтобы не возвращать записи, где выбранное поле пустое
      filter[field] = { $ne: null };

      const [total, docs] = await Promise.all([
        Measurement.countDocuments(filter),
        Measurement.find(filter)
          .sort({ timestamp: 1 })
          .skip(skip)
          .limit(limit)
          .select({ _id: 0, timestamp: 1, [field]: 1 })
      ]);

      if (docs.length === 0) {
        return res.status(404).json({ error: "No data in this date range" });
      }

      res.json({
        meta: { field, page, limit, total, pages: Math.ceil(total / limit) },
        data: docs
      });
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/measurements/metrics?field=field2&start_date=2024-10-01&end_date=2024-10-20
router.get(
  "/metrics",
  [
    query("field").custom((v) => allowedFields.includes(v)),
    query("start_date").optional().custom((v) => !!parseDateYYYYMMDD(v)),
    query("end_date").optional().custom((v) => !!parseDateYYYYMMDD(v))
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid query", details: errors.array() });
      }

      const field = req.query.field;
      const start = parseDateYYYYMMDD(req.query.start_date);
      const end = parseDateYYYYMMDD(req.query.end_date);

      const match = { [field]: { $ne: null } };
      if (start || end) {
        match.timestamp = {};
        if (start) match.timestamp.$gte = start;
        if (end) {
          const endPlus = new Date(end);
          endPlus.setDate(endPlus.getDate() + 1);
          match.timestamp.$lt = endPlus;
        }
      }

      const result = await Measurement.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avg: { $avg: `$${field}` },
            min: { $min: `$${field}` },
            max: { $max: `$${field}` },
            stdDev: { $stdDevPop: `$${field}` }
          }
        },
        { $project: { _id: 0, count: 1, avg: 1, min: 1, max: 1, stdDev: 1 } }
      ]);

      if (!result.length) {
        return res.status(404).json({ error: "No data for metrics in this range" });
      }

      res.json({ field, ...result[0] });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
