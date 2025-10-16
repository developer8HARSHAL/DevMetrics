import Request from "../models/Request.js";

// GET /logs → return all logs
export const getLogs = async (req, res) => {
  try {
    const logs = await Request.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};

// GET /logs/summary → aggregated stats (example)
export const getLogsSummary = async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments();
    const errorCount = await Request.countDocuments({ status: { $gte: 400 } });

    res.json({ totalRequests, errorCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};
