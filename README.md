# HCRIS Hospital Cost Reports Manager

A professional web application that automates CMS HCRIS (Hospital Cost Report Information System) data ingestion, provider name standardization, and instant search capabilities. Built for legal professionals, paralegals, and healthcare analysts who need quick access to historical hospital cost report data.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)

## 🌟 Features

- **One-Click Data Rebuild** - Automatically crawl, download, parse, and deduplicate all CMS HCRIS data from 1995 to present
- **Smart Update Detection** - Check for new data releases and rebuild only when necessary
- **Provider Name Standardization** - Resolve inconsistent provider names across years using CMS Decision Listing
- **Real-Time Progress Dashboard** - Live visual feedback with progress bars, status indicators, and detailed logging
- **Instant Provider Search** - Search by 6-digit provider number and view complete historical records
- **Multiple Export Formats** - Export data in CSV format by provider or year range
- **Comprehensive Statistics** - Year-by-year breakdown of records, providers, mapping success, and data quality
- **Year Range Filtering** - Optional year range filter for testing and targeted data downloads
- **Deduplication Control** - Optional skip deduplication for debugging file format issues

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [Data Structure](#-data-structure)
- [Architecture](#-architecture)
- [Development](#-development)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for downloading CMS data

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hcris-manager.git
   cd hcris-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   Navigate to http://localhost:5173
   ```

### First Run

1. Click the "Check for New Data & Rebuild Master" button
2. Wait for the processing to complete (typically 5-15 minutes for full dataset)
3. Once complete, use the Provider Search or other tabs to explore the data

## 📖 Usage Guide

### Rebuilding the Master Dataset

The rebuild process downloads and processes all available HCRIS data:

1. **Full Rebuild** - Click the main rebuild button to process all years (1995-present)
2. **Year Range Rebuild** - For testing, specify start and/or end years to limit the download
3. **Skip Deduplication** - Check this option to preserve all records including duplicates (useful for debugging)

The rebuild process includes six phases:
- Check for Updates
- Download Provider Mapping
- Crawl Year List
- Download & Process Data
- Deduplicate Records
- Generate Master Files

### Searching for Providers

1. Navigate to the "Provider Search" tab
2. Enter a 6-digit provider number (e.g., `010001`)
3. Click "Search" to view all historical records
4. Click "Export to CSV" to download the results

### Viewing Year Samples

1. Navigate to the "Year Sample" tab
2. Select a year from the dropdown
3. Click "View Sample" to see the first 10 records from that year
4. Use this to verify data quality and structure

### Exporting Year Ranges

1. Navigate to the "Export Range" tab
2. Select start and end years
3. Click "Export Range to CSV"
4. The system will filter and export all records within that range

### Reviewing Statistics

1. Navigate to the "Statistics" tab
2. View comprehensive statistics by year:
   - Total records
   - Unique providers
   - Mapping success rate
   - Latest NPR date
   - Source files
3. Click "Export Statistics to CSV" to download the table

## 📊 Data Structure

### CSV Column Mapping

The application parses CMS HCRIS CSV files using the following column indices:

| Column Index | Field Name | Description |
|--------------|------------|-------------|
| 1 | Provider Name | Original hospital/facility name |
| 2 | **Provider Number** | 6-digit CMS Certification Number (CCN) |
| 6 | Fiscal Year End | End date of the reporting period |
| 15 | NPR Date | Notice of Program Reimbursement date |

**Note:** Column indices are 0-based in code but 1-based in this documentation for clarity.

### HCRISRecord Interface

```typescript
interface HCRISRecord {
  providerNumber: string;      // 6-digit CCN
  providerName: string;         // Standardized name (if mapped)
  fiscalYearEnd: string;        // YYYY-MM-DD format
  nprDate: string;              // YYYY-MM-DD format
  reportYear: number;           // Fiscal year
  sourceFile: string;           // Original ZIP filename
}
```

### Provider Mapping

Provider names are standardized using the CMS Decision Listing 2010 PDF, which provides canonical provider names for each CCN. Unmapped providers retain their original name from the CSV.

## 🏗 Architecture

### Technology Stack

- **Frontend**: React 19 + TypeScript 5.7
- **UI Components**: shadcn/ui v4 (Radix UI primitives)
- **Styling**: Tailwind CSS 4
- **Data Parsing**: PapaParse (CSV), JSZip (ZIP extraction)
- **State Management**: React hooks + `useKV` (persistent storage)
- **Icons**: Phosphor Icons
- **Notifications**: Sonner (toast notifications)

### Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── LogViewer.tsx          # Processing log display
│   ├── ProgressDashboard.tsx  # Real-time progress tracking
│   ├── ProviderSearch.tsx     # Provider search interface
│   ├── StatisticsTable.tsx    # Year statistics table
│   ├── YearRangeExport.tsx    # Year range export tool
│   └── YearSampleViewer.tsx   # Year sample viewer
├── lib/
│   ├── hcris-processor.ts     # Core data processing logic
│   ├── types.ts               # TypeScript interfaces
│   └── utils.ts               # Utility functions
├── App.tsx                    # Main application component
├── index.css                  # Global styles and theme
└── main.tsx                   # Application entry point
```

### Data Flow

1. **Download** - Fetch ZIP files from CMS servers
2. **Extract** - Unzip and locate `*_RPT.CSV` files
3. **Parse** - Parse CSV rows using PapaParse
4. **Map** - Apply provider name mapping from Decision Listing
5. **Deduplicate** - Remove duplicates (keeping most recent NPR date)
6. **Store** - Save to persistent browser storage using `useKV`
7. **Query** - Search and filter from in-memory dataset

## 💻 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Key Files to Know

- **`src/lib/hcris-processor.ts`** - Core data processing logic, download, parse, and deduplication
- **`src/App.tsx`** - Main application logic, state management, and UI orchestration
- **`src/lib/types.ts`** - TypeScript type definitions for data structures
- **`src/components/`** - Reusable UI components

### Adding New Features

1. **New Data Fields** - Update `HCRISRecord` interface in `types.ts` and parsing logic in `hcris-processor.ts`
2. **New Export Formats** - Add export methods to `HCRISProcessor` class
3. **New Search Filters** - Add filter methods to `HCRISProcessor` and UI in respective components
4. **New Statistics** - Update `calculateStatistics()` method in `hcris-processor.ts`

### Testing Year Range Filters

Use the year range filter controls in the Data Management card:

```typescript
// Example: Test with years 2020-2023
Start Year: 2020
End Year: 2023
```

This limits the download to only those years, significantly reducing processing time for testing.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Include detailed description of the problem
3. Provide steps to reproduce
4. Include browser version and error messages
5. Screenshots are helpful for UI issues

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/hcris-manager.git
   cd hcris-manager
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
   - Test thoroughly with year range filters

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- Use TypeScript for all new code
- Follow existing component patterns
- Use shadcn/ui components when possible
- Maintain accessibility standards (WCAG AA)
- Add descriptive comments for complex logic
- Use functional components with hooks
- Keep components focused and single-purpose

### Commit Message Convention

We use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## 🔧 Troubleshooting

### Common Issues

**Problem: "All download URLs returned 404"**
- **Cause**: CMS has not published data for that year yet
- **Solution**: This is expected for future years or very recent years. The system will log this and continue processing other years.

**Problem: Rebuild takes too long**
- **Solution**: Use the year range filter to process fewer years. For testing, try a 2-3 year range.

**Problem: Browser runs out of memory**
- **Cause**: Processing too many years at once
- **Solution**: Use year range filter to process in smaller batches, or increase browser memory limits

**Problem: Provider names not standardized**
- **Cause**: Provider mapping not downloaded or provider not in Decision Listing
- **Solution**: Check the Statistics tab for unmapped provider counts. Some providers may not be in the mapping database.

**Problem: Duplicate records after rebuild**
- **Cause**: Deduplication was skipped
- **Solution**: Uncheck "Skip deduplication step" and rebuild

### Debug Mode

To debug CSV parsing issues:

1. Check "Skip deduplication step"
2. Set a narrow year range (e.g., 2023-2023)
3. Check the Processing Log for parsing errors
4. Use the Year Sample Viewer to inspect raw records

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/hcris-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/hcris-manager/discussions)
- **Documentation**: See `PRD.md` for detailed feature specifications

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## 🙏 Acknowledgments

- CMS for providing publicly available HCRIS data
- shadcn/ui for the excellent component library
- All contributors who help improve this tool

## 📚 Additional Resources

- [CMS Cost Reports Documentation](https://www.cms.gov/data-research/statistics-trends-and-reports/cost-reports)
- [HCRIS Data Dictionary](https://www.cms.gov/data-research/statistics-trends-and-reports/cost-reports)
- [Provider Number (CCN) Format](https://www.cms.gov/Medicare/Provider-Enrollment-and-Certification/SurveyCertificationGenInfo/National-Provider-Identifier-Standard)

---

**Built with ❤️ for legal professionals and healthcare analysts**
