import { groupBy, countBy, orderBy } from "lodash";

/**
 * Detects the type of log format and returns the appropriate parser
 */
export function detectLogFormat(logs) {
  const lines = logs.trim().split("\n");

  // Check for JSON format
  if (lines[0].trim().startsWith("{") && lines[0].trim().endsWith("}")) {
    return "json";
  }

  // Check for Apache/NGINX access logs
  if (
    lines[0].includes("[") &&
    (lines[0].includes("GET") ||
      lines[0].includes("POST") ||
      lines[0].includes("PUT"))
  ) {
    return "apache";
  }

  // Check for standard timestamp format
  const timestampRegex = /^\d{4}[-/]\d{2}[-/]\d{2}[ T]\d{2}:\d{2}:\d{2}/;
  if (timestampRegex.test(lines[0])) {
    return "timestamped";
  }

  // Default to generic format
  return "generic";
}

/**
 * Parse logs based on detected format
 */
export function parseLogData(logs) {
  const format = detectLogFormat(logs);
  const lines = logs.trim().split("\n");

  switch (format) {
    case "json":
      return parseJsonLogs(lines);
    case "apache":
      return parseApacheLogs(lines);
    case "timestamped":
      return parseTimestampedLogs(lines);
    case "generic":
    default:
      return parseGenericLogs(lines);
  }
}

function parseJsonLogs(lines) {
  const parsedLogs = [];

  lines.forEach((line) => {
    try {
      if (line.trim()) {
        const logEntry = JSON.parse(line);
        parsedLogs.push({
          timestamp:
            logEntry.timestamp ||
            logEntry.time ||
            logEntry.date ||
            new Date().toISOString(),
          level: logEntry.level || logEntry.severity || "INFO",
          message: logEntry.message || logEntry.msg || JSON.stringify(logEntry),
          source:
            logEntry.source || logEntry.service || logEntry.logger || "unknown",
          ...logEntry,
        });
      }
    } catch (error) {
      console.error("Error parsing JSON log:", error);
    }
  });

  return analyzeLogs(parsedLogs);
}

function parseApacheLogs(lines) {
  const parsedLogs = [];
  // Example Apache/NGINX log format: 127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
  const apacheRegex =
    /^(\S+) \S+ \S+ \[([\w:/]+\s[+\-]\d{4})\] "(\S+) (\S+) ([^"]*)" (\d+) (\d+)/;

  lines.forEach((line) => {
    if (line.trim()) {
      const match = line.match(apacheRegex);
      if (match) {
        parsedLogs.push({
          ip: match[1],
          timestamp: match[2],
          method: match[3],
          path: match[4],
          protocol: match[5],
          statusCode: parseInt(match[6]),
          responseSize: parseInt(match[7]),
          raw: line,
        });
      } else {
        parsedLogs.push({ raw: line });
      }
    }
  });

  return analyzeLogs(parsedLogs);
}

function parseTimestampedLogs(lines) {
  const parsedLogs = [];
  // Match common timestamp patterns and log levels
  const timestampRegex =
    /^(\d{4}[-/]\d{2}[-/]\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+(?:[\[\(]?([A-Z]+)[\]\)]?\s+)?(.+)/;

  lines.forEach((line) => {
    if (line.trim()) {
      const match = line.match(timestampRegex);
      if (match) {
        parsedLogs.push({
          timestamp: match[1],
          level: match[2] || "INFO",
          message: match[3],
          raw: line,
        });
      } else {
        parsedLogs.push({ raw: line });
      }
    }
  });

  return analyzeLogs(parsedLogs);
}

function parseGenericLogs(lines) {
  // For generic logs, we'll just do basic pattern analysis
  const parsedLogs = lines
    .filter((line) => line.trim())
    .map((line) => ({ raw: line }));
  return analyzeLogs(parsedLogs);
}

/**
 * Analyze parsed logs to extract useful metrics
 */
export function analyzeLogs(parsedLogs) {
  if (parsedLogs.length === 0) {
    return {
      totalLogs: 0,
      aggregations: {},
    };
  }

  // Extract common fields for analysis based on the log format
  const sampleLog = parsedLogs[0];
  const metrics = {};

  // Time-based distribution
  if (sampleLog.timestamp) {
    const timeGroups = groupBy(parsedLogs, (log) => {
      if (!log.timestamp) return "unknown";
      // Try to extract just the hour for hourly distribution
      const match = log.timestamp.match(/\d{2}:\d{2}/);
      return match ? match[0] : "unknown";
    });

    metrics.timeDistribution = Object.entries(timeGroups)
      .map(([time, logs]) => ({
        time,
        count: logs.length,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  // Log level distribution
  if (sampleLog.level) {
    metrics.levelDistribution = Object.entries(countBy(parsedLogs, "level"))
      .map(([level, count]) => ({
        level,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Status code distribution (for HTTP logs)
  if (sampleLog.statusCode) {
    metrics.statusDistribution = Object.entries(
      countBy(parsedLogs, "statusCode")
    )
      .map(([status, count]) => ({
        status,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Most requested paths
    metrics.pathDistribution = Object.entries(countBy(parsedLogs, "path"))
      .map(([path, count]) => ({
        path,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Message pattern analysis for all log types
  const commonPatterns = {};
  parsedLogs.forEach((log) => {
    const message = log.message || log.raw;
    if (message) {
      // Extract the first few words as a pattern
      const pattern = message.split(" ").slice(0, 5).join(" ");
      commonPatterns[pattern] = (commonPatterns[pattern] || 0) + 1;
    }
  });

  metrics.patternDistribution = Object.entries(commonPatterns)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalLogs: parsedLogs.length,
    format: detectLogFormat(parsedLogs[0].raw || JSON.stringify(parsedLogs[0])),
    sampleLog: parsedLogs[0],
    aggregations: metrics,
  };
}
