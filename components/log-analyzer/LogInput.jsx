"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

// Size threshold for showing warnings
const LARGE_LOG_WARNING_THRESHOLD = 1000000; // ~1MB
// Remove the hard max limit - we'll handle any size logs
// const MAX_LOG_SIZE = 10000000; // ~10MB

export default function LogInput({ onLogsSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logSize, setLogSize] = useState(0);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [fullAnalysisMode, setFullAnalysisMode] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  // Watch the logs input to check its size
  const logs = watch("logs");

  useEffect(() => {
    if (logs) {
      const size = new Blob([logs]).size;
      setLogSize(size);
      setShowSizeWarning(size > LARGE_LOG_WARNING_THRESHOLD);
    } else {
      setLogSize(0);
      setShowSizeWarning(false);
    }
  }, [logs]);

  const onSubmit = (data) => {
    setIsSubmitting(true);
    try {
      // Get log size
      const size = new Blob([data.logs]).size;

      // For very large logs, show an informational message with warning about full analysis
      if (size > LARGE_LOG_WARNING_THRESHOLD && fullAnalysisMode) {
        const sizeInMB = (size / 1024 / 1024).toFixed(2);
        const message = `The log data is large (${sizeInMB}MB) and you've enabled full analysis mode. This may take significant time and memory. Continue?`;

        if (!confirm(message)) {
          setIsSubmitting(false);
          return;
        }
      } else if (size > LARGE_LOG_WARNING_THRESHOLD) {
        const sizeInMB = (size / 1024 / 1024).toFixed(2);
        const message = `The log data is large (${sizeInMB}MB). Processing may take some time and could temporarily use significant memory. The application will use optimized techniques to handle this data efficiently.`;

        if (!confirm(message)) {
          setIsSubmitting(false);
          return;
        }
      }

      // Pass the full analysis mode flag along with the log data
      onLogsSubmit(data.logs, fullAnalysisMode);

      // Don't reset for large logs so users don't have to paste again
      if (size < LARGE_LOG_WARNING_THRESHOLD) {
        reset();
      }
    } catch (error) {
      console.error("Error processing logs:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mb-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="logs" className="block text-sm font-medium mb-1">
              Paste your logs here
            </label>
            <textarea
              id="logs"
              {...register("logs", { required: "Log data is required" })}
              className="w-full h-64 p-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste your log data here..."
            />
            {errors.logs && (
              <p className="mt-1 text-sm text-red-600">{errors.logs.message}</p>
            )}

            {showSizeWarning && (
              <p className="mt-1 text-sm text-amber-600">
                <span className="font-medium">Note:</span> Large log file
                detected ({(logSize / 1024 / 1024).toFixed(2)}MB).
                {fullAnalysisMode
                  ? " Full analysis mode will process every line without sampling."
                  : " Consider enabling full analysis mode for detecting anomalies."}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-500">
              Supports JSON logs, Apache/NGINX access logs, timestamped logs,
              and more. No size limits - process logs of any size.
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="fullAnalysis"
              checked={fullAnalysisMode}
              onChange={(e) => setFullAnalysisMode(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="fullAnalysis"
              className="ml-2 block text-sm text-gray-700"
            >
              Enable full analysis mode (analyze all logs, detect anomalies)
            </label>
            <div className="ml-2 group relative cursor-pointer">
              <span className="text-gray-400 hover:text-gray-600">ⓘ</span>
              <div className="absolute bottom-full mb-2 left-0 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 w-64">
                Full analysis processes every log line without sampling, detects
                anomalies, and finds outliers like long response times. May be
                slower for very large logs.
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="px-4 py-2">
              {isSubmitting ? "Processing..." : "Analyze Logs"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
