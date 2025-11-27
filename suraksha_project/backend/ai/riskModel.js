const { spawn } = require("child_process");
const path = require("path");

/**
 * Normalize input data (handles camelCase + snake_case)
 */
function normalizeInput(data) {
  return {
    attendance: Number(data.attendance || data.Attendance || 0),
    cgpa: Number(data.cgpa || data.CGPA || 0),
    financial_score: Number(data.financial_score || data.financialScore || 0),
    study_hours: Number(data.study_hours || data.studyHours || 0),
    previous_year_backlogs: Number(
      data.previous_year_backlogs || data.previousYearBacklogs || 0
    ),
  };
}

/**
 * Execute Python prediction script safely (supports spaces in file path)
 */
async function executePythonScript(inputData) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "predict.py");

    console.log("Running Python script:", scriptPath);

    const py = spawn("python", [scriptPath], {
      shell: true, // important for paths with spaces
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    py.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    py.on("error", (err) => {
      console.error("Python process error:", err);
      reject({
        success: false,
        error: "PythonProcessError",
        details: err.message,
      });
    });

    py.on("close", (code) => {
      console.log(`Python process exited with code ${code}`);

      if (stderr.trim()) {
        console.error("Python stderr:", stderr);
        return reject({
          success: false,
          error: "PythonExecutionError",
          details: stderr,
        });
      }

      if (!stdout.trim()) {
        return reject({
          success: false,
          error: "EmptyPythonOutput",
          details: "Python returned empty result",
        });
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        console.error("Failed to parse Python JSON:", err, "RAW:", stdout);
        reject({
          success: false,
          error: "InvalidJSONOutput",
          details: stdout,
        });
      }
    });

    // send data to python
    py.stdin.write(JSON.stringify(inputData));
    py.stdin.end();
  });
}

/**
 * Main prediction function
 */
async function predictRisk(rawInput) {
  try {
    console.log("Raw input to predictRisk:", rawInput);

    const normalized = normalizeInput(rawInput);
    console.log("Normalized input:", normalized);

    const result = await executePythonScript(normalized);
    console.log("Python result:", result);

    if (!result.success) {
      throw result;
    }

    return {
      risk: result.risk,
      score: result.score,
    };
  } catch (err) {
    console.error("Prediction Error in predictRisk:", err);
    throw err;
  }
}

module.exports = { predictRisk };
