import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  apiKey: { type: String, required: true },
  endpoint: { type: String, required: true },
  status: { type: Number, required: true },
  responseTime: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Request = mongoose.model("Request", requestSchema);

export default Request;
