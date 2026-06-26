const express = require("express");
const router = express.Router();
const { incidents } = require("../store");
const { sms } = require("../at");

// POST /api/sms/broadcast
router.post("/broadcast", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: "to and message are required" });
  const recipients = Array.isArray(to) ? to : [to];
  try {
    const result = await sms.send({ to: recipients, message, from: process.env.AT_SENDER_ID || null });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/incoming — AT webhook for ranger SMS replies
router.post("/incoming", (req, res) => {
  const { from, text } = req.body;
  if (!text) return res.sendStatus(200);

  const upper = text.trim().toUpperCase();
  const confirmMatch = upper.match(/^CONFIRM\s*([A-Z0-9]*)/);
  const enrouteMatch = upper.match(/^ENROUTE\s*([A-Z0-9]*)/);
  const resolvedMatch = upper.match(/^RESOLVE[D]?\s*([A-Z0-9]*)/);

  let newStatus = null;
  let incidentId = null;

  if (confirmMatch) { newStatus = "confirmed"; incidentId = confirmMatch[1] || null; }
  else if (enrouteMatch) { newStatus = "enroute"; incidentId = enrouteMatch[1] || null; }
  else if (resolvedMatch) { newStatus = "resolved"; incidentId = resolvedMatch[1] || null; }

  if (!newStatus) {
    sms.send({ to: [from], message: `RangerNet: Unknown command.\nReply:\nCONFIRM [ID]\nENROUTE [ID]\nRESOLVED [ID]`, from: process.env.AT_SENDER_ID || null }).catch(console.error);
    return res.sendStatus(200);
  }

  let matched = incidentId ? incidents.find((i) => i.id === incidentId) : null;
  if (!matched) matched = [...incidents].reverse().find((i) => i.status === "critical" || i.status === "open");

  if (matched) {
    matched.status = newStatus;
    matched.rangerResponse = { from, action: newStatus, timestamp: new Date().toISOString() };
    console.log(`✅ Ranger ${from} → #${matched.id} → ${newStatus}`);
    sms.send({ to: [from], message: `RangerNet: #${matched.id} marked ${newStatus.toUpperCase()}. Dashboard updated.`, from: process.env.AT_SENDER_ID || null }).catch(console.error);
  } else {
    sms.send({ to: [from], message: `RangerNet: No open incident found. Use CONFIRM [ID] to specify.`, from: process.env.AT_SENDER_ID || null }).catch(console.error);
  }

  res.sendStatus(200);
});

router.get("/incoming", (req, res) => res.sendStatus(200));

module.exports = router;