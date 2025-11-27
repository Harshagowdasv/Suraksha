function getTips(risk) {
  const r = String(risk).toLowerCase();

  if (r === "high") {
    return [
      "Attend at least 80% of classes.",
      "Study a minimum of 2 hours every day.",
      "Meet your mentor weekly for guidance.",
      "Work on clearing previous backlogs immediately.",
      "Reduce distractions such as mobile usage during study time."
    ];
  }

  if (r === "moderate" || r === "medium") {
    return [
      "Maintain attendance above 75%.",
      "Study at least 1 hour daily.",
      "Revise concepts weekly.",
      "Focus on weak subjects consistently."
    ];
  }

  return [
    "Keep up the good performance.",
    "Participate in academic and technical activities.",
    "Aim to maintain a CGPA above 8.",
    "Continue practicing effective study habits."
  ];
}

module.exports = getTips;
