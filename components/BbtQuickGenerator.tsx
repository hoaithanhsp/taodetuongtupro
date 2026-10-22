import React, { useState, useEffect, useMemo } from 'react';
import {
  renderFigureSpecToSvg,
  svgToDataUrl,
  svgToPngDataUrl,
  copySvgAsPngToClipboard,
  downloadSvgAsPng,
  renderFiguresInHtml,
} from '../services/figureEngine';

interface BbtQuickGeneratorProps {
  examContent?: string;
  onUpdateExamContent?: (newContent: string) => void;
  solutionContent?: string;
  onUpdateSolutionContent?: (newContent: string) => void;
  defaultOpen?: boolean;
}

type StudioTab = 'bbt' | 'graph' | 'geo3d' | 'geo2d';

const PRESET_BBT_FUNCTIONS = [
  { label: 'Bậc 3: x³ - 3x + 1', fn: 'x^3 - 3*x + 1' },
  { label: 'Bậc 3: -x³ + 3x² - 1', fn: '-x^3 + 3*x^2 - 1' },
  { label: 'Trùng phương: x⁴ - 2x² - 3', fn: 'x^4 - 2*x^2 - 3' },
  { label: 'Bậc 1/1: (2x+1)/(x-1)', fn: '(2*x+1)/(x-1)' },
  { label: 'Bậc 2/1: (x²-x+1)/(x-1)', fn: '(x^2-x+1)/(x-1)' },
  { label: 'Căn thức: sqrt(4 - x²)', fn: 'sqrt(4 - x^2)' },
];

const PRESET_GRAPH_SPECS = [
  {
    label: 'Bậc 3: x³ - 3x + 1',
    fn: 'x^3 - 3*x + 1',
    xmin: -3,
    xmax: 3,
    mode: 'none' as 'none' | 'shade' | 'revolve',
    intA: -1,
    intB: 2,
  },
  {
    label: 'Bậc 3: -x³ + 3x',
    fn: '-x^3 + 3*x',
    xmin: -3,
    xmax: 3,
    mode: 'none' as 'none' | 'shade' | 'revolve',
    intA: -1,
    intB: 1,
  },
  {
    label: 'Trùng phương: x⁴ - 2x² - 1',
    fn: 'x^4 - 2*x^2 - 1',
    xmin: -2.5,
    xmax: 2.5,
    mode: 'none' as 'none' | 'shade' | 'revolve',
    intA: -1,
    intB: 1,
  },
  {
    label: 'Trùng phương: -x⁴ + 2x² + 1',
    fn: '-x^4 + 2*x^2 + 1',
    xmin: -2.5,
    xmax: 2.5,
    mode: 'none' as 'none' | 'shade' | 'revolve',
    intA: -1,
    intB: 1,
  },
  {
    label: 'Phân thức: (2x+1)/(x-1)',
    fn: '(2*x+1)/(x-1)',
    xmin: -3,
    xmax: 5,
    mode: 'none' as 'none' | 'shade' | 'revolve',
    intA: 2,
    intB: 4,
  },
  {
    label: 'Tích phân diện tích: -x² + 4',
    fn: '-x^2 + 4',
    xmin: -3,
    xmax: 3,
    mode: 'shade' as 'none' | 'shade' | 'revolve',
    intA: -2,
    intB: 2,
  },
  {
    label: 'Khối tròn xoay Ox: sqrt(x)',
    fn: 'sqrt(x)',
    xmin: -0.5,
    xmax: 4.5,
    mode: 'revolve' as 'none' | 'shade' | 'revolve',
    intA: 0,
    intB: 4,
  },
];

