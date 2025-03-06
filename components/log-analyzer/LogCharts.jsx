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

export default function LogCharts({ logAnalysis }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!logAnalysis || !logAnalysis.totalLogs) {
    return <div className="text-center p-8">No log data to display</div>;
  }

  const { aggregations, totalLogs, format } = logAnalysis;

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Log Summary</h3>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Total Logs:</span> {totalLogs}
          </p>
          <p>
            <span className="font-medium">Detected Format:</span> {format}
          </p>
        </div>
      </div>

      {aggregations.levelDistribution && (
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
                  label={({ level, count }) => `${level}: ${count}`}
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
                    props.payload.level,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {aggregations.patternDistribution && (
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
    if (!aggregations.timeDistribution) {
      return <div className="text-center p-8">No time data available</div>;
    }

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Time Distribution</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={aggregations.timeDistribution}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} logs`]} />
              <Legend />
              <Bar dataKey="count" name="Logs" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderHttpData = () => {
    if (!aggregations.statusDistribution) {
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
                  label={({ status, count }) => `${status}: ${count}`}
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
                    `Status ${props.payload.status}`,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {aggregations.pathDistribution && (
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

        {aggregations.timeDistribution && (
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

        {aggregations.statusDistribution && (
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
      </div>

      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "time" && renderTimeDistribution()}
        {activeTab === "http" && renderHttpData()}
      </div>
    </div>
  );
}
