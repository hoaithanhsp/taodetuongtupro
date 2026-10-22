import React, { useState, useEffect } from 'react';
import {
  AppStatus,
  GeneratedContent,
  FileData,
  DiagramMode,
  SolutionMode,
  SubjectMode,
  GradeLevel,
  ContextVariationMode,
} from './types';
import {
  generateSimilarExam,
  getApiProvider,
  getStoredApiKey,
  getSelectedModel,
  onFallbackNoticeChange,
  parseApiError,
  ApiProvider,
} from './services/geminiService';
import { exportToDoc } from './services/exportUtils';
import FileUpload from './components/FileUpload';
import MarkdownResult from './components/MarkdownResult';
import BbtQuickGenerator from './components/BbtQuickGenerator';
import ApiKeyModal from './components/ApiKeyModal';
import {
  Sparkles,
  BookOpen,
  FileCheck,
  Layers,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Printer,
  GraduationCap,
  FileDown,
  Sliders,
  Image as ImageIcon,
  FileText,
  Settings,
  Key,
  Moon,
  Sun,
  Atom,
  Calculator,
  Edit3,
  Eye,
  Award,
} from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'exam' | 'solution'>('exam');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme_dark_mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme_dark_mode', String(darkMode));
  }, [darkMode]);

  // Configuration States
  const [subjectMode, setSubjectMode] = useState<SubjectMode>('auto');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('auto');
  const [contextVariation, setContextVariation] = useState<ContextVariationMode>('creative');
  const [diagramMode, setDiagramMode] = useState<DiagramMode>('detailed');
  const [solutionMode, setSolutionMode] = useState<SolutionMode>('detailed');
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // API Key & Model State (chuẩn API v4.2)
  const [provider, setProvider] = useState<ApiProvider>(() => getApiProvider());
  const [apiKey, setApiKey] = useState<string>(() => getStoredApiKey(getApiProvider()));
  const [selectedModel, setSelectedModelState] = useState<string>(() =>
    getSelectedModel(getApiProvider())
  );
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [fallbackNotice, setFallbackNoticeState] = useState<string | null>(null);

  useEffect(() => {
    const currentProvider = getApiProvider();
    const key = getStoredApiKey(currentProvider);
    const model = getSelectedModel(currentProvider);
    setProvider(currentProvider);
    setApiKey(key);
    setSelectedModelState(model);
    if (!key) {
      setShowKeyModal(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onFallbackNoticeChange((notice) => {
      setFallbackNoticeState(notice);
    });
    return unsubscribe;
  }, []);

  const handleSaveApiConfig = (newProvider: ApiProvider, newKey: string, newModel: string) => {
    setProvider(newProvider);
    setApiKey(newKey);
    setSelectedModelState(newModel);
    setShowKeyModal(false);
  };

  const handleFileSelect = (fileData: FileData | null) => {
    setSelectedFile(fileData);
    setStatus(AppStatus.IDLE);
    setErrorMsg(null);
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    setStatus(AppStatus.ANALYZING);
    setErrorMsg(null);

    try {
      const result = await generateSimilarExam(
        selectedFile,
        {
          diagramMode,
          solutionMode,
          subjectMode,
          gradeLevel,
          contextVariation,
          customInstructions,
        },
        apiKey,
        selectedModel
      );
      setContent(result);
      setStatus(AppStatus.SUCCESS);
      setActiveTab('exam');
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg(parseApiError(err));
    }
  };

  const getActiveContent = () => {
    if (!content) return '';
    switch (activeTab) {
      case 'analysis':
        return content.analysis;
      case 'exam':
        return content.examContent;
      case 'solution':
        return content.detailedSolution;
    }
  };

  const handleUpdateActiveContent = (newText: string) => {
    if (!content) return;
    if (activeTab === 'exam') {
      setContent({ ...content, examContent: newText });
    } else if (activeTab === 'solution') {
      setContent({ ...content, detailedSolution: newText });
    } else {
      setContent({ ...content, analysis: newText });
    }
  };

  const handleCopy = () => {
    const textToCopy = getActiveContent();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWordCurrentTab = async () => {
    const markdownText = getActiveContent();
    if (!markdownText || isExportingWord) return;
    setIsExportingWord(true);
    try {
      const prefix =
        activeTab === 'exam'
          ? 'De_Thi_Tuong_Tu'
          : activeTab === 'solution'
            ? 'Loi_Giai_Chi_Tiet'
            : 'Ma_Tran_Phan_Tich';
      const headerCredit = `**Biên soạn: Phan Lâm — Trường THPT Trần Kỳ Phong**\n\n---\n\n`;
      await exportToDoc(`${headerCredit}${markdownText}`, `${prefix}_PhanLam_THPT_TranKyPhong`);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleExportWordFull = async () => {
    if (!content || isExportingWord) return;
    setIsExportingWord(true);
    try {
      const fullMarkdown = [
        `# ĐỀ THI TƯƠNG TỰ & LỜI GIẢI CHI TIẾT`,
        `**Tác giả biên soạn: Phan Lâm — Trường THPT Trần Kỳ Phong**`,
        `---`,
        content.examContent,
        `\n\n---\n\n# BẢNG ĐÁP ÁN & LỜI GIẢI CHI TIẾT\n\n`,
        content.detailedSolution,
      ].join('\n\n');
      await exportToDoc(fullMarkdown, `Tron_Bo_De_Va_Loi_Giai_PhanLam_THPT_TranKyPhong`);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-app-teal text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header Xanh Mòng Két */}
      <header className="glass-teal-header sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Author */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-600 p-2.5 rounded-2xl shadow-md shadow-teal-600/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-700 dark:from-teal-300 dark:via-teal-200 dark:to-emerald-300">
                  AI Tạo Đề Thi Tương Tự THPT
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100/90 dark:bg-teal-900/70 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                  <Award className="w-3 h-3 text-teal-700 dark:text-teal-300" />
                  GDPT 2018 • 300 DPI
                </span>
              </div>
              <p className="text-xs font-semibold text-teal-900/80 dark:text-slate-300">
                Tác giả: <span className="text-teal-800 dark:text-teal-300 font-bold">Phan Lâm</span> —{' '}
                <span className="text-emerald-800 dark:text-emerald-300 font-bold">Trường THPT Trần Kỳ Phong</span>
              </p>
            </div>
          </div>

          {/* Right Toolbar: DarkMode, API Settings */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-teal-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-teal-800 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
              title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-teal-700" />}
            </button>

            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                apiKey
                  ? 'bg-white/90 dark:bg-slate-800 text-teal-900 dark:text-slate-200 border-teal-300 dark:border-teal-800 hover:bg-teal-50'
                  : 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{apiKey ? `Model: ${selectedModel}` : 'Cấu hình API Key'}</span>
              <Settings className="w-3.5 h-3.5 ml-1 text-teal-500" />
            </button>
          </div>
        </div>

        {/* Banner thông báo xoay vòng model dự phòng (tự ẩn khi hoàn tất) */}
        {fallbackNotice && (
          <div className="bg-amber-50 dark:bg-amber-950/80 border-t border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>{fallbackNotice}</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Upload & Configuration (4 cols) */}
          <div className="lg:col-span-4 space-y-5 no-print">
            {/* Step 1: Upload Original Exam */}
            <div className="card-teal rounded-2xl p-5">
              <h2 className="text-sm font-bold text-teal-950 dark:text-white mb-3 flex items-center gap-2">
                <span className="bg-gradient-to-br from-teal-600 to-teal-700 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shadow-xs shadow-teal-600/30">
                  1
                </span>
                <span>Tải lên Đề thi gốc</span>
              </h2>

              <FileUpload
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                disabled={status === AppStatus.ANALYZING}
              />
            </div>

            {/* Step 2: Subject & Context Variation Options */}
            <div className="card-teal rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-teal-950 dark:text-white flex items-center gap-2">
                <span className="bg-gradient-to-br from-teal-600 to-teal-700 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shadow-xs shadow-teal-600/30">
                  2
                </span>
                <span>Môn học & Quy tắc Thay số / Đổi bối cảnh</span>
              </h2>

              {/* Chọn Môn học */}
              <div>
                <label className="text-xs font-bold text-teal-900 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-teal-600" />
                  <span>Chuyên môn đề thi:</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'auto', label: '✨ Tự động nhận diện' },
                    { id: 'physics', label: '⚡ Vật lý THPT (2018)' },
                    { id: 'math', label: '📐 Toán THPT (2018)' },
                    { id: 'chemistry', label: '🧪 Hoá học THPT' },
                  ].map((subj) => (
                    <button
                      key={subj.id}
                      type="button"
                      disabled={status === AppStatus.ANALYZING}
                      onClick={() => setSubjectMode(subj.id as SubjectMode)}
                      className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-left transition-all cursor-pointer ${
                        subjectMode === subj.id
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-800 dark:text-teal-300 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-teal-50/50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {subj.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn Khối lớp */}
              <div>
                <label className="text-xs font-bold text-teal-900 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-teal-600" />
                  <span>Khối lớp / Kỳ thi:</span>
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  disabled={status === AppStatus.ANALYZING}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-teal-200 dark:border-slate-700 bg-teal-50/40 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="auto">Tự động theo đề gốc</option>
                  <option value="12">Lớp 12 THPT (GDPT 2018)</option>
                  <option value="11">Lớp 11 THPT (GDPT 2018)</option>
                  <option value="10">Lớp 10 THPT (GDPT 2018)</option>
                  <option value="thpt_qg">Tốt nghiệp THPT (Cấu trúc CV 7991)</option>
                </select>
              </div>

              {/* Mức độ Thay số & Thay đổi bối cảnh */}
              <div>
                <label className="text-xs font-bold text-teal-900 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-600" />
                  <span>Chế độ Thay số & Đổi bối cảnh:</span>
                </label>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'creative',
                      title: 'Thay số + Đổi bối cảnh hợp lý (Khuyên dùng)',
                      desc: 'Thay số mới đẹp & đổi sang kịch bản thực tế/thí nghiệm tương đương',
                    },
                    {
                      id: 'moderate',
                      title: 'Thay số + Làm mới ngữ cảnh vừa phải',
                      desc: 'Thay toàn bộ số liệu và diễn đạt lại câu hỏi tự nhiên',
                    },
                    {
                      id: 'numbers_only',
                      title: 'Chỉ thay số liệu (Giữ nguyên bối cảnh gốc)',
                      desc: 'Giữ nguyên mô hình bài toán, chỉ đổi số và tính lại đáp án',
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={status === AppStatus.ANALYZING}
                      onClick={() => setContextVariation(mode.id as ContextVariationMode)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        contextVariation === mode.id
                          ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-600 text-teal-950 dark:text-white shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-teal-50/40 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {mode.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {mode.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chế độ Hình vẽ 300 DPI & Lời giải */}
              <div className="grid grid-cols-1 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-teal-900 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>Vẽ Bảng biến thiên, Đồ thị & Hình học (300 DPI):</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-teal-50/70 dark:bg-slate-800 p-1 rounded-xl border border-teal-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setDiagramMode('standard')}
                      disabled={status === AppStatus.ANALYZING}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        diagramMode === 'standard'
                          ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Tiêu chuẩn
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiagramMode('detailed')}
                      disabled={status === AppStatus.ANALYZING}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        diagramMode === 'detailed'
                          ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Đầy đủ (Đề + Giải)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-teal-900 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>Mức độ Lời giải chi tiết:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-teal-50/70 dark:bg-slate-800 p-1 rounded-xl border border-teal-100 dark:border-slate-700">
                    {[
                      { id: 'concise', label: 'Ngắn gọn' },
                      { id: 'detailed', label: 'Chi tiết' },
                      { id: 'very_detailed', label: 'Siêu chi tiết' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSolutionMode(s.id as SolutionMode)}
                        disabled={status === AppStatus.ANALYZING}
                        className={`py-1.5 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          solutionMode === s.id
                            ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-teal-900 dark:text-slate-300 mb-1 block">
                    Yêu cầu bổ sung (tuỳ chọn):
                  </label>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    disabled={status === AppStatus.ANALYZING}
                    placeholder="VD: Tăng câu thực tế Vật lý nhiệt, cho g = 9,8 m/s²..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-teal-200 dark:border-slate-700 bg-teal-50/30 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Nút Tạo Đề Thi Tương Tự */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedFile || status === AppStatus.ANALYZING}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  !selectedFile || status === AppStatus.ANALYZING
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-600/25 active:scale-[0.99]'
                }`}
              >
                {status === AppStatus.ANALYZING ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Đang phân tích & Tạo đề tương tự...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Tạo Đề Thi Tương Tự Ngay</span>
                  </>
                )}
              </button>

              {status === AppStatus.ERROR && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start space-x-2.5 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="block font-semibold">{errorMsg}</span>
                    <button
                      type="button"
                      onClick={() => setShowKeyModal(true)}
                      className="underline font-bold text-rose-800 dark:text-rose-200 cursor-pointer"
                    >
                      Mở Cấu hình API & Model →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Studio Vẽ Hình 300 DPI & Kết quả Đề Thi (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            {/* Bộ công cụ tạo nhanh BBT, Đồ thị, Hình 2D/3D (300 DPI) */}
            <div className="no-print">
              <BbtQuickGenerator
                examContent={content?.examContent || ''}
                onUpdateExamContent={(updatedExam) => {
                  setContent((prev) => ({
                    analysis: prev?.analysis || 'Chưa có ma trận phân tích.',
                    examContent: updatedExam,
                    detailedSolution: prev?.detailedSolution || '',
                  }));
                  setStatus(AppStatus.SUCCESS);
                  setActiveTab('exam');
                }}
                solutionContent={content?.detailedSolution || ''}
                onUpdateSolutionContent={(updatedSol) => {
                  setContent((prev) => ({
                    analysis: prev?.analysis || 'Chưa có ma trận phân tích.',
                    examContent: prev?.examContent || '',
                    detailedSolution: updatedSol,
                  }));
                  setStatus(AppStatus.SUCCESS);
                  setActiveTab('solution');
                }}
                defaultOpen={false}
              />
            </div>

            {status === AppStatus.SUCCESS && content ? (
              <div className="card-teal rounded-2xl flex flex-col min-h-[620px] overflow-hidden print-content">
                {/* Tabs & Action Bar */}
                <div className="border-b border-teal-100 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-teal-50/60 dark:bg-slate-900 no-print">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('exam')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'exam'
                          ? 'bg-teal-600 text-white shadow-xs shadow-teal-600/25'
                          : 'text-teal-900/70 dark:text-slate-300 hover:bg-teal-100/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Đề Thi Tương Tự</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('solution')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'solution'
                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/25'
                          : 'text-teal-900/70 dark:text-slate-300 hover:bg-teal-100/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Đáp Án & Lời Giải Chi Tiết</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('analysis')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'analysis'
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'text-teal-900/70 dark:text-slate-300 hover:bg-teal-100/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Ma Trận & Phân Tích Bối Cảnh</span>
                    </button>
                  </div>

                  {/* Export & Edit Tools */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingMarkdown(!isEditingMarkdown)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                        isEditingMarkdown
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-white dark:bg-slate-800 border-teal-200 dark:border-slate-700 text-teal-800 dark:text-slate-200 hover:bg-teal-50'
                      }`}
                      title="Chỉnh sửa trực tiếp nội dung đề thi / lời giải"
                    >
                      {isEditingMarkdown ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem hiển thị</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa nội dung</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleExportWordCurrentTab}
                      disabled={isExportingWord}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 border border-teal-300 dark:border-teal-800 rounded-xl transition-colors cursor-pointer"
                      title="Tải phần đang xem ra file Word (.docx) kèm hình ảnh 300 DPI"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>{isExportingWord ? 'Đang xuất...' : 'Xuất Word (.docx)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportWordFull}
                      disabled={isExportingWord}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
                      title="Tải trọn bộ Đề thi + Lời giải trong 1 file Word (.docx)"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Word Trọn Bộ (Đề + Giải)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-2 text-teal-700 dark:text-slate-300 hover:bg-teal-100/70 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Sao chép nội dung"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="p-2 text-teal-700 dark:text-slate-300 hover:bg-teal-100/70 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="In hoặc Lưu PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                  {/* Tiêu đề trang in */}
                  <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold uppercase">TRƯỜNG THPT TRẦN KỲ PHONG</p>
                        <p className="text-xs italic">Biên soạn: Giáo viên Phan Lâm</p>
                      </div>
                      <div className="text-right">
                        <h1 className="text-lg font-bold uppercase">
                          {activeTab === 'exam'
                            ? 'ĐỀ THI TƯƠNG TỰ CHUẨN GDPT 2018'
                            : activeTab === 'solution'
                              ? 'BẢNG ĐÁP ÁN VÀ LỜI GIẢI CHI TIẾT'
                              : 'MA TRẬN PHÂN TÍCH ĐỀ THI'}
                        </h1>
                      </div>
                    </div>
                  </div>

                  {isEditingMarkdown ? (
                    <div className="space-y-2">
                      <p className="text-xs text-teal-800 dark:text-teal-300 font-medium">
                        💡 Bạn có thể chỉnh sửa trực tiếp văn bản, công thức LaTeX (`$...$`) hoặc khối hình vẽ `figure-json` dưới đây:
                      </p>
                      <textarea
                        rows={24}
                        value={getActiveContent()}
                        onChange={(e) => handleUpdateActiveContent(e.target.value)}
                        className="w-full p-4 text-sm font-mono rounded-xl border border-teal-300 dark:border-slate-700 bg-teal-50/20 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  ) : (
                    <MarkdownResult content={getActiveContent()} />
                  )}
                </div>
              </div>
            ) : (
              /* Empty / Loading State */
              <div className="flex-1 card-teal rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[520px]">
                {status === AppStatus.ANALYZING ? (
                  <div className="max-w-md space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-teal-100 dark:border-slate-800"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-teal-600 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-extrabold text-teal-950 dark:text-white">
                      Đang phân tích cấu trúc & Biên soạn đề tương tự...
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Hệ thống đang bóc tách ma trận đề gốc, <strong>thay đổi số liệu & làm mới bối cảnh thực tế</strong> (Toán / Vật lý THPT GDPT 2018), tính toán lại toàn bộ đáp án và dựng hình ảnh <strong>300 DPI</strong>...
                    </p>
                  </div>
                ) : (
                  <div className="max-w-xl space-y-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-slate-800 dark:to-slate-800 rounded-2xl flex items-center justify-center mx-auto text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-slate-700 shadow-xs">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-teal-950 dark:text-white">
                        Hệ thống Tạo Đề Thi Tương Tự Thông Minh (GDPT 2018)
                      </h3>
                      <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-1">
                        Tác giả: Phan Lâm — Trường THPT Trần Kỳ Phong
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Tải lên đề thi gốc (<strong>PDF, Word .docx, Hình ảnh</strong>) hoặc chọn <strong>Đề mẫu Vật lý / Toán 12</strong> ở cột bên trái để AI tự động phân tích ma trận và sinh đề thi mới tương đương 100% cấu trúc.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                      <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-slate-800/70 border border-teal-200/80 dark:border-slate-700">
                        <div className="text-xs font-bold text-teal-800 dark:text-teal-300 mb-1">
                          🔄 Thay số & Đổi bối cảnh
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Đổi số liệu mới đẹp, chuyển đổi tình huống thực tế hợp lý và giải lại đáp án chính xác 100%.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-slate-800/70 border border-teal-200/80 dark:border-slate-700">
                        <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                          ⚡ Chuẩn Vật lý & Toán THPT
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Tích hợp ngân hàng kiến thức Vật lý & Toán lớp 10, 11, 12 theo chuẩn Công văn 7991.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-slate-800/70 border border-teal-200/80 dark:border-slate-700">
                        <div className="text-xs font-bold text-teal-700 dark:text-teal-300 mb-1">
                          📊 Hình vẽ 300 DPI & Word
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Tự động vẽ Bảng biến thiên, Đồ thị, Hình 2D/3D nét cao và nhúng thẳng vào file Word (.docx).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/90 dark:bg-slate-900 border-t border-teal-200/70 dark:border-slate-800 mt-8 py-5 px-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-teal-950 dark:text-slate-200">
              AI Tạo Đề Thi Tương Tự THPT
            </span>
            <span>•</span>
            <span>
              Tác giả: <strong className="text-teal-700 dark:text-teal-400">Phan Lâm</strong>,{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">Trường THPT Trần Kỳ Phong</strong>
            </span>
          </div>
        </div>
      </footer>

      {/* Unified API Key & Model Modal */}
      <ApiKeyModal
        isOpen={showKeyModal}
        onSave={handleSaveApiConfig}
        onClose={() => setShowKeyModal(false)}
        canClose={Boolean(apiKey)}
      />
    </div>
  );
};

export default App;
