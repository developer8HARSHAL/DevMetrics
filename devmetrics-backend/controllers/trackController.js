import Request from "../models/Request.js";

// Receives SDK POST data
export const handleTrack = async (req, res) => {
  try {
    const { apiKey, endpoint, status, responseTime } = req.body;

    const newRequest = new Request({
      apiKey,
      endpoint,
      status,
      responseTime,
      timestamp: new Date(),
    });

    await newRequest.save();

    res.status(201).json({ message: "Request tracked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to track request" });
  }
};
