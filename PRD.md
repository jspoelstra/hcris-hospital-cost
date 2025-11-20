# HCRIS Hospital Cost Reports - One-Click Data Management App

A professional web application that replaces 2-3 hours of daily manual data processing with a one-click solution for CMS HCRIS hospital cost reports ingestion, provider name standardization, and instant search.

**Experience Qualities**:
1. **Efficient** - Transforms a multi-hour manual workflow into a single click with clear, real-time progress feedback
2. **Trustworthy** - Provides detailed logging, validation, and statistics so legal professionals can confidently rely on the data
3. **Accessible** - Non-technical users (paralegals, attorneys) can operate the entire system without IT support

**Complexity Level**: Light Application (multiple features with basic state)
- Single-purpose data ingestion tool with real-time processing feedback, search interface, and export capabilities for legal professionals

## Essential Features

### 1. One-Click Data Rebuild
- **Functionality**: Single button initiates full CMS HCRIS data crawl, download, parse, and rebuild with optional year range filtering
- **Purpose**: Eliminate 2-3 hour manual process; ensure data freshness; allow targeted testing with year filters
- **Trigger**: User clicks "Check for New Data & Rebuild Master" with optional start/end year specified
- **Progression**: (Optional: Set year range filter) → Click button → Detect update need (NPR > July 3, 2025) → Crawl CMS pages (filtered by year range if specified) → Download hospital ZIPs for selected years → Extract _rpt.csv files → Parse columns (col 1: Provider Number, col 7: Fiscal Year End, col 16: NPR Date) → Apply provider name mapping → Deduplicate → Generate master files → Show completion
- **Success criteria**: Process completes in < 10 minutes with downloadable parquet/Excel outputs; year filter correctly limits data download scope

### 2. Real-Time Progress Dashboard
- **Functionality**: Live visual feedback for every processing phase with progress bars, status indicators, and timing
- **Purpose**: Users need transparency into long-running processes to build trust and identify issues
- **Trigger**: Automatically displays when rebuild starts
- **Progression**: Show phase (scraping/downloading/parsing) → Update progress bars → Display per-year status → Show elapsed time → Highlight errors/warnings → Display completion statistics
- **Success criteria**: Every step visible with < 1 second update latency; clear error messages on failure

### 3. Provider Name Standardization
- **Functionality**: Parse CMS Decision Listing 2010 PDF once to create canonical name mapping; apply to all provider records
- **Purpose**: Resolve inconsistent provider names across years ("Mayo Clinic" vs "Saint Marys Hospital")
- **Trigger**: Runs automatically during data rebuild; manual refresh button available
- **Progression**: Download PDF → Extract provider number/name pairs → Normalize to 6-digit format → Store mapping → Apply to every record → Flag unmapped providers
- **Success criteria**: 85%+ mapping success rate; unmapped providers logged for review

### 4. Intelligent Update Detection
- **Functionality**: Check if any NPR date in newly downloaded data exceeds July 3, 2025
- **Purpose**: Avoid unnecessary full rebuilds when data hasn't changed
- **Trigger**: First step after clicking rebuild button
- **Progression**: Sample latest data → Check NPR dates → If newer data found → Full rebuild; else → Show "Up to date" message
- **Success criteria**: Correct detection in 100% of cases; clear messaging to user

### 5. Provider Search Interface
- **Functionality**: Instant search by 6-digit provider number with historical record display
- **Purpose**: Enable attorneys to quickly find all cost reports for a specific hospital
- **Trigger**: User enters provider number in search box
- **Progression**: Type 6-digit number → Filter master dataset → Display all rows (newest first) → Highlight canonical name → Click export button → Download Excel
- **Success criteria**: Search results appear in < 500ms; export generates valid Excel file

### 6. Post-Processing Statistics
- **Functionality**: Comprehensive table showing records, providers, mapping success, and NPR dates by year
- **Purpose**: Validation and quality assurance for legal team
- **Trigger**: Automatically displays after rebuild completes
- **Progression**: Rebuild finishes → Aggregate statistics by year → Display table with record counts, unique providers, mapping stats, latest NPR dates
- **Success criteria**: All years from 1995-present shown; accurate counts; exportable to CSV

### 7. Master File Generation
- **Functionality**: Output deduplicated master dataset in multiple formats (Parquet, Excel, CSV)
- **Purpose**: Provide both fast loading for app and user-friendly files for attorneys
- **Trigger**: Final step of rebuild process
- **Progression**: Complete deduplication → Generate Parquet (fast) → Generate Excel (readable) → Generate CSV (legacy) → Provide download links
- **Success criteria**: All formats contain identical data; Excel < 100MB for reasonable download time

## Edge Case Handling

- **Download Failures**: Retry 3 times with exponential backoff; log failed years; continue processing others
- **Malformed CSV**: Skip invalid rows; log parsing errors; display warning count in statistics; verify column positions (1, 7, 16)
- **Missing Provider Mapping**: Retain original name from column 2; flag as unmapped; log CCN for review
- **Large Files**: Use streaming/chunked processing to avoid browser memory limits
- **Network Timeouts**: Show clear error message; allow manual retry without losing progress
- **Duplicate Keys**: Apply deduplication rule (newest NPR date wins); log duplicates removed
- **Year Range Filter**: Validate year inputs (1995-current); handle empty/partial ranges; clear feedback on applied filters

