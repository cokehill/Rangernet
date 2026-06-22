const express = require("express");
const router = express.Router();
const { airtime } = require("../at");
const { rewardLog } = require("../store");

// POST /api/airtime/reward — send airtime to a reporter
router.post("/reward", async (req, res) => {
  const { phoneNumber, amount = 50 } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "phoneNumber is required" });
  }

  try {
    const result = await airtime.send({
      recipients: [{ phoneNumber, currencyCode: "NGN", amount }],
    });

    const entry = {
      phoneNumber,
      amount,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    rewardLog.push(entry);
    res.json({ success: true, entry, result });
  } catch (err) {
    console.error("Airtime reward error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/airtime/log
router.get("/log", (req, res) => {
  res.json(rewardLog);
});

module.exports = router;
