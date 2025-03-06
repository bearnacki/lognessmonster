"use client";

import { useState } from "react";
import LogInput from "./LogInput";
import LogCharts from "./LogCharts";
import { parseLogData } from "@/lib/logParser";

export default function LogAnalyzer() {
  const [logAnalysis, setLogAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleLogSubmit = (logData) => {
    if (!logData.trim()) {
      setError("Please provide log data to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Process logs asynchronously to not block the UI
      setTimeout(() => {
        try {
          const analysis = parseLogData(logData);
          setLogAnalysis(analysis);
          setIsAnalyzing(false);
        } catch (err) {
          setError(`Error analyzing logs: ${err.message}`);
          setIsAnalyzing(false);
        }
      }, 0);
    } catch (err) {
      setError(`Error analyzing logs: ${err.message}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Log Analysis Tool</h2>
        <p className="text-gray-600 mb-6">
          Paste your logs below to analyze and visualize patterns, errors, and
          other insights. Supports various log formats including JSON,
          Apache/NGINX, and timestamped logs.
        </p>

        <LogInput onLogsSubmit={handleLogSubmit} />

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {isAnalyzing && (
          <div className="mt-4 text-center p-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Analyzing logs...</p>
          </div>
        )}
      </div>

      {logAnalysis && !isAnalyzing && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-6">Analysis Results</h3>
          <LogCharts logAnalysis={logAnalysis} />
        </div>
      )}
    </div>
  );
}
