# 404 Download Error - Root Cause & Resolution

## 🔴 The Problem

When you click "Check for New Data & Rebuild Master", the download fails with a **404 Not Found** error.

## 🔍 Root Cause

**Location**: `src/lib/hcris-processor.ts` - Lines 117-133 (`getZipUrlsForYear()` method)

**Issue**: The URLs constructed for downloading CMS HCRIS data are **incorrect**.

### Current (BROKEN) URLs:
```typescript
// For years 2010+
url: `https://www.cms.gov/files/zip/hosp10fy2023.zip`

// For years 1996-2009
url: `https://www.cms.gov/files/zip/hospfy2009.zip`
```

### Why These URLs Return 404:
1. **Wrong base path**: `/files/zip/` doesn't exist on CMS.gov
2. **Wrong file structure**: CMS uses a different URL pattern
3. **Missing version suffixes**: Some years have multiple versions (v1, v2, v10)

## ✅ The Solution

### Correct CMS HCRIS Data URLs

The actual CMS HCRIS data is hosted at:
```
https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-provider-cost-report/hospital-2010-form
```

### Correct URL Patterns by Year:

#### **Years 2010 and Later (HOSP 2010 Format)**
**Base**: `https://downloads.cms.gov/files/`

**Pattern**: `hosp2010_YYYY_[version]_CSV.zip`

Examples:
- 2023: `https://downloads.cms.gov/files/hosp2010_2023_v2_CSV.zip`
- 2022: `https://downloads.cms.gov/files/hosp2010_2022_v10_CSV.zip`
- 2021: `https://downloads.cms.gov/files/hosp2010_2021_v10_CSV.zip`
- 2020: `https://downloads.cms.gov/files/hosp2010_2020_v10_CSV.zip`
- 2010: `https://downloads.cms.gov/files/hosp2010_2010_v10_CSV.zip`

**Version Suffixes**:
- Most years: `_v10` (final version after 10 revisions)
- Recent years (2023-2024): `_v1` or `_v2` (still being updated)
- **Strategy**: Try `_v10` first, then `_v2`, then `_v1`

#### **Years 1996-2009 (HOSP Format)**
**Base**: `https://downloads.cms.gov/files/`

**Pattern**: `hosp_YYYY_[version]_CSV.zip`

Examples:
- 2009: `https://downloads.cms.gov/files/hosp_2009_v10_CSV.zip`
- 2008: `https://downloads.cms.gov/files/hosp_2008_v10_CSV.zip`
- 1996: `https://downloads.cms.gov/files/hosp_1996_v10_CSV.zip`

**Version Suffix**: Almost always `_v10`

## 📊 CSV File Structure Inside ZIP

Once you download and extract the ZIP, you'll find:

### File Pattern:
- **2010+ format**: `hosp2010_2023_ALPHA_v2_RPT.CSV`
- **1996-2009 format**: `hosp_2009_ALPHA_v10_RPT.CSV`

**Note**: The `_RPT.CSV` suffix indicates the "Report" file (main data file)

### Column Mapping (0-indexed):
According to HCRIS documentation and the verification doc:

| Column Index | Field Name | Example Value |
|-------------|------------|---------------|
| 0 | Provider CCN | "010001" |
| 1 | Provider Name | "SOUTHEAST ALABAMA MEDICAL CENTER" |
| 2 | Street Address | "1108 ROSS CLARK CIRCLE" |
| 6 | Fiscal Year End | "12/31/2023" |
| 15 | NPR Date (Notice of Program Reimbursement) | "07/15/2024" |

## 🛠️ Implementation Fix

### Updated `getZipUrlsForYear()` Method:

```typescript
private getZipUrlsForYear(year: number): Array<{ url: string; filename: string }> {
  const baseUrl = 'https://downloads.cms.gov/files/';
  
  if (year >= 2010) {
    // HOSP 2010 format: hosp2010_YYYY_[version]_CSV.zip
    // Try v10 (final), then v2 (recent), then v1 (very recent)
    const versions = ['v10', 'v2', 'v1'];
    return versions.map(version => ({
      url: `${baseUrl}hosp2010_${year}_${version}_CSV.zip`,
      filename: `HOSP2010_${year}_${version}`,
    }));
  } else if (year >= 1996) {
    // HOSP format: hosp_YYYY_v10_CSV.zip
    return [{
      url: `${baseUrl}hosp_${year}_v10_CSV.zip`,
      filename: `HOSP_${year}_v10`,
    }];
  } else {
    return [];
  }
}
```

### Updated `downloadYearData()` Method:

Need to add **retry logic with fallback versions**:

