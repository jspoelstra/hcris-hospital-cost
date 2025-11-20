# CMS HCRIS URL Pattern - Final Clarification

## Summary

This document clarifies the correct CMS HCRIS download URL pattern based on user confirmation.

## The Correct Pattern

### Base URL
```
https://downloads.cms.gov/Files/hcris/
```

### Year-Based Rules

#### Years 1995-2009: HOSPFY Format Only
- **Pattern**: `HOSPFYXXXX.zip` where XXXX = year
- **Example**: `HOSPFY2009.zip` (for year 2009)

#### Years 2010-2011: BOTH Formats (Transition Period)
These are the **only two years** with both formats available:
- **Primary**: `HOSP10FYXXXX.zip` where XXXX = year
- **Fallback**: `HOSPFYXXXX.zip` where XXXX = year
- **Example for 2010**:
  - `HOSP10FY2010.zip` ✓
  - `HOSPFY2010.zip` ✓ (fallback)

#### Years 2012+: HOSP10FY Format Only
- **Pattern**: `HOSP10FYXXXX.zip` where XXXX = year
- **Example**: `HOSP10FY2023.zip` (for year 2023)

## Key Clarification

### The FY Year Always Matches the Data Year

**Previous Confusion**: There was uncertainty about whether the FYXXXX portion might refer to a different year than the data contained in the file.

**Clarification**: The FY year **always** matches the data year:
- `HOSPFY2010.zip` contains data for year **2010** (not 2009, 2011, or any other year)
- `HOSP10FY2023.zip` contains data for year **2023** (not 2022, 2024, or any other year)

This is consistent across all years.

## Transition Years (2010 & 2011)

### Why Both Formats?

In 2010, CMS introduced a new data format (HOSP 2010 format). During the transition:
- **2010 and 2011 data** were published in **both formats**
  - Old format: `HOSPFY{year}.zip`
  - New format: `HOSP10FY{year}.zip`
- **Before 2010** (1995-2009): Only old format exists
- **After 2011** (2012+): Only new format exists

### Download Strategy

For years 2010 and 2011, the app tries both URLs:
1. Try `HOSP10FY{year}.zip` first (preferred, newer format)
2. If 404, try `HOSPFY{year}.zip` (fallback, legacy format)
3. If both 404, report error

This ensures maximum compatibility regardless of which format CMS serves.

## Implementation

The code in `src/lib/hcris-processor.ts` already implements this correctly:

```typescript
private getZipUrlsForYear(year: number): Array<{ url: string; filename: string }> {
  const baseUrl = 'https://downloads.cms.gov/Files/hcris/';
  const urls: Array<{ url: string; filename: string }> = [];
  
  if (year <= 2009) {
    // Years 1995-2009: HOSPFY format only
    urls.push({
      url: `${baseUrl}HOSPFY${year}.zip`,
      filename: `HOSPFY${year}`,
    });
  } else if (year === 2010 || year === 2011) {
    // Years 2010-2011: BOTH formats available (transition period)
    urls.push(
      {
        url: `${baseUrl}HOSP10FY${year}.zip`,
        filename: `HOSP10FY${year}`,
      },
      {
        url: `${baseUrl}HOSPFY${year}.zip`,
        filename: `HOSPFY${year}`,
      }
    );
  } else {
    // Years 2012+: HOSP10FY format only
    urls.push({
      url: `${baseUrl}HOSP10FY${year}.zip`,
      filename: `HOSP10FY${year}`,
    });
  }
  
  return urls;
}
```

## Examples

### Year 2009 (Pre-Transition)
```
URL: https://downloads.cms.gov/Files/hcris/HOSPFY2009.zip
Contains: 2009 data
```

### Year 2010 (Transition)
```
Primary URL: https://downloads.cms.gov/Files/hcris/HOSP10FY2010.zip
Fallback URL: https://downloads.cms.gov/Files/hcris/HOSPFY2010.zip
Contains: 2010 data (both files)
```

### Year 2011 (Transition)
```
Primary URL: https://downloads.cms.gov/Files/hcris/HOSP10FY2011.zip
Fallback URL: https://downloads.cms.gov/Files/hcris/HOSPFY2011.zip
Contains: 2011 data (both files)
```

### Year 2012 (Post-Transition)
```
URL: https://downloads.cms.gov/Files/hcris/HOSP10FY2012.zip
Contains: 2012 data
```

### Year 2023 (Recent)
```
URL: https://downloads.cms.gov/Files/hcris/HOSP10FY2023.zip
Contains: 2023 data
```

## What This Means for Users

1. **No action required**: The code already implements the correct pattern
2. **Expected behavior**:
   - Years 1995-2009: Single URL attempt, straightforward
   - Years 2010-2011: Two URL attempts, fallback if first fails
   - Years 2012+: Single URL attempt, straightforward
3. **404 errors**: 
   - Expected for future years (data not published)
   - Not expected for years 2010-2023 (if these fail, it's a real problem)

## Testing Verification

To verify the pattern is working correctly:

### Test 1: Pre-Transition (2009)
```
Year Range: 2009 - 2009
Expected URL: HOSPFY2009.zip
Expected Result: Success with ~150K records
```

### Test 2: Transition Year (2010)
```
Year Range: 2010 - 2010
Expected URLs: HOSP10FY2010.zip, then HOSPFY2010.zip if needed
Expected Result: Success with ~165K records
```

### Test 3: Post-Transition (2023)
```
Year Range: 2023 - 2023
Expected URL: HOSP10FY2023.zip
Expected Result: Success with ~185K records
```

All three tests should succeed if the pattern is correct.

## Related Documentation

- `CMS_URL_PATTERN.md` - Complete URL pattern reference
- `404_ERROR_RESOLUTION.md` - Troubleshooting 404 errors
- `WHAT_404_MEANS.md` - User-friendly 404 explanation

## Conclusion

The URL pattern implemented in the code is **correct**:
- ✅ FY year always matches data year
- ✅ Only 2010 and 2011 have both formats
- ✅ Before 2010: HOSPFY format only
- ✅ After 2011: HOSP10FY format only
- ✅ Transition years (2010-2011): Both formats with fallback logic

No code changes are needed. This clarification simply confirms the existing implementation is accurate.