## Design Direction

The design should feel professional, efficient, and trustworthy - like enterprise legal software used by law firms. A clean, data-focused interface with clear hierarchy between action buttons, progress feedback, and tabular results. The experience should communicate reliability and precision through structured layouts, ample whitespace, and unambiguous status indicators.

## Color Selection

Triadic color scheme for clear functional distinction between action types and states.

- **Primary Color**: Deep Navy Blue (oklch(0.32 0.08 260)) - Communicates professionalism, trust, and legal authority; used for primary action button and headers
- **Secondary Colors**: Slate Gray (oklch(0.55 0.02 260)) for secondary actions and muted backgrounds; Steel Blue (oklch(0.65 0.06 260)) for informational elements
- **Accent Color**: Vibrant Teal (oklch(0.68 0.14 200)) - Highlights active processing, progress indicators, and successful completion states
- **Foreground/Background Pairings**:
  - Background (White oklch(0.99 0 0)): Dark Navy Text (oklch(0.25 0.02 260)) - Ratio 12.5:1 ✓
  - Card (Light Gray oklch(0.97 0 0)): Dark Navy Text (oklch(0.25 0.02 260)) - Ratio 11.8:1 ✓
  - Primary (Navy oklch(0.32 0.08 260)): White Text (oklch(0.99 0 0)) - Ratio 8.2:1 ✓
  - Accent (Teal oklch(0.68 0.14 200)): Dark Navy Text (oklch(0.25 0.02 260)) - Ratio 4.6:1 ✓
  - Muted (Slate oklch(0.55 0.02 260)): White Text (oklch(0.99 0 0)) - Ratio 5.1:1 ✓

## Font Selection

The typefaces should convey precision, clarity, and professional authority suitable for legal document handling.

- **Typographic Hierarchy**:
  - H1 (Page Title): Inter Bold/32px/tight letter spacing (-0.02em)
  - H2 (Section Headers): Inter SemiBold/24px/normal spacing
  - H3 (Subsection Headers): Inter SemiBold/18px/normal spacing
  - Body (Instructions, Labels): Inter Regular/15px/1.5 line height
  - Data (Tables, Numbers): JetBrains Mono Regular/14px/1.4 line height (monospace for alignment)
  - Small (Status badges, timestamps): Inter Medium/13px/normal spacing

## Animations

Animations should be purposeful and minimal - reinforcing system status without drawing attention away from data. Smooth, professional transitions that communicate state changes clearly.

- **Purposeful Meaning**: Progress bars animate smoothly to show real work happening; success states use subtle scale and color transitions; error states pulse gently to draw attention without alarm
- **Hierarchy of Movement**: Primary focus on progress indicators and status changes; secondary motion for table sorting/filtering; tertiary for hover states

## Component Selection

- **Components**:
  - Button (primary action: rebuild master, secondary: export/refresh)
  - Card (contain progress dashboard, statistics table, search interface)
  - Progress (real-time percentage bars for downloads and processing)
  - Table (statistics by year, provider search results)
  - Input (provider number search with validation)
  - Badge (status indicators: success/warning/error, processing phase labels)
  - Tabs (switch between Dashboard, Search, Statistics views)
  - Alert (system messages: "up to date", errors, warnings)
  - Separator (visual division between major sections)
  - ScrollArea (handle large result sets in tables)
  
- **Customizations**:
  - Custom progress phase component showing multi-step pipeline
  - Custom data table with sortable columns and export button
  - Custom file download cards with format badges
  - Custom log viewer with color-coded severity levels

- **States**:
  - Buttons: idle (solid primary), hover (slight lift + darken), active (pressed), disabled (muted), loading (spinner + disabled)
  - Progress bars: idle (0%, muted), active (animated gradient), complete (100%, success color), error (red overlay)
  - Table rows: default, hover (light background), selected (accent border)
  - Input: empty (placeholder), typing (border highlight), valid (green check), invalid (red border + message)

- **Icon Selection**:
  - Download (DownloadSimple) for export actions
  - ArrowClockwise for refresh/rebuild
  - MagnifyingGlass for search
  - CheckCircle for success states
  - Warning for warnings
  - XCircle for errors
  - Clock for timestamps/duration
  - Database for data files
  - CaretRight for expand/progress

- **Spacing**:
  - Container padding: 8 (32px)
  - Card padding: 6 (24px)
  - Section gaps: 6 (24px)
  - Element gaps within sections: 4 (16px)
  - Form element gaps: 3 (12px)
  - Table cell padding: 3 (12px)

- **Mobile**:
  - Stack cards vertically instead of grid
  - Collapse table columns to essential fields (provider #, name, NPR date)
  - Full-width buttons
  - Reduce padding to 4 (16px) on small screens
  - Progress dashboard shows only current phase on mobile
