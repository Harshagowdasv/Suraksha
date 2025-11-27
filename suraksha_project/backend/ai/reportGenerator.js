const PDFDocument = require('pdfkit');
const { predictRisk } = require('./riskModel');
const getTips = require('./tips');

// Helper: safely get both camelCase + snake_case fields
function getValue(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      return obj[k];
    }
  }
  return 0;
}

async function createPdfReport(student, aiData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(18).text("Student Risk Report", {
      align: "center",
      underline: true,
    });
    doc.moveDown();

    // Student Info
    doc.fontSize(14).text("Student Information", { underline: true });
    doc.fontSize(12).text(`Name: ${student.name}`);
    doc.text(`USN: ${student.usn}`);
    doc.text(`Email: ${student.email}`);
    doc.moveDown();

    // Academic Info
    doc.fontSize(14).text("Academic Information", { underline: true });

    const attendance = getValue(student, "attendance", "Attendance");
    const cgpa = getValue(student, "cgpa", "CGPA");

    const financialScore = getValue(
      student,
      "financial_score",
      "financialScore"
    );

    const studyHours = getValue(
      student,
      "study_hours",
      "studyHours"
    );

    const backlogs = getValue(
      student,
      "previous_year_backlogs",
      "previousYearBacklogs"
    );

    doc.fontSize(12).text(`Attendance: ${attendance}%`);
    doc.text(`CGPA: ${cgpa}`);
    doc.text(`Financial Score: ${financialScore}`);
    doc.text(`Study Hours: ${studyHours}`);
    doc.text(`Previous Year Backlogs: ${backlogs}`);
    doc.moveDown();

    // Risk Assessment
    doc.fontSize(14).text("Risk Assessment", { underline: true });
    doc.fontSize(12).text(`Risk Level: ${aiData.risk}`);
    doc.text(`Risk Score: ${aiData.score}`);
    doc.moveDown();

    // AI Recommendations
    doc.fontSize(14).text("AI Recommendations", { underline: true });
    aiData.tips.forEach((tip, i) => {
      doc.fontSize(12).text(`${i + 1}. ${tip}`);
    });

    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });

    doc.end();
  });
}

// FIXED: Support both snake_case & camelCase for predictions
async function runAiPrediction(student) {
  const attendance = getValue(student, "attendance", "Attendance");
  const cgpa = getValue(student, "cgpa", "CGPA");
  const financialScore = getValue(student, "financial_score", "financialScore");
  const studyHours = getValue(student, "study_hours", "studyHours");
  const backlogs = getValue(student, "previous_year_backlogs", "previousYearBacklogs");

  const prediction = await predictRisk({
    attendance: Number(attendance),
    cgpa: Number(cgpa),
    financial_score: Number(financialScore),
    study_hours: Number(studyHours),
    previous_year_backlogs: Number(backlogs),
  });

  return {
    risk: prediction.risk,
    score: prediction.score,
    tips: getTips(prediction.risk),
  };
}

module.exports = { createPdfReport, runAiPrediction };
