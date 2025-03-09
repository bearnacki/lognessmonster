"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#A4DE6C",
  "#D0ED57",
  "#FAD000",
  "#F66D44",
];

// Format descriptions for user-friendly display
const FORMAT_LABELS = {
  generic: "Generic Log Format",
  "http-logs": "HTTP Access Logs",
  "server-logs": "Server Logs",
  "application-logs": "Application Logs",
  "timestamped-logs": "Timestamped Logs",
};

// Anomaly type descriptions
const ANOMALY_LABELS = {
  slow_response: "Slow Response Time",
  error_cluster: "Error Cluster",
  high_error_rate: "High Error Rate",
  high_client_error_rate: "High Client Error Rate",
};

// Severity colors
const SEVERITY_COLORS = {
  high: "text-red-600",
  medium: "text-orange-500",
  low: "text-yellow-500",
};

export default function LogCharts({ logAnalysis, fullAnalysisMode = false }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filterLocalIPs, setFilterLocalIPs] = useState(true);

  if (!logAnalysis || !logAnalysis.totalLogs) {
    return <div className="text-center p-8">No log data to display</div>;
  }

  // Extract values with safe defaults
  const {
    aggregations = {},
    totalLogs = 0,
    format = "generic",
    isSample = false,
    sampleSize = 0,
    fullSize = 0,
    samplingRatio = "1.00",
    sampleLog = {},
    fullAnalysis = false,
  } = logAnalysis || {};

  // Determine which tabs to show based on available data
  const hasTimeData = !!aggregations?.timeDistribution?.length;
  const hasHttpData = !!aggregations?.statusDistribution?.length;
  const hasResponseTimeData = !!aggregations?.responseTimeDistribution?.length;
  const hasServerData =
    !!aggregations?.serverDistribution?.length || hasResponseTimeData;
  const hasLogLevelData = !!aggregations?.levelDistribution?.length;
  const hasAnomalyData = !!aggregations?.anomalies?.length;

  // Format display name
  const formatDisplayName = FORMAT_LABELS[format] || format;

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Log Summary</h3>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Total Logs:</span>{" "}
            {totalLogs.toLocaleString()}
          </p>
          <p>
            <span className="font-medium">Detected Format:</span>{" "}
            {formatDisplayName}
          </p>
          {fullAnalysis && (
            <p className="text-blue-600">
              <span className="font-medium">Analysis Mode:</span> Full Analysis
              (Anomaly Detection Enabled)
            </p>
          )}
          {isSample && !fullAnalysis && (
            <>
              <p className="text-amber-600">
                <span className="font-medium">Note:</span> Analysis based on a
                sample of {sampleSize?.toLocaleString() || 0} logs from{" "}
                {fullSize?.toLocaleString() || 0} total logs
              </p>
              {samplingRatio && (
                <p className="text-xs text-gray-500">
                  Using {samplingRatio}x extrapolation for statistical estimates
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {aggregations?.methodDistribution && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">HTTP Methods</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregations.methodDistribution}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ method, count }) =>
                    `${method || "Unknown"}: ${count}`
                  }
                >
                  {aggregations.methodDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} requests`,
                    props?.payload?.method || "Unknown",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {aggregations?.levelDistribution && !aggregations?.methodDistribution && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Log Levels</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregations.levelDistribution}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ level, count }) =>
                    `${level || "Unknown"}: ${count}`
                  }
                >
                  {aggregations.levelDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} logs`,
                    props?.payload?.level || "Unknown",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {fullAnalysis && aggregations?.anomalySummary && (
        <div className="bg-white p-4 rounded-lg shadow col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <span className="mr-2">Anomaly Summary</span>
            {aggregations.anomalies?.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {aggregations.anomalies.length} Detected
              </span>
            )}
          </h3>
          {aggregations.anomalies?.length > 0 ? (
            <div className="space-y-2">
              {aggregations.anomalySummary.map((anomalyType, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">
                    {ANOMALY_LABELS[anomalyType.type] || anomalyType.type}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({anomalyType.count} instances)
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {anomalyType.examples[0]?.anomalyDetails?.message ||
                      "No details available"}
                  </p>
                </div>
              ))}
              <div className="text-center mt-4">
                <button
                  onClick={() => setActiveTab("anomalies")}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Anomalies →
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">
              No anomalies detected in analyzed logs.
            </p>
          )}
        </div>
      )}

      {aggregations?.patternDistribution && (
        <div className="bg-white p-4 rounded-lg shadow col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium mb-4">Common Message Patterns</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aggregations.patternDistribution.slice(0, 5)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="pattern"
                  width={250}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => [`${value} occurrences`]} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  const renderTimeDistribution = () => {
    if (!aggregations?.timeDistribution) {
      return <div className="text-center p-8">No time data available</div>;
    }

    // Check if we're dealing with data across multiple days
    const hasMultipleDays = aggregations.hasMultipleDays;
    // Check if data is grouped by hour
    const isGroupedByHour = aggregations.timeGroupedByHour;

    // Calculate an appropriate interval for x-axis labels based on data size
    const dataLength = aggregations.timeDistribution.length;
    // For large datasets, show fewer labels to prevent overcrowding
    // The larger the dataset, the more labels we skip
    let labelInterval = 0; // 0 means show all labels (default)

    if (dataLength > 24) {
      // For larger datasets, calculate a reasonable interval
      labelInterval = Math.max(1, Math.floor(dataLength / 12));
    }

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">
          Time Distribution {hasMultipleDays ? "(Multiple Days)" : ""}
          {isGroupedByHour ? "(Hourly)" : ""}
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={aggregations.timeDistribution}
              margin={{
                top: 5,
                right: 30,
                left: hasMultipleDays ? 40 : 20,
                bottom: hasMultipleDays ? 100 : 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                angle={hasMultipleDays ? -45 : 0}
                textAnchor={hasMultipleDays ? "end" : "middle"}
                height={hasMultipleDays ? 80 : 30}
                interval={labelInterval}
                tick={{ fontSize: hasMultipleDays ? 11 : 12 }}
              />
              <YAxis
                width={45}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
                }
              />
              <Tooltip
                formatter={(value) => [`${value} logs`]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              <Bar dataKey="count" name="Logs" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderHttpData = () => {
    if (!aggregations?.statusDistribution) {
      return <div className="text-center p-8">No HTTP data available</div>;
    }

    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Status Code Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregations.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) =>
                    `${status || "Unknown"}: ${count}`
                  }
                >
                  {aggregations.statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} requests`,
                    `Status ${props?.payload?.status || "Unknown"}`,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {aggregations?.statusCategoryDistribution && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Status Code Categories</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={aggregations.statusCategoryDistribution}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} requests`]} />
                  <Bar dataKey="count" name="Requests" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aggregations?.pathDistribution && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Top Requested Paths</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={aggregations.pathDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="path"
                    width={250}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => [`${value} requests`]} />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderServerData = () => {
    if (!hasServerData) {
      return (
        <div className="text-center p-8">
          No server data available. This view requires server IPs or response
          times.
        </div>
      );
    }

    // Filter out localhost IPs if the filter is enabled
    const getFilteredClientIps = () => {
      if (!aggregations?.clientIpDistribution) return [];

      const localIPs = ["127.0.0.1", "localhost", "::1", "0.0.0.0"];

      return filterLocalIPs
        ? aggregations.clientIpDistribution.filter(
            (item) =>
              !localIPs.includes(item.ip) && !item.ip.startsWith("127.0.0")
          )
        : aggregations.clientIpDistribution;
    };

    const filteredClientIps = getFilteredClientIps().slice(0, 10);

    return (
      <div className="space-y-6">
        {aggregations?.avgResponseTime !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow">
            <div className="text-center p-3 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-500">
                Average Response Time
              </h4>
              <p className="text-2xl font-bold text-blue-600">
                {aggregations.avgResponseTime.toFixed(3)}s
              </p>
            </div>

            <div className="text-center p-3 bg-green-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-500">
                Min Response Time
              </h4>
              <p className="text-2xl font-bold text-green-600">
                {aggregations.minResponseTime.toFixed(3)}s
              </p>
            </div>

            <div className="text-center p-3 bg-amber-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-500">
                Max Response Time
              </h4>
              <p className="text-2xl font-bold text-amber-600">
                {aggregations.maxResponseTime.toFixed(3)}s
              </p>
            </div>
          </div>
        )}

        {aggregations?.responseTimeDistribution && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">
              Response Time Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={aggregations.responseTimeDistribution}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} requests`,
                      `Response time: ${name}`,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Response Time" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aggregations?.serverDistribution && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Server Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aggregations.serverDistribution}
                    dataKey="count"
                    nameKey="server"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ server, count }) =>
                      `${server || "Unknown"}: ${count}`
                    }
                  >
                    {aggregations.serverDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} requests`,
                      props?.payload?.server || "Unknown",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aggregations?.clientIpDistribution && (
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Top Client IPs</h3>
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer mr-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={filterLocalIPs}
                    onChange={(e) => setFilterLocalIPs(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2">Filter Localhost</span>
                </label>
                <div className="relative group">
                  <span className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    ⓘ
                  </span>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 w-48">
                    Filters out localhost (127.0.0.1) and other local addresses
                    from the chart
                  </div>
                </div>
              </div>
            </div>

            {filteredClientIps.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredClientIps}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="ip"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => [`${value} requests`]} />
                    <Bar dataKey="count" fill="#8884D8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                <p>
                  {filterLocalIPs
                    ? "No non-localhost IPs found. Try disabling the filter."
                    : "No client IP data available"}
                </p>
              </div>
            )}

            {filterLocalIPs &&
              aggregations.clientIpDistribution.length >
                filteredClientIps.length && (
                <p className="mt-2 text-xs text-gray-500 text-right">
                  Filtered out{" "}
                  {aggregations.clientIpDistribution.length -
                    filteredClientIps.length}{" "}
                  localhost/loopback IPs
                </p>
              )}
          </div>
        )}
      </div>
    );
  };

  const renderLogLevels = () => {
    if (!hasLogLevelData) {
      return <div className="text-center p-8">No log level data available</div>;
    }

    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Log Level Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aggregations.levelDistribution}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} logs`]} />
                <Legend />
                <Bar dataKey="count" name="Count" fill="#8884D8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional log level analysis could be added here */}
      </div>
    );
  };

  const renderAnomalies = () => {
    if (!aggregations?.anomalies || aggregations.anomalies.length === 0) {
      return (
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">No Anomalies Detected</h3>
            <p className="text-gray-500 max-w-md">
              No anomalies were found in the analyzed logs. This could mean your
              system is functioning normally, or you might need to adjust the
              detection thresholds for your specific log patterns.
            </p>
          </div>
        </div>
      );
    }

    // Group anomalies by type for display
    const anomaliesByType = {};
    aggregations.anomalies.forEach((anomaly) => {
      anomaly.anomalies.forEach((a) => {
        if (!anomaliesByType[a.type]) anomaliesByType[a.type] = [];
        anomaliesByType[a.type].push({
          ...anomaly,
          anomalyDetails: a,
        });
      });
    });

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-2 flex items-center">
            <span className="mr-2">Detected Anomalies</span>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {aggregations.anomalies.length} Total
            </span>
          </h3>
          <p className="text-gray-500 mb-6">
            These log entries were flagged as potential anomalies based on
            various statistical and pattern analysis techniques.
          </p>

          <div className="space-y-6">
            {Object.entries(anomaliesByType).map(([type, items], index) => (
              <div key={index} className="border-t pt-4">
                <h4 className="font-medium text-lg mb-2">
                  {ANOMALY_LABELS[type] || type}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({items.length} instances)
                  </span>
                </h4>

                <div className="space-y-3 mt-3">
                  {items.slice(0, 10).map((item, itemIndex) => (
                    <div key={itemIndex} className="bg-gray-50 p-3 rounded-md">
                      <div
                        className={`${
                          SEVERITY_COLORS[item.anomalyDetails.severity] ||
                          "text-gray-500"
                        } font-medium`}
                      >
                        {item.anomalyDetails.severity || "unknown"}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-gray-800">
                          {item.anomalyDetails.message}
                        </p>

                        <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
                          {item.timestamp && (
                            <div>
                              <span className="font-medium">Time:</span>{" "}
                              {item.timestamp}
                            </div>
                          )}
                          {item.lineNumber && (
                            <div>
                              <span className="font-medium">Line:</span>{" "}
                              {item.lineNumber}
                            </div>
                          )}
                          {item.details.method && (
                            <div>
                              <span className="font-medium">Method:</span>{" "}
                              {item.details.method}
                            </div>
                          )}
                          {item.details.path && (
                            <div>
                              <span className="font-medium">Path:</span>{" "}
                              {item.details.path}
                            </div>
                          )}
                          {item.details.statusCode && (
                            <div>
                              <span className="font-medium">Status:</span>{" "}
                              {item.details.statusCode}
                            </div>
                          )}
                          {item.details.responseTime && (
                            <div>
                              <span className="font-medium">
                                Response Time:
                              </span>{" "}
                              {item.details.responseTime.toFixed(3)}s
                            </div>
                          )}
                        </div>

                        {item.details.message && (
                          <div className="mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2">
                            {item.details.message.length > 150
                              ? `${item.details.message.substring(0, 150)}...`
                              : item.details.message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {items.length > 10 && (
                    <div className="text-center mt-2">
                      <span className="text-gray-500 text-sm">
                        Showing 10 of {items.length} anomalies of this type
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {hasResponseTimeData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">
              Response Time Distribution with Anomalies
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={aggregations.responseTimeDistribution}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} requests`,
                      `Response time: ${name}`,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Response Time" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "overview"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>

        {hasTimeData && (
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "time"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("time")}
          >
            Time Analysis
          </button>
        )}

        {hasHttpData && (
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "http"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("http")}
          >
            HTTP Analysis
          </button>
        )}

        {hasServerData && (
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "server"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("server")}
          >
            Server Analysis
          </button>
        )}

        {hasLogLevelData && (
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "levels"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("levels")}
          >
            Log Levels
          </button>
        )}

        {fullAnalysis && hasAnomalyData && (
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "anomalies"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("anomalies")}
          >
            Anomalies
            {aggregations?.anomalies?.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                {aggregations.anomalies.length}
              </span>
            )}
          </button>
        )}
      </div>

      {isSample && !fullAnalysis && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-700 text-sm">
          <p className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Large Log File:</strong> Analysis performed on a
              representative sample of {sampleSize?.toLocaleString() || 0} lines
              from a total of {fullSize?.toLocaleString() || 0} lines. Results
              have been statistically extrapolated to provide insights into the
              full dataset.
            </span>
          </p>
        </div>
      )}

      {fullAnalysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-700 text-sm">
          <p className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Full Analysis Mode:</strong> All{" "}
              {totalLogs.toLocaleString()} logs were processed without sampling.
              Anomaly detection has identified potential issues in your logs.
            </span>
          </p>
        </div>
      )}

      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "time" && renderTimeDistribution()}
        {activeTab === "http" && renderHttpData()}
        {activeTab === "server" && renderServerData()}
        {activeTab === "levels" && renderLogLevels()}
        {activeTab === "anomalies" && renderAnomalies()}
      </div>
    </div>
  );
}
