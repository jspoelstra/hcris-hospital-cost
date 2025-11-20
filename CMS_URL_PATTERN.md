# CMS HCRIS Download URL Pattern

## Correct URL Structure

**Base URL**: `https://downloads.cms.gov/Files/hcris/`

## Pattern Rules

### Years 1995-2009: HOSPFY Format Only
- **Pattern**: `HOSPFYXXXX.zip` where XXXX is the 4-digit year
- **Examples**:
  - 2009: `https://downloads.cms.gov/Files/hcris/HOSPFY2009.zip`
  - 2008: `https://downloads.cms.gov/Files/hcris/HOSPFY2008.zip`
  - 1995: `https://downloads.cms.gov/Files/hcris/HOSPFY1995.zip`

### Years 2010-2011: BOTH Formats Available
These are the only years with two different file formats available:
- **HOSP10 Format**: `HOSP10FYXXXX.zip` where XXXX is the 4-digit year
- **HOSP Format**: `HOSPFYXXXX.zip` where XXXX is the 4-digit year

**2010 Examples**:
- `https://downloads.cms.gov/Files/hcris/HOSP10FY2010.zip` ✓
- `https://downloads.cms.gov/Files/hcris/HOSPFY2010.zip` ✓

**2011 Examples**:
- `https://downloads.cms.gov/Files/hcris/HOSP10FY2011.zip` ✓
- `https://downloads.cms.gov/Files/hcris/HOSPFY2011.zip` ✓

### Years 2012+: HOSP10FY Format Only
- **Pattern**: `HOSP10FYXXXX.zip` where XXXX is the 4-digit year
- **Examples**:
  - 2023: `https://downloads.cms.gov/Files/hcris/HOSP10FY2023.zip`
  - 2020: `https://downloads.cms.gov/Files/hcris/HOSP10FY2020.zip`
  - 2012: `https://downloads.cms.gov/Files/hcris/HOSP10FY2012.zip`

## Key Points

1. **FY Year Always Matches Data Year**: The FYXXXX portion always matches the year parameter
   - Year 2010 → `HOSPFY2010.zip` or `HOSP10FY2010.zip`
   - Year 2015 → `HOSP10FY2015.zip`
   - Year 2023 → `HOSP10FY2023.zip`

2. **No Version Suffixes**: Unlike some CMS datasets, HCRIS files don't use `_v1`, `_v2`, `_v10` suffixes

3. **Case Sensitive**: All letters in filenames are uppercase (HOSP, FY, not hosp, fy)

4. **Transition Years**: 2010 and 2011 are unique in having both old (HOSP) and new (HOSP10) format files available

## Download Strategy

The app tries URLs in order of preference:

### For years ≤ 2009:
```
Try: HOSPFY{year}.zip
```

### For years 2010-2011:
```
Try: HOSP10FY{year}.zip (newer format, preferred)
If 404: Try HOSPFY{year}.zip (legacy format, fallback)
```

### For years ≥ 2012:
```
Try: HOSP10FY{year}.zip
```

## Error Handling

If a URL returns 404:
- **Years 2010-2011**: Try the alternate format before failing
- **Other years**: Log error indicating data may not be available yet (common for current/future years)
- **All URLs fail**: Throw error with message about 404s

## Current Year Handling

For the current year or very recent years (e.g., 2025), a 404 is expected if CMS hasn't published that year's data yet. The app will log:
```
"Year 2025: All download URLs returned 404 - data may not be available yet"
```

This is normal behavior and not a bug.