const PRESET_GEO3D_SPECS = [
  {
    label: 'Chóp S.ABC (SA ⊥ đáy)',
    preset: 'pyramid-tri',
    foot: 'A',
    angle: 30,
    ratio: 0.5,
    extra: ['point M midpoint(B,C)', 'segment A M', 'segment S M'],
    marks: ['rightangle S A B', 'rightangle S A C'],
  },
  {
    label: 'Chóp đều S.ABCD (SO ⊥ đáy)',
    preset: 'pyramid-square',
    foot: 'center',
    angle: 30,
    ratio: 0.5,
    extra: ['point O center(ABCD)', 'segment A C', 'segment B D', 'segment S O'],
    marks: ['rightangle S O B'],
  },
  {
    label: 'Chóp S.ABCD (SA ⊥ đáy)',
    preset: 'pyramid-square',
    foot: 'A',
    angle: 30,
    ratio: 0.5,
    extra: ['segment A C', 'segment B D'],
    marks: ['rightangle S A B', 'rightangle S A D'],
  },
  {
    label: 'Tứ diện vuông O.ABC',
    preset: 'tetra-right',
    foot: 'O',
    angle: 30,
    ratio: 0.5,
    extra: [],
    marks: ['rightangle C O A', 'rightangle C O B', 'rightangle A O B'],
  },
  {
    label: "Lăng trụ đứng ABC.A'B'C'",
    preset: 'prism-tri',
    foot: 'A',
    angle: 30,
    ratio: 0.5,
    extra: [],
    marks: ["rightangle A' A B"],
  },
  {
    label: "Hình hộp ABCD.A'B'C'D'",
    preset: 'box',
    foot: 'A',
    angle: 30,
    ratio: 0.5,
    extra: ["segment A C'"],
    marks: [],
  },
  {
    label: 'Hình nón đỉnh S, tâm O',
    preset: 'cone',
    foot: 'center',
    angle: 90,
    ratio: 0.33,
    extra: [],
    marks: [],
  },
  {
    label: "Hình trụ tâm O, O'",
    preset: 'cylinder',
    foot: 'center',
    angle: 90,
    ratio: 0.33,
    extra: [],
    marks: [],
  },
  {
    label: 'Mặt cầu tâm O',
    preset: 'sphere',
    foot: 'center',
    angle: 90,
    ratio: 0.33,
    extra: [],
    marks: [],
  },
];

const PRESET_GEO2D_JSON = [
  {
    label: 'Tam giác vuông ABC & đường cao AH',
    spec: {
      type: 'geo2d',
      preset: 'custom',
      points: [
        { id: 'A', x: 0, y: 2.8, label: 'A' },
        { id: 'B', x: -1.8, y: 0, label: 'B' },
        { id: 'C', x: 4.2, y: 0, label: 'C' },
        { id: 'H', x: 0, y: 0, label: 'H' },
      ],
      polygons: [{ points: ['A', 'B', 'C'] }],
      segments: [{ from: 'A', to: 'H', style: 'dashed' }],
      rightAngles: [
        { at: 'H', p1: 'A', p2: 'C' },
        { at: 'A', p1: 'B', p2: 'C' },
      ],
    },
  },
  {
    label: 'Hình bình hành ABCD & tâm O',
    spec: {
      type: 'geo2d',
      preset: 'parallelogram',
      params: { a: 4, b: 2.5, angle: 62, center: true },
    },
  },
  {
    label: 'Hình thang vuông ABCD',
    spec: {
      type: 'geo2d',
      preset: 'trapezoid-right',
      params: { a: 4.2, b: 2.4, h: 2.3 },
    },
  },
  {
    label: 'Đường tròn (O) & dây cung AB',
    spec: {
      type: 'geo2d',
      preset: 'custom',
      points: [
        { id: 'O', x: 0, y: 0, label: 'O' },
        { id: 'A', x: -2.0, y: 1.5, label: 'A' },
        { id: 'B', x: 2.0, y: 1.5, label: 'B' },
        { id: 'H', x: 0, y: 1.5, label: 'H' },
      ],
      circles: [{ center: 'O', radius: 2.5 }],
      segments: [
        { from: 'A', to: 'B' },
        { from: 'O', to: 'A', style: 'dashed' },
        { from: 'O', to: 'B', style: 'dashed' },
        { from: 'O', to: 'H' },
      ],
      rightAngles: [{ at: 'H', p1: 'O', p2: 'B' }],
    },
  },
  {
    label: 'Phương hướng tàu thuyền (A → B → C)',
    spec: {
      type: 'geo2d',
      preset: 'navigation',
      params: {
        ab: 24,
        bc: 32,
        bearingAB: 'N45E',
        bearingBC: 'S30E',
        labelAB: '24 km',
        labelBC: '32 km',
        labelAC: '?',
      },
    },
  },
  {
    label: 'Vật lý: Tổng hợp hai lực F₁, F₂',
    spec: {
      type: 'geo2d',
      preset: 'custom',
      points: [
        { id: 'O', x: 0, y: 0, label: 'O' },
        { id: 'F1', x: 3.5, y: 0, label: 'F₁' },
        { id: 'F2', x: 1.2, y: 2.4, label: 'F₂' },
        { id: 'F', x: 4.7, y: 2.4, label: 'F' },
      ],
      vectors: [
        { from: 'O', to: 'F1' },
        { from: 'O', to: 'F2' },
        { from: 'O', to: 'F' },
      ],
      segments: [
        { from: 'F1', to: 'F', style: 'dashed' },
        { from: 'F2', to: 'F', style: 'dashed' },
      ],
      angles: [{ at: 'O', p1: 'F1', p2: 'F2', label: 'α' }],
    },
  },
];

