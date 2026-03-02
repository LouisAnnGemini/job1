import * as XLSX from 'xlsx';

export interface ProcessedRow {
  id: string;
  fileName: string;
  targetObject: string;
  targetOrg: string;
  [key: string]: any;
}

export interface ParseResult {
  data: ProcessedRow[];
  columns: string[];
}

export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

        if (jsonData.length < 3) {
          resolve({ data: [], columns: [] });
          return;
        }

        const row1 = jsonData[0] || [];
        const row2 = jsonData[1] || [];

        let targetObject = '';
        if (row1[1]) {
          targetObject = String(row1[1]).trim();
        } else if (row1[0] && String(row1[0]).includes(':')) {
          targetObject = String(row1[0]).split(':')[1]?.trim() || '';
        } else if (row1[0] && String(row1[0]).includes('：')) {
          targetObject = String(row1[0]).split('：')[1]?.trim() || '';
        }

        let targetOrg = '';
        if (row2[1]) {
          targetOrg = String(row2[1]).trim();
        } else if (row2[0] && String(row2[0]).includes(':')) {
          targetOrg = String(row2[0]).split(':')[1]?.trim() || '';
        } else if (row2[0] && String(row2[0]).includes('：')) {
          targetOrg = String(row2[0]).split('：')[1]?.trim() || '';
        }

        const row3 = jsonData[2] || [];
        const headerCounts: Record<string, number> = {};
        row3.forEach((h: any) => {
          const strH = String(h).trim();
          if (strH) headerCounts[strH] = (headerCounts[strH] || 0) + 1;
        });

        const currentCounts: Record<string, number> = {};
        const finalHeaders = row3.map((h: any) => {
          const strH = String(h).trim();
          if (!strH) return '';
          if (headerCounts[strH] > 1) {
            currentCounts[strH] = (currentCounts[strH] || 0) + 1;
            return `${strH} ${currentCounts[strH]}`;
          }
          return strH;
        });

        const rows = jsonData.slice(3);
        const processedRows: ProcessedRow[] = [];

        rows.forEach((row, index) => {
          const rowData: ProcessedRow = {
            id: `${file.name}-${index}-${Date.now()}`,
            fileName: file.name,
            targetObject,
            targetOrg,
          };

          let hasData = false;
          finalHeaders.forEach((header, colIndex) => {
            if (header) {
              const val = String(row[colIndex] || '').trim();
              rowData[header] = val;
              if (val) hasData = true;
            }
          });

          if (hasData) {
            processedRows.push(rowData);
          }
        });

        resolve({
          data: processedRows,
          columns: finalHeaders.filter(Boolean),
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const exportToExcel = (data: ProcessedRow[], columns: string[], filename: string = '格式化数据导出.xlsx') => {
  const exportData = data.map(row => {
    const rowData: Record<string, any> = {
      '适用对象': row.targetObject || '',
      '适用组织': row.targetOrg || '',
      '文件名': row.fileName || ''
    };
    columns.forEach(col => {
      rowData[col] = row[col] || '';
    });
    return rowData;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "合并数据");
  XLSX.writeFile(workbook, filename);
};
