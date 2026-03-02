import React, { useState } from 'react';
import { X, Edit2, Check, XCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetObjects: string[];
  targetOrgs: string[];
  onRenameObject: (oldName: string, newName: string) => void;
  onRenameOrg: (oldName: string, newName: string) => void;
}

export const ManageOptionsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetObjects,
  targetOrgs,
  onRenameObject,
  onRenameOrg,
}) => {
  const [editingObj, setEditingObj] = useState<string | null>(null);
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;

  const startEditObj = (val: string) => {
    setEditingObj(val);
    setEditValue(val);
    setEditingOrg(null);
  };

  const startEditOrg = (val: string) => {
    setEditingOrg(val);
    setEditValue(val);
    setEditingObj(null);
  };

  const saveObj = (oldName: string) => {
    onRenameObject(oldName, editValue.trim());
    setEditingObj(null);
  };

  const saveOrg = (oldName: string) => {
    onRenameOrg(oldName, editValue.trim());
    setEditingOrg(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">分类选项管理 (支持批量重命名)</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 flex flex-col sm:flex-row gap-8">
          {/* Objects */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              适用对象 ({targetObjects.length})
            </h3>
            <div className="space-y-2 overflow-y-auto flex-1 pr-2">
              {targetObjects.map((obj) => (
                <div
                  key={obj}
                  className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 group transition-colors"
                >
                  {editingObj === obj ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveObj(obj);
                          if (e.key === 'Escape') setEditingObj(null);
                        }}
                      />
                      <button
                        onClick={() => saveObj(obj)}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingObj(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-slate-700 truncate font-medium" title={obj}>
                        {obj}
                      </span>
                      <button
                        onClick={() => startEditObj(obj)}
                        className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="重命名"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {targetObjects.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-4">暂无数据</div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-slate-200"></div>

          {/* Orgs */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              适用组织 ({targetOrgs.length})
            </h3>
            <div className="space-y-2 overflow-y-auto flex-1 pr-2">
              {targetOrgs.map((org) => (
                <div
                  key={org}
                  className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 group transition-colors"
                >
                  {editingOrg === org ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveOrg(org);
                          if (e.key === 'Escape') setEditingOrg(null);
                        }}
                      />
                      <button
                        onClick={() => saveOrg(org)}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingOrg(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-slate-700 truncate font-medium" title={org}>
                        {org}
                      </span>
                      <button
                        onClick={() => startEditOrg(org)}
                        className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="重命名"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {targetOrgs.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-4">暂无数据</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