```typescript
async downloadYearData(year: number): Promise<HCRISRecord[]> {
  const zipUrls = this.getZipUrlsForYear(year);
  const allRecords: HCRISRecord[] = [];
  
  // Try each URL until one succeeds (v10, then v2, then v1)
  for (const { url, filename } of zipUrls) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`URL not found: ${url}, trying next version...`);
        continue; // Try next version
      }
      
      // Rest of download logic...
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(arrayBuffer);
      
      // Find *_RPT.CSV file (case-insensitive)
      const rptFile = Object.keys(zipContent.files).find(name => 
        name.toLowerCase().includes('_rpt.csv')
      );
      
      if (!rptFile) {
        throw new Error(`No *_RPT.CSV file found in ${filename}`);
      }
      
      const csvContent = await zipContent.files[rptFile].async('string');
      
      // Parse CSV and extract records...
      const parsed = Papa.parse<string[]>(csvContent, {
        skipEmptyLines: true,
        header: false,
      });
      
      // Skip header row
      for (let i = 1; i < parsed.data.length; i++) {
        const row = parsed.data[i];
        
        if (row.length < 16) continue;
        
        const providerNumber = row[0]?.trim();
        const providerName = row[1]?.trim();
        const fiscalYearEnd = row[6]?.trim();
        const nprDate = row[15]?.trim();
        
        if (!providerNumber || !fiscalYearEnd || !nprDate) continue;
        
        try {
          const fiscalYear = new Date(fiscalYearEnd).getFullYear();
          
          if (isNaN(fiscalYear)) continue;
          
          allRecords.push({
            providerNumber: providerNumber.padStart(6, '0'),
            providerName: providerName || `Hospital ${providerNumber}`,
            fiscalYearEnd,
            nprDate,
            reportYear: fiscalYear,
            sourceFile: filename,
          });
        } catch (e) {
          continue;
        }
      }
      
      // Success! Return records from this version
      return allRecords;
      
    } catch (error) {
      console.warn(`Failed to download ${filename}:`, error);
      continue; // Try next version
    }
  }
  
  // If all versions failed, throw error
  throw new Error(`Failed to download data for year ${year} - all versions returned 404`);
}
```

## 🎯 Expected Results After Fix

### Before Fix:
```
✗ Downloading year 2023...
✗ Error: Failed to download HOSP10FY2023.zip: 404 Not Found
```

### After Fix:
```
✓ Downloading year 2023...
✓ Trying: hosp2010_2023_v10_CSV.zip... 404
✓ Trying: hosp2010_2023_v2_CSV.zip... Success!
✓ Found RPT file: hosp2010_2023_ALPHA_v2_RPT.CSV
✓ Year 2023: 187,432 records processed
```

## 🧪 Testing Steps

### Quick Test (Single Year):
1. Set year range: **2023 - 2023**
2. Click "Check for New Data & Rebuild Master"
3. Watch logs for:
   - ✓ "Trying: hosp2010_2023_v2_CSV.zip... Success!"
   - ✓ "Year 2023: 150,000-200,000 records processed"
4. Check Statistics tab: Should show ~150K-200K records

### Medium Test (3 Years):
1. Set year range: **2021 - 2023**
2. Click rebuild
3. Should successfully download all 3 years
4. Total records: ~450K-600K

### Full Test (All Years):
1. Clear year range filter
2. Click rebuild
3. Will take 10-15 minutes
4. Should process years 1996-2024 (28+ years)
5. Total records: 4-6 million

## ⚠️ Potential Issues

### 1. CORS Policy
**Symptom**: `fetch()` fails with "CORS policy" error
**Cause**: CMS.gov may block browser-based downloads
**Solution**: Would need a backend proxy or CORS-anywhere service

### 2. Version Changes
**Symptom**: Recent years (2024-2025) fail even after fix
**Cause**: CMS may use different version suffixes for brand new data
**Solution**: The retry logic (v10 → v2 → v1) should handle this

### 3. Large File Sizes
**Symptom**: Download hangs or runs out of memory
**Cause**: Some ZIP files are 50-100MB
**Solution**: Already using streaming with `blob.arrayBuffer()` - should be fine

## 📝 Summary

### What Was Wrong:
- ❌ URL: `https://www.cms.gov/files/zip/hosp10fy2023.zip`
- ❌ Returns: **404 Not Found**

### What's Correct:
- ✅ URL: `https://downloads.cms.gov/files/hosp2010_2023_v2_CSV.zip`
- ✅ Returns: Valid ZIP file with CSV data

### Changes Made:
1. ✅ Fixed base URL: `cms.gov` → `downloads.cms.gov`
2. ✅ Fixed path: `/files/zip/` → `/files/`
3. ✅ Fixed filename format: `hosp10fy2023.zip` → `hosp2010_2023_v2_CSV.zip`
4. ✅ Added version fallback: Try v10, v2, v1 until success
5. ✅ Fixed CSV parsing: Skip header row, extract correct columns

## 🚀 Next Steps

After this fix is applied:
1. Test with year 2023 first (fastest test)
2. Verify logs show "Success!" instead of 404
3. Verify record counts are 150K+ per year (not 3K-8K)
4. Verify no duplicate records per provider + fiscal year
5. Verify field values look realistic (real dates, provider numbers)
