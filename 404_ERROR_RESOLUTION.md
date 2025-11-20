# 404 Download Error - Understanding & Resolution

## 🔴 What Does 404 Mean?

A **404 Not Found** error means the CMS server doesn't have a file at the URL being requested.

## 🔍 When Is This Normal?

### Expected 404 Scenarios:

1. **Current/Future Years**: If you try to download data for 2025 or the current year before CMS has published it
2. **Very Old Years**: Years before 1995 (HCRIS data doesn't exist)
3. **Unreleased Data**: Recently ended fiscal years where reports haven't been filed yet

## ✅ Current URL Pattern (CORRECT)

The app uses the correct CMS URL structure:

### Base URL
```
https://downloads.cms.gov/Files/hcris/
```

### Years 1995-2009
**Pattern**: `HOSPFY{year}.zip`

**Examples**:
- 2009: `HOSPFY2009.zip`
- 2000: `HOSPFY2000.zip`
- 1995: `HOSPFY1995.zip`

### Years 2010-2011 (Transition Period)
**Both formats available** - app tries both:
1. `HOSP10FY{year}.zip` (preferred, newer format)
2. `HOSPFY{year}.zip` (fallback, legacy format)

**2010 Example**:
- Try: `HOSP10FY2010.zip` first
- If 404: Try `HOSPFY2010.zip` as fallback

### Years 2012+
**Pattern**: `HOSP10FY{year}.zip`

**Examples**:
- 2023: `HOSP10FY2023.zip`
- 2020: `HOSP10FY2020.zip`
- 2012: `HOSP10FY2012.zip`

## 🎯 How the App Handles 404s

### Smart Retry Logic

The app automatically handles 404s:

```typescript
// For years 2010-2011 only
Try: HOSP10FY2010.zip
  ↓ (if 404)
Try: HOSPFY2010.zip
  ↓ (if still 404)
Error: "All download URLs returned 404 - data may not be available yet"
```

### For Other Years
```typescript
// Years ≤ 2009 or ≥ 2012
Try: HOSPFY2009.zip (or HOSP10FY2023.zip)
  ↓ (if 404)
Error: "Year 2009: All download URLs returned 404 - data may not be available yet"
```

## 🧪 Testing for Real 404s

### Test 1: Known Good Year (2020)
```
Year Range: 2020 - 2020
Expected: ✓ Success with ~180K records
Actual 404: Would indicate URL pattern bug
```

### Test 2: Transition Year (2010)
```
Year Range: 2010 - 2010
Expected: ✓ Success (tries both formats)
Actual 404: Would indicate URL pattern bug
```

### Test 3: Future Year (2026)
```
Year Range: 2026 - 2026
Expected: ✗ 404 error (data doesn't exist yet)
Actual 404: Normal behavior
```

## ⚠️ Real Problems vs Expected 404s

### ❌ Real Problem - All Years Fail
**Symptom**: Years 2010-2023 all return 404
**Cause**: Network issue, CORS policy, or CMS URL structure changed
**Solution**: 
1. Check browser console for CORS errors
2. Verify you can access `https://downloads.cms.gov` directly
3. Check if CMS changed their URL structure

### ✅ Expected Behavior - Future Years Fail
**Symptom**: Year 2025 returns 404, but 2010-2023 work
**Cause**: CMS hasn't published 2025 data yet
**Solution**: This is normal - exclude current/future years from range

### ✅ Expected Behavior - Very Recent Years Fail
**Symptom**: Current year returns 404, previous years work
**Cause**: Fiscal year reports aren't filed immediately
**Solution**: Wait a few months after fiscal year end, or exclude current year

## 📊 Expected Results

### Successful Download Log:
```
✓ Downloading data for year 2023...
✓ Year 2023: 187,432 records processed
```

### Expected 404 Log (Future Year):
```
⚠ Downloading data for year 2025...
✗ Year 2025: All download URLs returned 404 - data may not be available yet
```

### Expected 404 Log (Transition Year with Fallback):
```
✓ Downloading data for year 2010...
⚠ URL not found: HOSP10FY2010.zip (404), trying next version...
✓ Year 2010: 165,283 records processed
```

## 🔧 How URL Pattern Works in Code

Located in: `src/lib/hcris-processor.ts`

```typescript
private getZipUrlsForYear(year: number): Array<{ url: string; filename: string }> {
  const baseUrl = 'https://downloads.cms.gov/Files/hcris/';
  
  if (year <= 2009) {
    // Simple: HOSPFY{year}.zip
    return [{ url: `${baseUrl}HOSPFY${year}.zip`, filename: `HOSPFY${year}` }];
  } 
  else if (year === 2010 || year === 2011) {
    // Both formats: try HOSP10 first, then HOSP as fallback
    return [
      { url: `${baseUrl}HOSP10FY${year}.zip`, filename: `HOSP10FY${year}` },
      { url: `${baseUrl}HOSPFY${year}.zip`, filename: `HOSPFY${year}` }
    ];
  } 
  else {
    // 2012+: HOSP10FY{year}.zip only
    return [{ url: `${baseUrl}HOSP10FY${year}.zip`, filename: `HOSP10FY${year}` }];
  }
}
```

## 📝 Key Facts About HCRIS URLs

1. **FY Year = Data Year**: `HOSPFY2010` contains 2010 data (not 2011, 2009, etc.)
2. **No Version Suffixes**: Unlike other CMS datasets, no `_v1`, `_v2`, `_v10` needed
3. **Case Sensitive**: Must be uppercase: `HOSPFY2009.zip` (not `hospfy2009.zip`)
4. **Transition Period**: Only 2010 and 2011 have two formats available
5. **Format Names**:
   - `HOSPFY` = Original format (1995-2011)
   - `HOSP10FY` = 2010 format (2010-present)

## 🚀 What To Do If You Get 404s

### Step 1: Check the Year
- Is it current/future year? → Expected 404
- Is it 2010-2023? → Should work (if not, proceed to Step 2)

### Step 2: Test a Known Good Year
- Set range: **2020 - 2020**
- Click rebuild
- If this works: Problem is with specific year you're requesting
- If this fails: Problem is with network/CORS/CMS changes

### Step 3: Check Browser Console
- Open DevTools (F12)
- Look for CORS errors like: `"Access-Control-Allow-Origin"`
- If present: CMS may have changed their CORS policy

### Step 4: Verify CMS URL Structure
- Visit: https://downloads.cms.gov/Files/hcris/
- Look for files matching pattern `HOSP10FY2023.zip`
- If pattern changed: Code needs updating

## 📚 Related Documentation

- `CMS_URL_PATTERN.md` - Complete URL pattern reference
- `WHAT_404_MEANS.md` - User-friendly 404 explanation
- `DATA_PARSING_VERIFICATION.md` - CSV structure and column mapping

## 💡 Summary

**404 errors are normal for**:
- ✅ Future years (2025+)
- ✅ Current year before data is published
- ✅ Years before 1995

**404 errors are problems if**:
- ❌ Years 2010-2023 consistently fail
- ❌ All years return 404
- ❌ Browser shows CORS policy errors

**Current URL pattern is correct** and matches CMS's actual structure as of the last update.
