# LogNessMonster - Log Analysis Tool

LogNessMonster is a powerful Next.js application designed to analyze and visualize log data. It allows users to paste various types of logs, automatically detects patterns, and generates insightful visualizations to help identify issues and trends.

## Features

- **Universal Log Parsing**: 
  - Automatically extracts meaningful data from any log format
  - No need for custom parsers or format-specific code
  - Pattern-based approach finds timestamps, HTTP methods, status codes, IPs, etc.
  - Works with logs from any system or application
- **Intelligent Format Detection**:
  - Automatically identifies log types: HTTP, server, application, timestamped, etc.
  - Shows appropriate visualization tabs based on detected patterns
  - No configuration needed for common log formats
- **Interactive Visualizations**:
  - Time-based distribution of logs
  - Status code and HTTP method breakdowns
  - Response time analysis
  - Log level distribution
  - Server and client analysis
  - Common message patterns
- **Real-time Analysis**: Process logs client-side for immediate results
- **Modern UI**: Clean, responsive design built with Next.js and Tailwind CSS
- **Unlimited Log Size Handling**: 
  - No size limits - process logs of any size
  - Advanced memory-efficient algorithms for extremely large logs
  - Intelligent sampling with statistical extrapolation
  - Adaptive chunked processing to prevent UI freezing
  - Progress indicators and time estimates for long-running operations

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lognessmonster.git
   cd lognessmonster
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Paste your logs into the text area
2. Click "Analyze Logs"
3. Explore the generated charts and statistics
4. Switch between tabs to view different aspects of the analysis

### Handling Large Log Files

LogNessMonster is engineered to handle log files of any size:

- **No Size Limits**: Unlike other tools, there's no upper limit on the size of logs you can analyze
- **Memory Efficiency**: Special algorithms ensure browser memory isn't exhausted even with gigabyte-sized logs
- **Progressive Loading**: Files are processed in chunks to maintain browser responsiveness
- **Smart Sampling**: For extremely large logs (>100MB), the application uses intelligent sampling from different sections of the log
- **Statistical Extrapolation**: Results are accurately projected to represent the entire dataset
- **Performance Indicators**: Detailed progress bars and time estimates keep you informed during processing
- **Optimized Parsing**: Different parsing strategies are automatically employed based on log size and format

## Supported Log Patterns

LogNessMonster can automatically extract and analyze the following patterns from your logs:

### Timestamps
- ISO format: `2023-04-17T12:34:56.789Z`
- Common date format: `[26/Feb/2025:08:48:45 +0100]`
- Standard timestamp: `2023-04-17 12:34:56`
- US format: `04/17/2023 12:34:56`
- Time only: `12:34:56`

### HTTP Information
- Methods: GET, POST, PUT, DELETE, PATCH, etc.
- Status codes: 200, 404, 500, etc.
- URLs and paths: `/api/users`, `https://example.com/path`
- Response times: `0.302s`, `45ms`

### Log Levels
- Standard levels: ERROR, WARN, INFO, DEBUG, TRACE, etc.
- In various formats: `[ERROR]`, `ERROR`, etc.

### Network Information
- IP addresses: Client and server
- Request IDs
- User IDs

## Supported Log Formats

### JSON Logs
```json
{"timestamp":"2023-10-15T12:34:56Z","level":"ERROR","message":"Connection refused","service":"api"}
```

### Apache/NGINX Access Logs
```
127.0.0.1 - - [10/Oct/2023:13:55:36 -0700] "GET /api/users HTTP/1.0" 200 2326
```

### Timestamped Logs
```
2023-10-15 12:34:56 ERROR Connection refused
```

## Technologies Used

- Next.js
- React
- Recharts (for data visualization)
- Tailwind CSS
- React Hook Form
- Lodash

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Recharts](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