const BbtQuickGenerator: React.FC<BbtQuickGeneratorProps> = ({
  examContent = '',
  onUpdateExamContent,
  solutionContent = '',
  onUpdateSolutionContent,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<StudioTab>('bbt');

  // State cho BBT
  const [fnInput, setFnInput] = useState('x^3 - 3*x + 1');

  // State cho Đồ thị (Graph)
  const [graphFn, setGraphFn] = useState('x^3 - 3*x + 1');
  const [graphXmin, setGraphXmin] = useState<number>(-3);
  const [graphXmax, setGraphXmax] = useState<number>(3);
  const [graphMode, setGraphMode] = useState<'none' | 'shade' | 'revolve'>('none');
  const [intA, setIntA] = useState<number>(-1);
  const [intB, setIntB] = useState<number>(2);

  // State cho Hình 3D (Geo3D)
  const [geo3dPreset, setGeo3dPreset] = useState('pyramid-tri');
  const [geo3dFoot, setGeo3dFoot] = useState('A');
  const [geo3dAngle, setGeo3dAngle] = useState<number>(30);
  const [geo3dRatio, setGeo3dRatio] = useState<number>(0.5);
  const [geo3dExtra, setGeo3dExtra] = useState<string[]>(PRESET_GEO3D_SPECS[0].extra);
  const [geo3dMarks, setGeo3dMarks] = useState<string[]>(PRESET_GEO3D_SPECS[0].marks);

  // State cho Hình 2D (Geo2D)
  const [geo2dJson, setGeo2dJson] = useState<string>(() =>
    JSON.stringify(PRESET_GEO2D_JSON[0].spec, null, 2)
  );

  // State chèn vào Đề thi / Lời giải
  const [targetDoc, setTargetDoc] = useState<'exam' | 'solution'>('exam');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('1');
  const [pngUrl, setPngUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [insertedMsg, setInsertedMsg] = useState<string | null>(null);

  const currentSpec = useMemo<Record<string, any> | null>(() => {
    if (activeTab === 'bbt') {
      if (!fnInput.trim()) return null;
      return { type: 'bbt', fn: fnInput.trim() };
    }
    if (activeTab === 'graph') {
      if (!graphFn.trim()) return null;
      const spec: Record<string, any> = {
        type: 'graph',
        fn: [graphFn.trim()],
        xRange: [Number(graphXmin) || -3, Number(graphXmax) || 3],
        asymptotes: 'auto',
        points: 'extrema+intercepts',
      };
      if (graphMode === 'shade') {
        spec.shade = {
          fn: graphFn.trim(),
          fn2: '0',
          from: Number(intA) || 0,
          to: Number(intB) || 1,
        };
      } else if (graphMode === 'revolve') {
        spec.revolve = {
          fn: graphFn.trim(),
          from: Number(intA) || 0,
          to: Number(intB) || 2,
        };
      }
      return spec;
    }
    if (activeTab === 'geo3d') {
      const isRound = /^(cone|cylinder|sphere|frustum)/i.test(geo3dPreset);
      return {
        type: 'geo3d',
        preset: geo3dPreset,
        params: {
          a: 2,
          h: 2.6,
          apexOver: geo3dFoot === 'A' ? 'A' : undefined,
        },
        foot: geo3dFoot,
        view: {
          angle: isRound ? 90 : Number(geo3dAngle) || 30,
          ratio: isRound ? 0.33 : Number(geo3dRatio) || 0.5,
        },
        extra: geo3dExtra,
        marks: geo3dMarks,
      };
    }
    if (activeTab === 'geo2d') {
      try {
        const parsed = JSON.parse(geo2dJson);
        return { ...parsed, type: 'geo2d' };
      } catch {
        return null;
      }
    }
    return null;
  }, [
    activeTab,
    fnInput,
    graphFn,
    graphXmin,
    graphXmax,
    graphMode,
    intA,
    intB,
    geo3dPreset,
    geo3dFoot,
    geo3dAngle,
    geo3dRatio,
    geo3dExtra,
    geo3dMarks,
    geo2dJson,
  ]);

  const svgStr = useMemo(() => {
    if (!currentSpec) return '';
    return renderFigureSpecToSvg(currentSpec);
  }, [currentSpec]);

  useEffect(() => {
    let active = true;
    if (!svgStr) {
      setPngUrl('');
      return;
    }
    setPngUrl(svgToDataUrl(svgStr));
    svgToPngDataUrl(svgStr, 300).then((url) => {
      if (active && url) setPngUrl(url);
    });
    return () => {
      active = false;
    };
  }, [svgStr]);

  const activeContent = targetDoc === 'exam' ? examContent : solutionContent;

  const questionNumbers = useMemo(() => {
    if (!activeContent) return ['1', '2', '3', '4', '5'];
    const matches = [...activeContent.matchAll(/Câu\s+(\d+)\b/gi)];
    const unique = Array.from(new Set(matches.map((m) => m[1])));
    return unique.length > 0 ? unique : ['1', '2', '3', '4', '5'];
  }, [activeContent]);

  useEffect(() => {
    if (questionNumbers.length > 0 && !questionNumbers.includes(selectedQuestion)) {
      setSelectedQuestion(questionNumbers[0]);
    }
  }, [questionNumbers, selectedQuestion]);

  const handleCopyImage = async () => {
    if (!svgStr) return;
    const ok = await copySvgAsPngToClipboard(svgStr, 300);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPng = async () => {
    if (!svgStr) return;
    await downloadSvgAsPng(svgStr, `${activeTab}_300dpi.png`);
  };

  const handleInsertIntoQuestion = () => {
    if (!svgStr || !currentSpec) return;
    const updateFn = targetDoc === 'exam' ? onUpdateExamContent : onUpdateSolutionContent;
    const sourceText = targetDoc === 'exam' ? examContent : solutionContent;
    if (!updateFn) return;

    const jsonLine = JSON.stringify(currentSpec);
    const fenceBlock = `\n\`\`\`figure-json\n${jsonLine}\n\`\`\`\n`;

    const qNum = selectedQuestion;
    let updated = sourceText || '';
    let inserted = false;

    if (!updated.trim()) {
      updated = `**Câu ${qNum}.**\n${fenceBlock}`;
      inserted = true;
    } else {
      const mdQuestionRegex = new RegExp(
        `((?:^|\\n)[^\\n]*?Câu\\s+${qNum}\\b[^\\n]*\\n)`,
        'i'
      );
      if (mdQuestionRegex.test(updated)) {
        updated = updated.replace(mdQuestionRegex, `$1${fenceBlock}`);
        inserted = true;
      }
    }

    if (!inserted) {
      updated = `${updated}\n${fenceBlock}`;
    }

    updateFn(updated);
    const docLabel = targetDoc === 'exam' ? 'Đề thi' : 'Lời giải';
    setInsertedMsg(`Đã chèn hình (${activeTab.toUpperCase()}) vào Câu ${qNum} (${docLabel})!`);
    setTimeout(() => setInsertedMsg(null), 2800);
  };

  return (
    <div className="mb-5 rounded-2xl p-4 border border-teal-200 dark:border-teal-800/70 bg-gradient-to-r from-teal-50/80 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-indigo-600 text-white font-bold text-xs shadow-sm">
            300
          </span>
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Studio Tạo Bảng biến thiên, Đồ thị & Hình học 2D/3D (300 DPI)
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tự động tính đạo hàm, cực trị, tiệm cận, vẽ đồ thị và dựng hình không gian chuẩn SGK — Dán thẳng vào từng câu hỏi
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold px-3.5 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
        >
          {isOpen ? 'Thu gọn Studio ▲' : 'Mở Studio Vẽ Hình (BBT / Đồ thị / 2D / 3D) ▼'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-teal-100 dark:border-slate-700">
          {/* 4 Tabs chọn loại hình */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { id: 'bbt', label: '📊 Bảng biến thiên (BBT)' },
              { id: 'graph', label: '📈 Đồ thị hàm số & Tích phân' },
              { id: 'geo3d', label: '🧊 Hình học không gian 3D' },
              { id: 'geo2d', label: '📐 Hình phẳng 2D & Vector Vật lý' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as StudioTab)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Cột trái: Tham số cấu hình */}
            <div className="lg:col-span-5 space-y-3">
              {activeTab === 'bbt' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nhập hàm số y = f(x):
                    </label>
                    <input
                      type="text"
                      value={fnInput}
                      onChange={(e) => setFnInput(e.target.value)}
                      placeholder="Ví dụ: x^3 - 3*x + 1 hoặc (2*x+1)/(x-1)"
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-teal-300 dark:border-slate-600 focus:ring-2 focus:ring-teal-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_BBT_FUNCTIONS.map((item) => (
                      <button
                        key={item.fn}
                        type="button"
                        onClick={() => setFnInput(item.fn)}
                        className="text-[11px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'graph' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nhập hàm số y = f(x):
                    </label>
                    <input
                      type="text"
                      value={graphFn}
                      onChange={(e) => setGraphFn(e.target.value)}
                      placeholder="Ví dụ: x^3 - 3*x + 1"
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-indigo-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        x_min:
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={graphXmin}
                        onChange={(e) => setGraphXmin(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        x_max:
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={graphXmax}
                        onChange={(e) => setGraphXmax(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[
                      { id: 'none', label: 'Đồ thị chuẩn' },
                      { id: 'shade', label: 'Miền tích phân' },
                      { id: 'revolve', label: 'Khối tròn xoay' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setGraphMode(m.id as 'none' | 'shade' | 'revolve')}
                        className={`py-1 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          graphMode === m.id
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {graphMode !== 'none' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-600 dark:text-slate-400">Cận a:</label>
                        <input
                          type="number"
                          step="0.5"
                          value={intA}
                          onChange={(e) => setIntA(Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 dark:text-slate-400">Cận b:</label>
                        <input
                          type="number"
                          step="0.5"
                          value={intB}
                          onChange={(e) => setIntB(Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_GRAPH_SPECS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setGraphFn(item.fn);
                          setGraphXmin(item.xmin);
                          setGraphXmax(item.xmax);
                          setGraphMode(item.mode);
                          setIntA(item.intA);
                          setIntB(item.intB);
                        }}
                        className="text-[11px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'geo3d' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Loại khối 3D (preset):
                      </label>
                      <select
                        value={geo3dPreset}
                        onChange={(e) => {
                          setGeo3dPreset(e.target.value);
                          setGeo3dExtra([]);
                          setGeo3dMarks([]);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="pyramid-tri">Chóp tam giác (S.ABC)</option>
                        <option value="pyramid-square">Chóp tứ giác (S.ABCD)</option>
                        <option value="tetra-right">Tứ diện vuông (O.ABC)</option>
                        <option value="prism-tri">Lăng trụ tam giác (ABC.A&apos;B&apos;C&apos;)</option>
                        <option value="prism-quad">Lăng trụ tứ giác (ABCD.A&apos;B&apos;C&apos;D&apos;)</option>
                        <option value="box">Hình hộp chữ nhật</option>
                        <option value="cube">Hình lập phương</option>
                        <option value="pyramid-hex">Chóp lục giác đều (S.ABCDEF)</option>
                        <option value="cone">Hình nón (Đỉnh S, tâm O)</option>
                        <option value="cylinder">Hình trụ (Tâm O, O&apos;)</option>
                        <option value="sphere">Mặt cầu (Tâm O)</option>
                        <option value="frustum">Hình nón cụt</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Chân đường cao:
                      </label>
                      <select
                        value={geo3dFoot}
                        onChange={(e) => setGeo3dFoot(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="A">Đỉnh A (SA ⊥ đáy)</option>
                        <option value="center">Tâm O của đáy (Chóp đều)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400">
                        Góc chiếu xiên ({geo3dAngle}°):
                      </label>
                      <input
                        type="range"
                        min="15"
                        max="65"
                        value={geo3dAngle}
                        onChange={(e) => setGeo3dAngle(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 dark:text-slate-400">
                        Hệ số co chiều sâu ({geo3dRatio}):
                      </label>
                      <input
                        type="range"
                        min="0.3"
                        max="0.7"
                        step="0.05"
                        value={geo3dRatio}
                        onChange={(e) => setGeo3dRatio(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Chọn nhanh mẫu Hình không gian 3D chuẩn SGK:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_GEO3D_SPECS.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setGeo3dPreset(item.preset);
                            setGeo3dFoot(item.foot);
                            setGeo3dAngle(item.angle);
                            setGeo3dRatio(item.ratio);
                            setGeo3dExtra(item.extra);
                            setGeo3dMarks(item.marks);
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Điểm phụ & Đoạn thẳng phụ (mỗi dòng 1 lệnh, vd: point M midpoint(B,C) | segment S M):
                    </label>
                    <textarea
                      rows={3}
                      value={geo3dExtra.join('\n')}
                      onChange={(e) =>
                        setGeo3dExtra(
                          e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder={'point M midpoint(B,C)\nsegment A M\nsegment S M'}
                      className="w-full p-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'geo2d' && (
                <>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Chọn nhanh mẫu Hình phẳng 2D & Vector Vật lý:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_GEO2D_JSON.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setGeo2dJson(JSON.stringify(item.spec, null, 2))}
                          className="text-[11px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Cấu hình Hình 2D / Vector (JSON):
                    </label>
                    <textarea
                      rows={5}
                      value={geo2dJson}
                      onChange={(e) => setGeo2dJson(e.target.value)}
                      className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white outline-none"
                    />
                  </div>
                </>
              )}

              {/* Nút thao tác chèn vào Câu hỏi / Copy / Tải PNG */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                {(onUpdateExamContent || onUpdateSolutionContent) && (
                  <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-teal-200 dark:border-slate-700">
                    <select
                      value={targetDoc}
                      onChange={(e) => setTargetDoc(e.target.value as 'exam' | 'solution')}
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="exam">Đề thi</option>
                      <option value="solution">Lời giải</option>
                    </select>
                    <span className="text-slate-300">|</span>
                    <select
                      value={selectedQuestion}
                      onChange={(e) => setSelectedQuestion(e.target.value)}
                      className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-transparent outline-none cursor-pointer"
                    >
                      {questionNumbers.map((num) => (
                        <option key={num} value={num}>
                          Câu {num}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleInsertIntoQuestion}
                      disabled={!svgStr}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      📌 Dán vào Câu {selectedQuestion}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCopyImage}
                  disabled={!svgStr}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  {copied ? '✓ Đã copy!' : '📋 Copy ảnh'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!svgStr}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                >
                  ⬇ Tải PNG (300 DPI)
                </button>
              </div>

              {insertedMsg && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                  ✅ {insertedMsg}
                </p>
              )}
            </div>

            {/* Cột phải: Xem trước ảnh 300 DPI */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 min-h-[240px]">
              {pngUrl ? (
                <>
                  <img
                    src={pngUrl}
                    alt="Xem trước hình minh hoạ 300 DPI"
                    className="max-w-full h-auto bg-white rounded-lg"
                    style={{ maxHeight: '280px' }}
                  />
                  <span className="text-[11px] text-slate-400 mt-2 text-center">
                    Ảnh chuẩn 300 DPI — Hiển thị trực tiếp trên web và tự động nhúng vào file Word (.docx)
                  </span>
                </>
              ) : (
                <span className="text-xs text-rose-500 text-center px-4">
                  Không nhận diện được biểu thức hoặc cấu hình JSON. Vui lòng kiểm tra lại cú pháp hàm số (ví dụ: x^3 - 3*x + 1).
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BbtQuickGenerator;
