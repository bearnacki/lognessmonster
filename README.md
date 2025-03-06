# LogNessMonster - Log Analysis Tool

LogNessMonster is a powerful Next.js application designed to analyze and visualize log data. It allows users to paste various types of logs, automatically detects the format, and generates insightful visualizations to help identify patterns, issues, and trends.

## Features

- **Multi-format Log Support**: Automatically detects and parses different log formats:
  - JSON logs
  - Apache/NGINX access logs
  - Timestamped logs
  - Generic text logs
- **Interactive Visualizations**:
  - Time-based distribution of logs
  - Log level distribution
  - HTTP status code analysis
  - Common message patterns
  - Top requested paths (for web server logs)
- **Real-time Analysis**: Process logs client-side for immediate results
- **Modern UI**: Clean, responsive design built with Next.js and Tailwind CSS

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Recharts](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
