import { HCRISRecord, ProviderMapping, YearStatistics } from './types';

const TRIGGER_DATE = new Date('2025-07-03');
const CMS_BASE_URL = 'https://www.cms.gov/data-research/statistics-trends-and-reports/cost-reports/cost-reports-fiscal-year';

export class HCRISProcessor {
  private providerMapping: ProviderMapping = {};
  private masterData: HCRISRecord[] = [];
  
  async checkForUpdates(): Promise<boolean> {
    return true;
  }

  async downloadProviderMapping(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.providerMapping = {
      '010001': 'Southeast Alabama Medical Center',
      '010005': 'Marshall Medical Center South',
      '010006': 'Eliza Coffee Memorial Hospital',
      '010007': 'Mizell Memorial Hospital',
      '010008': 'Crenshaw Community Hospital',
      '010010': 'Flowers Hospital',
      '010011': 'St. Vincents East',
      '010012': 'Stringfellow Memorial Hospital',
    };
  }

  async crawlYearList(startYear?: number, endYear?: number): Promise<number[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const currentYear = new Date().getFullYear();
    const start = startYear || 1995;
    const end = endYear || currentYear;
    
    const years: number[] = [];
    for (let year = start; year <= end; year++) {
      years.push(year);
    }
    return years;
  }

  async downloadYearData(year: number): Promise<HCRISRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    const recordCount = Math.floor(Math.random() * 5000) + 3000;
    const records: HCRISRecord[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      const providerNum = String(10001 + Math.floor(Math.random() * 500)).padStart(6, '0');
      const fiscalMonth = Math.floor(Math.random() * 12) + 1;
      const fiscalDay = Math.floor(Math.random() * 28) + 1;
      const nprMonth = Math.floor(Math.random() * 12) + 1;
      const nprDay = Math.floor(Math.random() * 28) + 1;
      const nprYear = year + Math.floor(Math.random() * 3);
      
      records.push({
        providerNumber: providerNum,
        providerName: this.providerMapping[providerNum] || `Hospital ${providerNum}`,
        fiscalYearEnd: `${fiscalMonth}/${fiscalDay}/${year}`,
        nprDate: `${nprMonth}/${nprDay}/${nprYear}`,
        reportYear: year,
        sourceFile: year >= 2010 ? `HOSP10FY${year}` : `HOSPFY${year}`,
      });
    }
    
    return records;
  }

  parseCSVLine(line: string): HCRISRecord | null {
    const columns = line.split(',');
    
    if (columns.length < 16) {
      return null;
    }
    
    const providerNumber = columns[0].trim();
    const fiscalYearEnd = columns[6].trim();
    const nprDate = columns[15].trim();
    
    if (!providerNumber || !fiscalYearEnd || !nprDate) {
      return null;
    }
    
    const fiscalYear = new Date(fiscalYearEnd).getFullYear();
    
    return {
      providerNumber: providerNumber.padStart(6, '0'),
      providerName: this.providerMapping[providerNumber] || `Hospital ${providerNumber}`,
      fiscalYearEnd,
      nprDate,
      reportYear: fiscalYear,
      sourceFile: `HOSP10FY${fiscalYear}`,
    };
  }

  applyProviderMapping(records: HCRISRecord[]): HCRISRecord[] {
    return records.map(record => {
      const mappedName = this.providerMapping[record.providerNumber];
      if (mappedName) {
        return { ...record, providerName: mappedName };
      }
      return record;
    });
  }

  deduplicateRecords(records: HCRISRecord[]): HCRISRecord[] {
    const keyMap = new Map<string, HCRISRecord>();
    
    records.forEach(record => {
      const key = `${record.providerNumber}_${record.fiscalYearEnd}_${record.nprDate}`;
      const existing = keyMap.get(key);
      
      if (!existing) {
        keyMap.set(key, record);
      } else {
        const existingNpr = new Date(existing.nprDate);
        const currentNpr = new Date(record.nprDate);
        
        if (currentNpr > existingNpr) {
          keyMap.set(key, record);
        }
      }
    });
    
    return Array.from(keyMap.values());
  }

  calculateStatistics(records: HCRISRecord[]): YearStatistics[] {
    const yearMap = new Map<number, HCRISRecord[]>();
    
    records.forEach(record => {
      const year = record.reportYear;
      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(record);
    });
    
    const stats: YearStatistics[] = [];
    
    yearMap.forEach((yearRecords, year) => {
      const uniqueProviders = new Set(yearRecords.map(r => r.providerNumber)).size;
      const namesMapped = yearRecords.filter(r => this.providerMapping[r.providerNumber]).length;
      const unmappedProviders = uniqueProviders - new Set(
        yearRecords.filter(r => this.providerMapping[r.providerNumber]).map(r => r.providerNumber)
      ).size;
      
      const nprDates = yearRecords.map(r => new Date(r.nprDate));
      const latestNprDate = new Date(Math.max(...nprDates.map(d => d.getTime())));
      
      const sourceFiles = Array.from(new Set(yearRecords.map(r => r.sourceFile)));
      
      stats.push({
        year,
        recordCount: yearRecords.length,
        uniqueProviders,
        namesMapped,
        unmappedProviders,
        latestNprDate: latestNprDate.toLocaleDateString(),
        sourceFiles,
      });
    });
    
    return stats.sort((a, b) => b.year - a.year);
  }

  getMasterData(): HCRISRecord[] {
    return this.masterData;
  }

  setMasterData(records: HCRISRecord[]): void {
    this.masterData = records;
  }

  searchByProvider(providerNumber: string): HCRISRecord[] {
    return this.masterData
      .filter(record => record.providerNumber === providerNumber)
      .sort((a, b) => new Date(b.nprDate).getTime() - new Date(a.nprDate).getTime());
  }

  getSampleByYear(year: number, limit: number = 10): HCRISRecord[] {
    return this.masterData
      .filter(record => record.reportYear === year)
      .slice(0, limit);
  }

  filterByYearRange(startYear: number, endYear: number): HCRISRecord[] {
    return this.masterData.filter(
      record => record.reportYear >= startYear && record.reportYear <= endYear
    );
  }

  getAvailableYears(): number[] {
    const years = new Set(this.masterData.map(r => r.reportYear));
    return Array.from(years).sort((a, b) => a - b);
  }

  exportToCSV(records: HCRISRecord[]): string {
    const headers = ['Provider Number', 'Provider Name', 'Fiscal Year End', 'NPR Date', 'Report Year', 'Source File'];
    const rows = records.map(r => [
      r.providerNumber,
      r.providerName,
      r.fiscalYearEnd,
      r.nprDate,
      r.reportYear.toString(),
      r.sourceFile,
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }
}
