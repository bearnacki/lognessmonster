import { groupBy, countBy, orderBy } from "lodash";

/**
 * Detects the type of log format and returns the appropriate parser
 */
export function detectLogFormat(logs) {
  // For large inputs, just check the first few lines
  const sampleLines =
    typeof logs === "string"
      ? logs
          .trim()
          .split("\n", 10)
          .filter((line) => line.trim())
      : Array.isArray(logs)
      ? logs.slice(0, 10).filter((line) => line.trim())
      : [];

  if (!sampleLines.length) return "generic";

  const firstLine = sampleLines[0];
  console.log("Detecting format for line:", firstLine);

  // Check for the custom server log format with curly braces for method and path
  // [26/Feb/2025:08:48:45 +0100] lims.wsse.local to: 127.0.0.1:8891 - 10.138.100.157 - - {GET /iapi/LangRes HTTP/1.1} - 200 - 0.302 - 21141
  const isCustomServerFormat =
    firstLine.match(/^\[\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}/) && // Has timestamp at start
    firstLine.includes("to:") && // Contains "to:"
    (firstLine.includes("{GET") || firstLine.includes("{POST")) && // Has method in curly braces
    firstLine.match(/\d+\s+-\s+[\d\.]+\s+-\s+\d+$/); // Ends with status code, time, and ID

  if (isCustomServerFormat) {
    console.log("Detected custom server format");
    return "custom-server";
  }

  // Check for JSON format
  if (firstLine.trim().startsWith("{") && firstLine.trim().endsWith("}")) {
    return "json";
  }

  // Check for Apache/NGINX access logs
  if (
    firstLine.includes("[") &&
    (firstLine.includes("GET") ||
      firstLine.includes("POST") ||
      firstLine.includes("PUT"))
  ) {
    return "apache";
  }

  // Check for standard timestamp format
  const timestampRegex = /^\d{4}[-/]\d{2}[-/]\d{2}[ T]\d{2}:\d{2}:\d{2}/;
  if (timestampRegex.test(firstLine)) {
    return "timestamped";
  }

  // Default to generic format
  return "generic";
}

/**
 * Parse logs based on detected format
 * Optimized for large inputs by sampling and memory-efficient processing
 */
export function parseLogData(logs, fullAnalysis = false) {
  // Split logs into lines
  let lines;
  if (typeof logs === "string") {
    // For very large inputs, handle memory efficiently
    const estimatedSize = logs.length;
    const isExtremelyLarge = estimatedSize > 100 * 1024 * 1024;

    if (isExtremelyLarge && !fullAnalysis) {
      console.log("Extremely large log detected, using sampling");
      // For extremely large logs, take samples
      const samplePoints = 10;
      const sampleSize = 3000;
      lines = [];

      for (let i = 0; i < samplePoints; i++) {
        const position = Math.floor((i / samplePoints) * logs.length);
        let sampleStart = position;

        if (position > 0 && position < logs.length) {
          while (sampleStart > 0 && logs[sampleStart] !== "\n") {
            sampleStart--;
          }
          if (logs[sampleStart] === "\n") sampleStart++;
        }

        const sampleText = logs.slice(sampleStart, sampleStart + 500000);
        const sampleLines = sampleText
          .split("\n")
          .slice(0, sampleSize / samplePoints);
        lines.push(...sampleLines);
      }
    } else {
      // Process all lines in full analysis mode or for smaller logs
      lines = logs.trim().split("\n");
    }
  } else if (Array.isArray(logs)) {
    lines = logs;
  } else {
    return {
      totalLogs: 0,
      format: "unknown",
      aggregations: {},
    };
  }

  // Parse all lines using universal patterns
  const parsedLogs = universalParse(lines, fullAnalysis);
  console.log(`Parsed ${parsedLogs.length} log lines universally`);

  // Detect anomalies if in full analysis mode
  if (fullAnalysis) {
    console.log("Running anomaly detection in full analysis mode");
    detectAnomalies(parsedLogs);
  }

  // Analyze the parsed logs
  const result = analyzeLogs(parsedLogs, fullAnalysis);

  // Handle large log sampling
  if (lines.length > 10000 && !fullAnalysis) {
    result.isSample = true;
    result.sampleSize = parsedLogs.length;
    result.fullSize = lines.length;
    result.samplingRatio = (lines.length / parsedLogs.length).toFixed(2);
  }

  return result;
}

