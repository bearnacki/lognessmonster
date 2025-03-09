"use client";

import { useState, useCallback, useEffect } from "react";
import LogInput from "./LogInput";
import LogCharts from "./LogCharts";
import { parseLogData } from "@/lib/logParser";

// Constants for chunked processing
const BASE_CHUNK_SIZE = 1000; // Base number of lines to process at once
const VERY_LARGE_LOG_THRESHOLD = 50000; // Number of lines considered "very large"
const EXTREME_LOG_THRESHOLD = 200000; // Number of lines considered "extreme"
const CHUNK_DELAY = 10; // Delay between processing chunks in ms for UI responsiveness

export default function LogAnalyzer() {
  const [logAnalysis, setLogAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStats, setProcessingStats] = useState(null);
  const [fullAnalysisEnabled, setFullAnalysisEnabled] = useState(false);

  // Clean up memory when component unmounts or when analysis changes
  useEffect(() => {
    return () => {
      // Force garbage collection by releasing references
      setProcessingStats(null);
    };
  }, [logAnalysis]);

  const processLogChunks = useCallback((lines, fullAnalysis = false) => {
    return new Promise((resolve, reject) => {
      try {
        // Adaptive chunk size based on log size
        let chunkSize = BASE_CHUNK_SIZE;
        if (lines.length > EXTREME_LOG_THRESHOLD) {
          chunkSize = Math.max(100, Math.floor(BASE_CHUNK_SIZE / 4)); // Smaller chunks for extreme logs
          console.log(
            `Extreme log size detected (${lines.length} lines). Using smaller chunk size: ${chunkSize}`
          );
        } else if (lines.length > VERY_LARGE_LOG_THRESHOLD) {
          chunkSize = Math.max(250, Math.floor(BASE_CHUNK_SIZE / 2)); // Smaller chunks for very large logs
          console.log(
            `Very large log size detected (${lines.length} lines). Using adjusted chunk size: ${chunkSize}`
          );
        }

        const totalChunks = Math.ceil(lines.length / chunkSize);
        let processedChunks = 0;
        let processedLines = 0;

        // Track timing locally to avoid state timing issues
        const startTime = Date.now();
        let lastProgressUpdate = startTime;

        // Initialize processing stats
        setProcessingStats({
          totalLines: lines.length,
          chunkSize,
          totalChunks,
          startTime,
          fullAnalysis,
          processedChunks: 0,
          processedLines: 0,
        });

        // Define the function to process each chunk
        const processChunk = (chunkIndex) => {
          if (chunkIndex >= totalChunks) {
            // All chunks processed
            resolve(true);
            return;
          }

          // Update progress less frequently to reduce UI updates
          const now = Date.now();
          if (now - lastProgressUpdate > 100) {
            // Update progress max 10 times per second
            processedChunks = chunkIndex;
            const currentProgress = Math.floor(
              (processedChunks / totalChunks) * 100
            );
            setProgress(currentProgress);

            // Calculate timing information with local variables
            const elapsedMs = now - startTime;
            const remainingChunks = totalChunks - processedChunks;
            const msPerChunk = elapsedMs / (processedChunks || 1);
            const estimatedRemainingMs = remainingChunks * msPerChunk;

            // Update processing stats safely
            setProcessingStats((prev) => ({
              ...(prev || {}),
              totalLines: lines.length,
              chunkSize,
              totalChunks,
              startTime,
              fullAnalysis,
              processedChunks,
              processedLines,
              elapsedMs,
              estimatedRemainingMs,
              estimatedTotalMs: elapsedMs + estimatedRemainingMs,
            }));

            lastProgressUpdate = now;
          }

          // Calculate the start and end indices for this chunk
          const startIdx = chunkIndex * chunkSize;
          const endIdx = Math.min(startIdx + chunkSize, lines.length);
          processedLines = endIdx;

          // Process the next chunk after a short delay to let the UI breathe
          setTimeout(() => {
            processChunk(chunkIndex + 1);
          }, CHUNK_DELAY);
        };

        // Start processing the first chunk
        processChunk(0);
      } catch (err) {
        console.error("Error in processLogChunks:", err);
        reject(err);
      }
    });
  }, []);

  const handleLogSubmit = (logData, fullAnalysis = false) => {
    if (!logData.trim()) {
      setError("Please provide log data to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    setProcessingStats(null);
    setFullAnalysisEnabled(fullAnalysis);

    // Split log data into lines - we'll do this in a more memory-efficient way
    // by using a string split with limit for extremely large inputs
    const estimatedSize = new Blob([logData]).size;
    console.log(
      `Processing log data: approximately ${Math.round(
        estimatedSize / 1024 / 1024
      )}MB`
    );
    console.log(`Full analysis mode: ${fullAnalysis ? "enabled" : "disabled"}`);

    // For memory efficiency with very large logs
    let lines;
    try {
      if (estimatedSize > 50 * 1024 * 1024) {
        // Over 50MB
        // Use a more memory-efficient approach for extremely large logs
        console.log(
          "Using memory-efficient line splitting for extremely large log"
        );
        const chunkSize = 10 * 1024 * 1024; // 10MB chunks
        lines = [];

        // Process the string in chunks to avoid memory issues
        for (let i = 0; i < logData.length; i += chunkSize) {
          const chunk = logData.slice(i, i + chunkSize);
          const chunkLines = chunk.split("\n");

          // If this isn't the first chunk and there are lines
          if (i > 0 && lines.length > 0 && chunkLines.length > 0) {
            // The last line of the previous chunk might be continued in this chunk
            lines[lines.length - 1] += chunkLines[0];
            lines.push(...chunkLines.slice(1));
          } else {
            lines.push(...chunkLines);
          }

          // Update progress for the splitting process
          setProgress(Math.min(10, Math.floor((i / logData.length) * 10))); // Max 10% for splitting
        }
      } else {
        // Standard approach for normal-sized logs
        lines = logData.trim().split("\n");
      }

      console.log(
        `Split into ${lines.length} lines. Starting chunk processing...`
      );

      // Process logs in chunks to avoid UI freezes
      processLogChunks(lines, fullAnalysis)
        .then(() => {
          try {
            console.log("All chunks processed, performing final analysis...");
            // Final processing
            const analysis = parseLogData(logData, fullAnalysis);
            setLogAnalysis(analysis);
            console.log(
              "Analysis complete:",
              analysis.totalLogs,
              "logs processed"
            );
          } catch (err) {
            console.error("Error in final analysis:", err);
            setError(`Error analyzing logs: ${err.message}`);
          } finally {
            setIsAnalyzing(false);
            setProgress(0);
            setProcessingStats(null);

            // Help garbage collection by clearing references
            lines = null;
          }
        })
        .catch((err) => {
          console.error("Error in chunk processing:", err);
          setError(`Error processing logs: ${err.message}`);
          setIsAnalyzing(false);
          setProgress(0);
          setProcessingStats(null);

          // Help garbage collection by clearing references
          lines = null;
        });
    } catch (err) {
      console.error("Error splitting log data:", err);
      setError(`Error processing logs: ${err.message}`);
      setIsAnalyzing(false);
      setProgress(0);
      setProcessingStats(null);
    }
  };

  const formatTime = (ms) => {
    if (!ms) return "...";
    if (ms < 1000) return `${ms}ms`;

    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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
          <div className="mt-4 text-center p-6 bg-gray-50 rounded-lg border">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p className="text-gray-600 font-medium">
              Analyzing logs... {progress > 0 ? `${progress}% complete` : ""}
              {processingStats?.fullAnalysis && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Full Analysis
                </span>
              )}
            </p>

            {processingStats && (
              <div className="mt-2 text-sm text-gray-500">
                <p>
                  Processing{" "}
                  {processingStats.totalLines?.toLocaleString() || "..."} lines
                  {processingStats.processedLines
                    ? ` (${processingStats.processedLines.toLocaleString()} processed)`
                    : ""}
                </p>
                {processingStats.elapsedMs !== undefined && (
                  <p className="mt-1">
                    Time elapsed: {formatTime(processingStats.elapsedMs)}
                    {processingStats.estimatedRemainingMs !== undefined
                      ? ` • Estimated remaining: ${formatTime(
                          processingStats.estimatedRemainingMs
                        )}`
                      : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {logAnalysis && !isAnalyzing && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-xl font-bold mb-6">Analysis Results</h3>
          <LogCharts
            logAnalysis={logAnalysis}
            fullAnalysisMode={fullAnalysisEnabled}
          />
        </div>
      )}
    </div>
  );
}
