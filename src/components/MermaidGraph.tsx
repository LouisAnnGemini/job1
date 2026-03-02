import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { ProcessedRow } from '../utils/excelParser';
import { Maximize2, X } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
});

interface Props {
  data: ProcessedRow[];
  columns: string[];
}

interface GraphData {
  fileName: string;
  svg: string;
  error: string | null;
}

export const MermaidGraph: React.FC<Props> = ({ data, columns }) => {
  const [graphs, setGraphs] = useState<GraphData[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [selectedGraph, setSelectedGraph] = useState<GraphData | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleOpenModal = (graph: GraphData) => {
    setSelectedGraph(graph);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleCloseModal = () => {
    setSelectedGraph(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(0.1, prev * zoomFactor), 8));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    let isMounted = true;

    const generateGraphs = async () => {
      if (data.length === 0) {
        if (isMounted) setGraphs([]);
        return;
      }

      setIsRendering(true);

      // Group data by fileName
      const groupedData = new Map<string, ProcessedRow[]>();
      data.forEach(row => {
        const file = row.fileName || '未知文件';
        if (!groupedData.has(file)) {
          groupedData.set(file, []);
        }
        groupedData.get(file)!.push(row);
      });

      const newGraphs: GraphData[] = [];

      for (const [fileName, rows] of Array.from(groupedData.entries())) {
        try {
          let graphDef = 'graph LR\n';
          const nodeMap = new Map<string, string>();
          let nodeCounter = 0;

          const getNodeId = (name: string) => {
            if (!nodeMap.has(name)) {
              const id = `N${nodeCounter++}`;
              nodeMap.set(name, id);
              // Add node definition
              const safeName = name.replace(/["\\]/g, '');
              const displayLabel = safeName.replace(/^ +| +$/g, m => '&nbsp;'.repeat(m.length));
              graphDef += `  ${id}["${displayLabel}"]\n`;
            }
            return nodeMap.get(name)!;
          };

          const edges = new Set<string>();

          rows.forEach((row) => {
            let lastNodeName: string | null = null;
            let currentCondition = '';

            columns.forEach((col) => {
              const val = String(row[col] || '');
              
              if (col.includes('环节')) {
                if (val.trim()) {
                  if (lastNodeName) {
                    const fromId = getNodeId(lastNodeName);
                    const toId = getNodeId(val);
                    
                    let cleanCondition = currentCondition.replace(/["\\]/g, '');
                    // If condition is just arrows/equals/spaces, ignore it
                    if (/^[=>\s]+$/.test(cleanCondition)) {
                      cleanCondition = '';
                    }

                    const edgeKey = `${fromId}-${toId}-${cleanCondition}`;
                    if (!edges.has(edgeKey)) {
                      edges.add(edgeKey);
                      if (cleanCondition.trim()) {
                        const displayCondition = cleanCondition.replace(/^ +| +$/g, m => '&nbsp;'.repeat(m.length));
                        graphDef += `  ${fromId} -->|"${displayCondition}"| ${toId}\n`;
                      } else {
                        graphDef += `  ${fromId} --> ${toId}\n`;
                      }
                    }
                  }
                  lastNodeName = val;
                  currentCondition = '';
                }
              } else if (col.includes('条件')) {
                if (val.trim()) {
                  currentCondition = val;
                }
              }
            });
          });

          if (nodeMap.size === 0) {
            newGraphs.push({ fileName, svg: '', error: '没有找到流程节点数据，请检查表头是否包含“环节”和“条件”' });
            continue;
          }

          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, graphDef);
          newGraphs.push({ fileName, svg, error: null });
        } catch (err: any) {
          console.error(`Mermaid render error for ${fileName}:`, err);
          newGraphs.push({ fileName, svg: '', error: `图形渲染失败: ${err.message || '数据过于复杂或包含非法字符'}` });
        }
      }

      if (isMounted) {
        setGraphs(newGraphs);
        setIsRendering(false);
      }
    };

    generateGraphs();

    return () => {
      isMounted = false;
    };
  }, [data, columns]);

  if (isRendering) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 p-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          正在渲染流程图...
        </div>
      </div>
    );
  }

  if (graphs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 p-8">
        暂无数据可供渲染
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-slate-50 p-6 space-y-6">
      {graphs.map((graph, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative group">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {graph.fileName}
            </h3>
            {!graph.error && (
              <button
                onClick={() => handleOpenModal(graph)}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-indigo-50"
                title="全屏查看"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="p-6 overflow-auto flex justify-center min-h-[200px]">
            {graph.error ? (
              <div className="text-red-500 text-sm">{graph.error}</div>
            ) : (
              <div 
                className="cursor-zoom-in"
                onClick={() => handleOpenModal(graph)}
                dangerouslySetInnerHTML={{ __html: graph.svg }} 
              />
            )}
          </div>
        </div>
      ))}

      {/* Fullscreen Modal */}
      {selectedGraph && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 bg-white/10 text-white border-b border-white/10 z-10">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              {selectedGraph.fileName}
              <span className="text-sm text-slate-400 ml-4 font-normal hidden sm:inline-block">
                (滚动鼠标滚轮缩放，拖拽平移)
              </span>
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300 font-mono w-12 text-right">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
                className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors text-slate-200"
                title="复位视图"
              >
                复位
              </button>
              <div className="w-px h-6 bg-white/20"></div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="关闭"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div 
            className={`flex-1 overflow-hidden flex justify-center items-center bg-transparent ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="bg-white rounded-xl p-8 shadow-2xl origin-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              dangerouslySetInnerHTML={{ __html: selectedGraph.svg }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
