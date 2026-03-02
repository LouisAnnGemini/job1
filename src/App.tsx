import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { ManageOptionsModal } from './components/ManageOptionsModal';
import { MultiSelect } from './components/MultiSelect';
import { MermaidGraph } from './components/MermaidGraph';
import { parseExcelFile, exportToExcel, exportSummaryToExcel, ProcessedRow } from './utils/excelParser';
import { Search, Filter, Trash2, FileSpreadsheet, UploadCloud, Download, Settings2, LayoutList, Layers, Network } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<ProcessedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetObjectFilter, setTargetObjectFilter] = useState<string[]>([]);
  const [targetOrgFilter, setTargetOrgFilter] = useState<string[]>([]);
  
  const [viewMode, setViewMode] = useState<'detail' | 'summary' | 'graph'>('detail');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const handleUpload = async (files: File[]) => {
    const allNewData: ProcessedRow[] = [];
    const allNewColumns = new Set<string>(columns);

    for (const file of files) {
      try {
        const result = await parseExcelFile(file);
        allNewData.push(...result.data);
        result.columns.forEach((c) => allNewColumns.add(c));
      } catch (error) {
        console.error(`Error parsing ${file.name}:`, error);
        alert(`解析文件 ${file.name} 失败`);
      }
    }

    setData((prev) => [...prev, ...allNewData]);
    setColumns(Array.from(allNewColumns));
  };

  const clearData = () => {
    setData([]);
    setColumns([]);
    setSearchQuery('');
    setTargetObjectFilter([]);
    setTargetOrgFilter([]);
    setViewMode('detail');
  };

  const renameTargetObject = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    setData((prev) =>
      prev.map((row) => (row.targetObject === oldName ? { ...row, targetObject: newName } : row))
    );
    if (targetObjectFilter.includes(oldName)) {
      setTargetObjectFilter((prev) => [...prev.filter((p) => p !== oldName), newName]);
    }
  };

  const renameTargetOrg = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    setData((prev) =>
      prev.map((row) => (row.targetOrg === oldName ? { ...row, targetOrg: newName } : row))
    );
    if (targetOrgFilter.includes(oldName)) {
      setTargetOrgFilter((prev) => [...prev.filter((p) => p !== oldName), newName]);
    }
  };

  const uniqueTargetObjects = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.targetObject))).filter(Boolean);
  }, [data]);

  const uniqueTargetOrgs = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.targetOrg))).filter(Boolean);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Filter by Target Object
      if (targetObjectFilter.length > 0 && !targetObjectFilter.includes(row.targetObject)) return false;
      // 2. Filter by Target Org
      if (targetOrgFilter.length > 0 && !targetOrgFilter.includes(row.targetOrg)) return false;
      // 3. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        // Search across all values in the row
        const matches = Object.values(row).some((val) =>
          String(val).toLowerCase().includes(query)
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [data, targetObjectFilter, targetOrgFilter, searchQuery]);

  const summaryData = useMemo(() => {
    const map = new Map<string, { targetObject: string; targetOrg: string; count: number }>();
    filteredData.forEach((row) => {
      const key = `${row.targetObject}|${row.targetOrg}`;
      if (!map.has(key)) {
        map.set(key, { targetObject: row.targetObject, targetOrg: row.targetOrg, count: 0 });
      }
      map.get(key)!.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Define the fixed columns
  const fixedColumns = ['适用对象', '适用组织', '文件名'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800">批量数据格式化工具</h1>
          </div>
          {data.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => viewMode === 'detail' ? exportToExcel(filteredData, columns) : exportSummaryToExcel(summaryData)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="导出当前筛选后的数据"
              >
                <Download className="w-4 h-4" />
                导出数据
              </button>
              <button
                onClick={clearData}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                清空数据
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {data.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-12">
            <FileUpload onUpload={handleUpload} />
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* View Mode Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                onClick={() => setViewMode('detail')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'detail'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                明细数据
              </button>
              <button
                onClick={() => setViewMode('summary')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'summary'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Layers className="w-4 h-4" />
                汇总去重数据
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'graph'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Network className="w-4 h-4" />
                可视化流程视图
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-1 gap-4 w-full flex-col sm:flex-row">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="全局搜索内容..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow"
                  />
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                    <MultiSelect
                      options={uniqueTargetObjects}
                      selected={targetObjectFilter}
                      onChange={setTargetObjectFilter}
                      placeholder="适用对象"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <MultiSelect
                      options={uniqueTargetOrgs}
                      selected={targetOrgFilter}
                      onChange={setTargetOrgFilter}
                      placeholder="适用组织"
                    />
                  </div>
                  
                  <button
                    onClick={() => setIsManageModalOpen(true)}
                    className="flex items-center justify-center p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 hover:border-indigo-200"
                    title="选项管理 (批量重命名)"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-sm font-medium text-slate-500 whitespace-nowrap bg-slate-50 px-3 py-1.5 rounded-md">
                共 {viewMode === 'detail' ? filteredData.length : summaryData.length} 条数据
              </div>
            </div>

            {/* Data Table / Graph */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 320px)' }}>
              {viewMode === 'graph' ? (
                <MermaidGraph data={filteredData} columns={columns} />
              ) : (
                <div className="overflow-auto flex-1">
                  <table className="min-w-full divide-y divide-slate-200 border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    {viewMode === 'detail' ? (
                      <tr>
                        {fixedColumns.map((col) => (
                          <th
                            key={col}
                            className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-slate-50 border-b border-slate-200"
                          >
                            {col}
                          </th>
                        ))}
                        {columns.map((col) => (
                          <th
                            key={col}
                            className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-slate-50 border-b border-slate-200"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-slate-50 border-b border-slate-200">
                          适用对象
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-slate-50 border-b border-slate-200">
                          适用组织
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-slate-50 border-b border-slate-200">
                          匹配条数
                        </th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {viewMode === 'detail' ? (
                      filteredData.map((row) => (
                        <tr key={row.id} className="hover:bg-indigo-50/50 transition-colors group">
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900 bg-white group-hover:bg-indigo-50/50">
                            {row.targetObject || '-'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 bg-white group-hover:bg-indigo-50/50">
                            {row.targetOrg || '-'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-400 bg-white group-hover:bg-indigo-50/50">
                            {row.fileName}
                          </td>
                          {columns.map((col) => (
                            <td
                              key={`${row.id}-${col}`}
                              className="px-6 py-3 whitespace-nowrap text-sm text-slate-600"
                            >
                              {row[col] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      summaryData.map((row, idx) => (
                        <tr key={`${row.targetObject}-${row.targetOrg}-${idx}`} className="hover:bg-indigo-50/50 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                            {row.targetObject || '-'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">
                            {row.targetOrg || '-'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">
                            {row.count}
                          </td>
                        </tr>
                      ))
                    )}
                    
                    {((viewMode === 'detail' && filteredData.length === 0) || (viewMode === 'summary' && summaryData.length === 0)) && (
                      <tr>
                        <td
                          colSpan={viewMode === 'detail' ? fixedColumns.length + columns.length : 3}
                          className="px-6 py-16 text-center text-slate-500 bg-slate-50/50"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Search className="w-8 h-8 text-slate-300 mb-3" />
                            <p className="text-base font-medium text-slate-600">没有找到匹配的数据</p>
                            <p className="text-sm text-slate-400 mt-1">请尝试调整搜索词或筛选条件</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              )}
            </div>
            
            {/* Add more files button */}
            <div className="flex justify-center pt-2">
               <label className="cursor-pointer inline-flex items-center justify-center px-5 py-2.5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
                  <UploadCloud className="w-4 h-4 mr-2" />
                  继续上传文件
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".xlsx, .xls"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleUpload(Array.from(e.target.files));
                        e.target.value = ''; // Reset input
                      }
                    }}
                  />
                </label>
            </div>
          </div>
        )}
      </main>

      <ManageOptionsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        targetObjects={uniqueTargetObjects}
        targetOrgs={uniqueTargetOrgs}
        onRenameObject={renameTargetObject}
        onRenameOrg={renameTargetOrg}
      />
    </div>
  );
}
