require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ussdRoutes = require("./routes/ussd");
const smsRoutes = require("./routes/sms");
const airtimeRoutes = require("./routes/airtime");
const incidentRoutes = require("./routes/incidents");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Africa's Talking USSD callback
app.post("/ussd", ussdRoutes);

// Internal API routes
app.use("/api/sms", smsRoutes);
app.use("/api/airtime", airtimeRoutes);
app.use("/api/incidents", incidentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "RangerNet API", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🦁 RangerNet backend running on port ${PORT}`);
});

module.exports = app;