/**
 * Universal log line parser that extracts common patterns
 */
function universalParse(lines, fullAnalysis = false) {
  const parsedLogs = [];
  // If in full analysis mode, we process all lines, otherwise limit to prevent memory issues
  const maxLogs = fullAnalysis ? lines.length : 15000;

  // Common patterns to extract
  const patterns = {
    // Timestamp patterns
    timestamp: [
      // ISO format: 2023-04-17T12:34:56.789Z
      {
        regex:
          /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/,
        group: 1,
      },
      // Common date format: [26/Feb/2025:08:48:45 +0100]
      {
        regex: /\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s[+-]\d{4})\]/,
        group: 1,
      },
      // Standard timestamp: 2023-04-17 12:34:56
      { regex: /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/, group: 1 },
      // US format: 04/17/2023 12:34:56
      { regex: /(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2})/, group: 1 },
      // Time only: 12:34:56
      { regex: /\b(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\b/, group: 1 },
    ],
    // Log level patterns
    logLevel: [
      {
        regex: /\b(ERROR|WARN|INFO|DEBUG|TRACE|FATAL|CRITICAL|NOTICE)\b/,
        group: 1,
      },
      {
        regex: /\[(ERROR|WARN|INFO|DEBUG|TRACE|FATAL|CRITICAL|NOTICE)\]/,
        group: 1,
      },
    ],
    // HTTP method patterns
    httpMethod: [
      { regex: /\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/, group: 1 },
      { regex: /\{(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s/, group: 1 },
    ],
    // URL/path patterns
    path: [
      // URL pattern with domain
      { regex: /https?:\/\/[^\s/$.?#].[^\s]*/, group: 0 },
      // Path pattern (common in web logs)
      { regex: /\s(\/[^\s"]*)\s/, group: 1 },
      // Path in curly braces (from custom server logs)
      {
        regex: /\{(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+([^\s}]+)/,
        group: 1,
      },
    ],
    // Status code patterns
    statusCode: [
      { regex: /\bstatus(?::|=|\s)(\d{3})\b/i, group: 1 },
      { regex: /\}\s+-\s+(\d{3})\s+-/, group: 1 },
      { regex: /\s(\d{3})\s+\d+\s+/, group: 1 }, // Common in Apache logs
      { regex: /\scode=(\d{3})\b/, group: 1 },
    ],
    // Response time patterns
    responseTime: [
      { regex: /\btime(?::|=|\s)(\d+(?:\.\d+)?)\b/i, group: 1 },
      { regex: /(\d+(?:\.\d+)?)\s*ms\b/, group: 1, multiplier: 0.001 }, // Convert ms to seconds
      { regex: /\s+-\s+(\d+\.\d+)\s+-/, group: 1 }, // Custom server logs
      { regex: /took\s+(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)\b/i, group: 1 },
    ],
    // IP address patterns
    ipAddress: [
      { regex: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/, group: 1 },
    ],
    // User/client ID patterns
    userId: [
      { regex: /\buser(?::|=|\s)["']?([^"'\s]+)["']?/i, group: 1 },
      { regex: /\bid(?::|=|\s)["']?([^"'\s]+)["']?/i, group: 1 },
      { regex: /\s+-\s+-\s+(\d+)$/, group: 1 }, // Custom server logs request ID
    ],
    // Error message patterns
    errorMessage: [
      { regex: /Error:\s+(.+?)(?:\n|$)/, group: 1 },
      { regex: /Exception:\s+(.+?)(?:\n|$)/, group: 1 },
      { regex: /failed[:\s]+(.+?)(?:\n|$)/i, group: 1 },
      { regex: /timeout[:\s]+(.+?)(?:\n|$)/i, group: 1 },
    ],
  };

  for (let i = 0; i < lines.length && parsedLogs.length < maxLogs; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const logEntry = {
      raw: line,
      lineNumber: i + 1, // Store the original line number for anomaly tracking
    };

    // Extract data using each pattern type
    for (const [field, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        const match = line.match(pattern.regex);
        if (match) {
          let value = match[pattern.group];

          // Apply transformations if needed
          if (pattern.multiplier && !isNaN(value)) {
            value = parseFloat(value) * pattern.multiplier;
          }

          // For multiple IPs, store the first as clientIp and any others as additional IPs
          if (field === "ipAddress") {
            if (!logEntry.clientIp) {
              logEntry.clientIp = value;
            } else if (!logEntry.serverIp) {
              logEntry.serverIp = value;
            }
          }
          // For path, extract base path without query params
          else if (field === "path") {
            // Store the full path
            logEntry.fullPath = value;

            // Extract base path without query parameters
            const queryIndex = value.indexOf("?");
            if (queryIndex > 0) {
              logEntry.path = value.substring(0, queryIndex);
            } else {
              logEntry.path = value;
            }
          }
          // For statusCode, ensure it's an integer
          else if (field === "statusCode") {
            logEntry.statusCode = parseInt(value, 10);
          }
          // For responseTime, ensure it's a float
          else if (field === "responseTime") {
            logEntry.responseTime = parseFloat(value);
          }
          // For standard fields, store them directly
          else {
            logEntry[field] = value;
          }

          break; // Stop after first match for this field type
        }
      }
    }

    // Rename logLevel to level for consistency
    if (logEntry.logLevel && !logEntry.level) {
      logEntry.level = logEntry.logLevel;
      delete logEntry.logLevel;
    }

    // Add the parsed entry if we found any meaningful data
    if (Object.keys(logEntry).length > 1) {
      // More than just 'raw'
      parsedLogs.push(logEntry);
    }
  }

  // Determine the log format based on the patterns found
  let detectedFormat = "generic";
  if (parsedLogs.length > 0) {
    const sample = parsedLogs.slice(0, 10);

    // Check how many entries have HTTP-related fields
    const httpCount = sample.filter(
      (log) => log.httpMethod || log.statusCode || log.path
    ).length;

    // Check how many entries have timestamps
    const timestampCount = sample.filter((log) => log.timestamp).length;

    // Check for log levels
    const logLevelCount = sample.filter((log) => log.level).length;

    // Determine format based on what's most common
    if (httpCount > sample.length * 0.5) {
      if (sample[0].serverIp && sample[0].responseTime) {
        detectedFormat = "server-logs";
      } else {
        detectedFormat = "http-logs";
      }
    } else if (logLevelCount > sample.length * 0.5) {
      detectedFormat = "application-logs";
    } else if (timestampCount > sample.length * 0.5) {
      detectedFormat = "timestamped-logs";
    }
  }

  // Tag the logs with their format
  parsedLogs.forEach((log) => {
    log.format = detectedFormat;
  });

  return parsedLogs;
}

/**
 * Detect anomalies in parsed logs
 * This function adds an 'anomalies' property to logs with detected anomalies
 */
function detectAnomalies(parsedLogs) {
  if (!parsedLogs.length) return;

  // Detect response time anomalies
  detectResponseTimeAnomalies(parsedLogs);

  // Detect error clusters
  detectErrorClusters(parsedLogs);

  // Detect unusual status code patterns
  detectStatusCodeAnomalies(parsedLogs);

  // Count how many anomalies we found
  const anomalyCount = parsedLogs.filter(
    (log) => log.anomalies && log.anomalies.length > 0
  ).length;
  console.log(
    `Detected ${anomalyCount} anomalies in ${parsedLogs.length} logs`
  );
}

/**
 * Detect response time anomalies using statistical methods
 */
function detectResponseTimeAnomalies(parsedLogs) {
  // Get all logs with response times
  const logsWithResponseTimes = parsedLogs.filter(
    (log) => typeof log.responseTime === "number" && !isNaN(log.responseTime)
  );

  if (logsWithResponseTimes.length < 10) return; // Not enough data for statistics

  // Calculate mean and standard deviation
  const responseTimes = logsWithResponseTimes.map((log) => log.responseTime);
  const mean =
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

  // Calculate standard deviation
  const squaredDiffs = responseTimes.map((time) => Math.pow(time - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
  const stdDev = Math.sqrt(variance);

  // Define threshold for anomalies
  // Values more than 3 standard deviations from the mean are considered anomalies
  const threshold = mean + 3 * stdDev;

  // Also identify the top 1% slowest requests as anomalies
  const sortedTimes = [...responseTimes].sort((a, b) => a - b);
  const percentile99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
  const anomalyThreshold = Math.min(threshold, percentile99);

  console.log(
    `Response time anomaly detection: Mean=${mean.toFixed(
      3
    )}s, StdDev=${stdDev.toFixed(3)}s, Threshold=${anomalyThreshold.toFixed(
      3
    )}s`
  );

  // Flag anomalies
  logsWithResponseTimes.forEach((log) => {
    if (log.responseTime > anomalyThreshold) {
      if (!log.anomalies) log.anomalies = [];
      log.anomalies.push({
        type: "slow_response",
        message: `Slow response time (${log.responseTime.toFixed(
          3
        )}s) exceeds threshold of ${anomalyThreshold.toFixed(3)}s`,
        severity: "high",
        value: log.responseTime,
        threshold: anomalyThreshold,
      });
    }
  });
}

/**
 * Detect clusters of errors
 */
function detectErrorClusters(parsedLogs) {
  // Look for logs with error indicators
  const errorLogs = parsedLogs.filter(
    (log) =>
      (log.level &&
        ["ERROR", "FATAL", "CRITICAL"].includes(log.level.toUpperCase())) ||
      (log.statusCode && log.statusCode >= 500) ||
      log.errorMessage
  );

  if (errorLogs.length < 3) return; // Not enough errors to find clusters

  // Sort errors by timestamp if available
  if (errorLogs[0].timestamp) {
    errorLogs.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return a.timestamp.localeCompare(b.timestamp);
    });

    // Look for clusters - errors that occur in rapid succession
    const errorClusters = [];
    let currentCluster = [errorLogs[0]];

    for (let i = 1; i < errorLogs.length; i++) {
      const currentLog = errorLogs[i];
      const prevLog = errorLogs[i - 1];

      // If logs have line numbers and they're close together, consider it a cluster
      if (currentLog.lineNumber && prevLog.lineNumber) {
        if (currentLog.lineNumber - prevLog.lineNumber < 10) {
          currentCluster.push(currentLog);
        } else {
          if (currentCluster.length >= 3) {
            // Minimum 3 errors to be a cluster
            errorClusters.push([...currentCluster]);
          }
          currentCluster = [currentLog];
        }
      }
    }

    // Check the last cluster
    if (currentCluster.length >= 3) {
      errorClusters.push(currentCluster);
    }

    // Mark the logs that are part of error clusters
    errorClusters.forEach((cluster, clusterIndex) => {
      cluster.forEach((log) => {
        if (!log.anomalies) log.anomalies = [];
        log.anomalies.push({
          type: "error_cluster",
          message: `Part of error cluster #${clusterIndex + 1} with ${
            cluster.length
          } errors`,
          severity: "high",
          clusterSize: cluster.length,
        });
      });
    });
  }
}

/**
 * Detect unusual status code patterns
 */
function detectStatusCodeAnomalies(parsedLogs) {
  // Get logs with status codes
  const logsWithStatusCodes = parsedLogs.filter((log) => log.statusCode);
  if (logsWithStatusCodes.length < 10) return; // Not enough data

  // Group by status code
  const statusGroups = {};
  logsWithStatusCodes.forEach((log) => {
    const status = log.statusCode;
    if (!statusGroups[status]) statusGroups[status] = [];
    statusGroups[status].push(log);
  });

  // Calculate percentage of each status code
  const total = logsWithStatusCodes.length;
  const statusStats = Object.entries(statusGroups).map(([status, logs]) => ({
    status: parseInt(status),
    count: logs.length,
    percentage: (logs.length / total) * 100,
  }));

  // Look for unusual status code patterns
  statusStats.forEach((stat) => {
    // High rate of server errors (5xx)
    if (stat.status >= 500 && stat.percentage > 5) {
      statusGroups[stat.status].forEach((log) => {
        if (!log.anomalies) log.anomalies = [];
        log.anomalies.push({
          type: "high_error_rate",
          message: `High rate of ${
            stat.status
          } errors (${stat.percentage.toFixed(1)}% of requests)`,
          severity: "high",
          percentage: stat.percentage,
        });
      });
    }

    // High rate of client errors (4xx)
    if (stat.status >= 400 && stat.status < 500 && stat.percentage > 20) {
      statusGroups[stat.status].forEach((log) => {
        if (!log.anomalies) log.anomalies = [];
        log.anomalies.push({
          type: "high_client_error_rate",
          message: `High rate of ${
            stat.status
          } errors (${stat.percentage.toFixed(1)}% of requests)`,
          severity: "medium",
          percentage: stat.percentage,
        });
      });
    }
  });
}

/**
 * Analyze parsed logs to extract useful metrics
 */
export function analyzeLogs(parsedLogs, fullAnalysis = false) {
  if (!parsedLogs.length) {
    return {
      totalLogs: 0,
      aggregations: {},
    };
  }

  // Extract common fields for analysis based on the log format
  const sampleLog = parsedLogs[0];
  const metrics = {};
  const format = sampleLog.format || "generic";

  // Time-based distribution
  if (parsedLogs.some((log) => log.timestamp)) {
    // Use a more efficient approach by creating a map first
    const timeCount = {};
    parsedLogs.forEach((log) => {
      if (!log.timestamp) return;
      // Try to extract just the hour:minute for hourly distribution
      let time = "unknown";
      const match = log.timestamp.match(/\d{2}:\d{2}/);
      if (match) {
        time = match[0];
      } else {
        // Try to extract date for daily distribution
        const dateMatch = log.timestamp.match(
          /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}\/\w{3}\/\d{4}/
        );
        if (dateMatch) {
          time = dateMatch[0];
        }
      }
      timeCount[time] = (timeCount[time] || 0) + 1;
    });

    metrics.timeDistribution = Object.entries(timeCount)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  // Log level distribution
  const logLevels = parsedLogs
    .filter((log) => log.level)
    .map((log) => log.level);
  if (logLevels.length > 0) {
    const levelCounts = {};
    logLevels.forEach((level) => {
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    metrics.levelDistribution = Object.entries(levelCounts)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count);
  }

  // HTTP method distribution
  const httpMethods = parsedLogs
    .filter((log) => log.httpMethod)
    .map((log) => log.httpMethod);
  if (httpMethods.length > 0) {
    const methodCounts = {};
    httpMethods.forEach((method) => {
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    metrics.methodDistribution = Object.entries(methodCounts)
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Status code distribution
  const statusCodes = parsedLogs
    .filter((log) => log.statusCode)
    .map((log) => log.statusCode);
  if (statusCodes.length > 0) {
    const statusCounts = {};
    statusCodes.forEach((status) => {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    metrics.statusDistribution = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Group by status category (2xx, 3xx, 4xx, 5xx)
    const statusCategories = {};
    statusCodes.forEach((status) => {
      const category = Math.floor(status / 100) + "xx";
      statusCategories[category] = (statusCategories[category] || 0) + 1;
    });

    metrics.statusCategoryDistribution = Object.entries(statusCategories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  // Path distribution
  const paths = parsedLogs.filter((log) => log.path).map((log) => log.path);
  if (paths.length > 0) {
    const pathCounts = {};
    paths.forEach((path) => {
      pathCounts[path] = (pathCounts[path] || 0) + 1;
    });

    metrics.pathDistribution = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Limit to top 10
  }

  // IP address distribution
  const ips = parsedLogs
    .filter((log) => log.clientIp)
    .map((log) => log.clientIp);
  if (ips.length > 0) {
    const ipCounts = {};
    ips.forEach((ip) => {
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    });

    metrics.clientIpDistribution = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Limit to top 10
  }

  // Server distribution
  const servers = parsedLogs
    .filter((log) => log.serverIp)
    .map((log) => log.serverIp);
  if (servers.length > 0) {
    const serverCounts = {};
    servers.forEach((server) => {
      serverCounts[server] = (serverCounts[server] || 0) + 1;
    });

    metrics.serverDistribution = Object.entries(serverCounts)
      .map(([server, count]) => ({ server, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Response time distribution
  const responseTimes = parsedLogs
    .filter((log) => log.responseTime !== undefined)
    .map((log) => log.responseTime);
  if (responseTimes.length > 0) {
    // Calculate statistics
    const min = Math.min(...responseTimes);
    const max = Math.max(...responseTimes);
    const avg =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    metrics.minResponseTime = min;
    metrics.maxResponseTime = max;
    metrics.avgResponseTime = avg;

    // Create response time buckets
    const ranges = [
      { min: 0, max: 0.1, label: "0-100ms" },
      { min: 0.1, max: 0.5, label: "100-500ms" },
      { min: 0.5, max: 1, label: "500ms-1s" },
      { min: 1, max: 2, label: "1-2s" },
      { min: 2, max: 5, label: "2-5s" },
      { min: 5, max: 10, label: "5-10s" },
      { min: 10, max: Infinity, label: "10s+" },
    ];

    const responseTimeCounts = {};
    ranges.forEach((range) => {
      responseTimeCounts[range.label] = 0;
    });

    responseTimes.forEach((time) => {
      const range = ranges.find((r) => time >= r.min && time < r.max);
      if (range) {
        responseTimeCounts[range.label]++;
      }
    });

    metrics.responseTimeDistribution = Object.entries(responseTimeCounts)
      .map(([range, count]) => ({ range, count }))
      .filter((item) => item.count > 0);
  }

  // Message/pattern analysis
  const patterns = {};
  const patternLimit = 10;

  parsedLogs.forEach((log) => {
    let message = "";

    // Try to extract the most meaningful part of the log for pattern analysis
    if (log.message) {
      message = log.message;
    } else if (log.raw) {
      // For raw logs, remove timestamps, IPs, and IDs which vary between log entries
      message = log.raw
        .replace(/\[\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s[+-]\d{4}\]/, "")
        .replace(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/,
          ""
        )
        .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, "[IP]")
        .replace(/\b\d{4,}\b/, "[ID]");
    }

    if (message) {
      // Extract a pattern (first few words)
      let pattern = "";
      if (typeof message === "string") {
        pattern = message.split(/\s+/).slice(0, 5).join(" ").trim();
      } else {
        pattern = String(message).substring(0, 50);
      }

      if (pattern) {
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      }
    }
  });

  metrics.patternDistribution = Object.entries(patterns)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, patternLimit);

  // If in full analysis mode, include anomaly data
  if (fullAnalysis) {
    // Extract anomalies
    const anomalies = parsedLogs
      .filter((log) => log.anomalies && log.anomalies.length > 0)
      .map((log) => ({
        timestamp: log.timestamp,
        lineNumber: log.lineNumber,
        anomalies: log.anomalies,
        details: {
          method: log.httpMethod,
          path: log.path,
          statusCode: log.statusCode,
          responseTime: log.responseTime,
          level: log.level,
          message: log.message || log.raw,
        },
      }));

    // Group anomalies by type
    const anomalyTypes = {};
    anomalies.forEach((anomaly) => {
      anomaly.anomalies.forEach((a) => {
        if (!anomalyTypes[a.type]) anomalyTypes[a.type] = [];
        anomalyTypes[a.type].push({
          ...anomaly,
          anomalyDetails: a,
        });
      });
    });

    // Create a summary of anomalies
    metrics.anomalySummary = Object.entries(anomalyTypes).map(
      ([type, items]) => ({
        type,
        count: items.length,
        examples: items.slice(0, 5), // Include up to 5 examples
      })
    );

    // Include the full list
    metrics.anomalies = anomalies;
  }

  return {
    totalLogs: parsedLogs.length,
    format,
    fullAnalysis,
    sampleLog,
    aggregations: metrics,
  };
}
