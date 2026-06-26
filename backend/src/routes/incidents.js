const express = require("express");
const router = express.Router();
const { incidents } = require("../store");

// GET /api/incidents — all incidents (for dashboard)
router.get("/", (req, res) => {
  const sorted = [...incidents].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  res.json(sorted);
});

// GET /api/incidents/stats — summary counts
router.get("/stats", (req, res) => {
  const total = incidents.length;
  const critical = incidents.filter((i) => i.status === "critical").length;
  const open = incidents.filter((i) => i.status === "open").length;
  const rewarded = incidents.filter((i) => i.rewarded).length;

  const byType = incidents.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});

  const byZone = incidents.reduce((acc, i) => {
    acc[i.zone] = (acc[i.zone] || 0) + 1;
    return acc;
  }, {});

  res.json({ total, critical, open, rewarded, byType, byZone });
});

// PATCH /api/incidents/:id/resolve
router.patch("/:id/resolve", (req, res) => {
  const incident = incidents.find((i) => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: "Not found" });
  incident.status = "resolved";
  res.json(incident);
});

module.exports = router;

// PATCH /api/incidents/:id/status — update from dashboard
router.patch("/:id/status", (req, res) => {
  const incident = incidents.find((i) => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: "Not found" });
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "status required" });
  incident.status = status;
  incident.rangerResponse = {
    from: "dashboard",
    action: status,
    timestamp: new Date().toISOString(),
  };
  res.json(incident);
});
