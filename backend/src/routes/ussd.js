const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { incidents } = require("../store");
const { sms, airtime } = require("../at");

// Ranger phone numbers to notify (in production, pull from DB by zone)
const RANGER_NUMBERS = (process.env.RANGER_NUMBERS || "+2349000000000").split(",");

// USSD menu state machine
// sessionData tracks multi-step sessions by sessionId
const sessionData = {};

const INCIDENT_TYPES = {
  "1": "🐘 Animal Near Crops",
  "2": "🔫 Suspected Poaching",
  "3": "🪓 Illegal Logging",
  "4": "🚨 Other Emergency",
};

const ZONES = {
  "1": "North Zone (Igabi)",
  "2": "South Zone (Kachia)",
  "3": "East Zone (Kaura)",
  "4": "West Zone (Birnin Gwari)",
};

router.post("/", async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  // text is cumulative: e.g. "1*2" means user picked 1 then 2
  const parts = text ? text.split("*") : [];
  const step = parts.length;

  let response = "";

  try {
    if (step === 0 || text === "") {
      // Step 1 — Main menu
      response = `CON Welcome to RangerNet 🦁
Report an incident or get help.

1. Report Incident
2. Check My Reports
3. Emergency SOS
4. About RangerNet`;

    } else if (parts[0] === "1") {
      if (step === 1) {
        // Step 2 — Choose incident type
        response = `CON Select incident type:

1. Animal Near Crops
2. Suspected Poaching
3. Illegal Logging
4. Other Emergency`;

      } else if (step === 2) {
        // Step 3 — Choose zone
        response = `CON Select your zone:

1. North (Igabi)
2. South (Kachia)
3. East (Kaura)
4. West (Birnin Gwari)`;

      } else if (step === 3) {
        // Step 4 — Confirm
        const incidentType = INCIDENT_TYPES[parts[1]] || "Unknown";
        const zone = ZONES[parts[2]] || "Unknown";
        response = `CON Confirm your report:

Type: ${incidentType}
Zone: ${zone}

1. Confirm & Send
2. Cancel`;

      } else if (step === 4 && parts[3] === "1") {
        // Final step — Save incident, alert rangers, reward reporter
        const incidentType = INCIDENT_TYPES[parts[1]] || "Unknown";
        const zone = ZONES[parts[2]] || "Unknown";
        const incidentId = uuidv4().slice(0, 8).toUpperCase();

        const incident = {
          id: incidentId,
          type: incidentType,
          zone,
          reporter: phoneNumber,
          timestamp: new Date().toISOString(),
          status: "open",
        };

        incidents.push(incident);

        // Fire SMS to rangers
        const rangerMessage = `🚨 RANGERNET ALERT [${incidentId}]
Type: ${incidentType}
Zone: ${zone}
Time: ${new Date().toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos" })}
Reporter: ${phoneNumber}
Respond via RangerNet dashboard.`;

        try {
          await sms.send({
            to: RANGER_NUMBERS,
            message: rangerMessage,
            from: process.env.AT_SENDER_ID || null,
          });
        } catch (err) {
          console.error("SMS dispatch error:", err.message);
        }

        // Airtime reward to community informant (₦50)
        try {
          await airtime.send({
            recipients: [{ phoneNumber, currencyCode: "NGN", amount: 50 }],
          });
          incident.rewarded = true;
        } catch (err) {
          console.error("Airtime reward error:", err.message);
          incident.rewarded = false;
        }

        response = `END ✅ Report submitted! [#${incidentId}]
Rangers have been alerted.
You've received ₦50 airtime as a thank-you.

Thank you for protecting our wildlife 🌿`;

      } else if (step === 4 && parts[3] === "2") {
        response = `END Report cancelled. Dial again anytime.`;
      } else {
        response = `END Invalid selection. Please try again.`;
      }

    } else if (parts[0] === "2") {
      // Check My Reports
      const myReports = incidents
        .filter((i) => i.reporter === phoneNumber)
        .slice(-3);

      if (myReports.length === 0) {
        response = `END You have no reports yet.
Dial again to submit one.`;
      } else {
        const list = myReports
          .map((r, i) => `${i + 1}. #${r.id} - ${r.type} (${r.status})`)
          .join("\n");
        response = `END Your last ${myReports.length} report(s):

${list}`;
      }

    } else if (parts[0] === "3") {
      // Emergency SOS — immediate SMS blast, no multi-step needed
      const incidentId = uuidv4().slice(0, 8).toUpperCase();

      const incident = {
        id: incidentId,
        type: "🚨 EMERGENCY SOS",
        zone: "Unknown",
        reporter: phoneNumber,
        timestamp: new Date().toISOString(),
        status: "critical",
        rewarded: false,
      };

      incidents.push(incident);

      try {
        await sms.send({
          to: RANGER_NUMBERS,
          message: `🆘 SOS EMERGENCY [${incidentId}]
From: ${phoneNumber}
Time: ${new Date().toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos" })}
IMMEDIATE RESPONSE REQUIRED.`,
          from: process.env.AT_SENDER_ID || null,
        });
      } catch (err) {
        console.error("SOS SMS error:", err.message);
      }

      response = `END 🆘 SOS sent to all ranger units.
Report ID: #${incidentId}
Help is on the way. Stay safe.`;

    } else if (parts[0] === "4") {
      response = `END RangerNet protects wildlife in Kaduna State.
Report poaching, animal conflicts & emergencies.
Powered by Africa's Talking.`;

    } else {
      response = `END Invalid option. Please try again.`;
    }
  } catch (err) {
    console.error("USSD handler error:", err);
    response = `END An error occurred. Please try again later.`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

module.exports = router;
