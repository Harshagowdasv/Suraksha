const express = require("express");
const auth = require("../middleware/authMiddleware");
const { predictRisk } = require("../ai/riskModel");
const getTips = require("../ai/tips");

// 👉 FIXED — missing imports
const { createPdfReport, runAiPrediction } = require("../ai/reportgenerator");

const router = express.Router();

// Protect all AI routes
router.use(auth);

/*************************************************
 🚀 Normalize incoming student field names
**************************************************/
function normalizeFields(body) {
  return {
    attendance: parseFloat(body.attendance || body.Attendance || 0),
    cgpa: parseFloat(body.cgpa || body.CGPA || 0),
    financial_score: parseFloat(body.financial_score || body.financialScore || 0),
    study_hours: parseFloat(body.study_hours || body.studyHours || 0),
    previous_year_backlogs: parseInt(body.previous_year_backlogs || body.previousYearBacklogs || 0)
  };
}

/*************************************************
 🔮 AI Prediction Route (Works)
**************************************************/
router.post("/predict", async (req, res) => {
  try {
    const normalized = normalizeFields(req.body);

    const result = await predictRisk(normalized);
    const tips = getTips(result.risk);

    return res.json({
      success: true,
      risk: result.risk,
      score: result.score,
      tips
    });

  } catch (err) {
    console.error("AI Prediction Error:", err);
    res.status(500).json({
      success: false,
      message: "AI prediction failed",
      error: err.toString()
    });
  }
});

/*************************************************
 📄 FIXED — DOWNLOAD FULL PDF REPORT
**************************************************/
router.post("/download-report", async (req, res) => {
  try {
    const { student } = req.body;

    if (!student) {
      return res.status(400).json({
        success: false,
        message: "Student data is required"
      });
    }

    // 👉 Generate AI data (risk + score + tips)
    const aiData = await runAiPrediction(student);

    // 👉 Generate PDF (Buffer)
    const pdfBuffer = await createPdfReport(student, aiData);

    // 👉 Return PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${student.usn || "student"}_report.pdf"`,
      "Content-Length": pdfBuffer.length
    });

    return res.send(pdfBuffer);

  } catch (err) {
    console.error("Error generating report:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: err.message
    });
  }
});

module.exports = router;
