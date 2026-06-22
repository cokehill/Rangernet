const express = require("express");
const router = express.Router();
const { sms } = require("../at");

// POST /api/sms/broadcast — send manual alert from dashboard
router.post("/broadcast", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "to and message are required" });
  }

  const recipients = Array.isArray(to) ? to : [to];

  try {
    const result = await sms.send({
      to: recipients,
      message,
      from: process.env.AT_SENDER_ID || null,
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error("SMS broadcast error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
