import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, Check, AlertCircle, Cpu, ShieldCheck, X } from 'lucide-react';
import {
  GEMINI_MODELS,
  AGENT_PLATFORM_MODELS,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_AGENT_PLATFORM_MODEL,
  isValidGoogleAiApiKey,
} from '../constants';
import {
  ApiProvider,
  getApiProvider,
  setApiProvider,
  getStoredApiKey,
  setStoredApiKey,
  getSelectedModel,
  setSelectedModel,
} from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (provider: ApiProvider, apiKey: string, modelId: string) => void;
  onClose?: () => void;
  canClose: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, canClose }) => {
  const [provider, setProviderState] = useState<ApiProvider>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [agentPlatformKey, setAgentPlatformKey] = useState('');
  const [geminiModel, setGeminiModel] = useState<string>(DEFAULT_GEMINI_MODEL);
  const [agentPlatformModel, setAgentPlatformModel] = useState<string>(DEFAULT_AGENT_PLATFORM_MODEL);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentProvider = getApiProvider();
      setProviderState(currentProvider);
      setGeminiKey(getStoredApiKey('gemini'));
      setAgentPlatformKey(getStoredApiKey('agent_platform'));
      setGeminiModel(getSelectedModel('gemini'));
      setAgentPlatformModel(getSelectedModel('agent_platform'));
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeKey = provider === 'agent_platform' ? agentPlatformKey : geminiKey;
  const activeModel = provider === 'agent_platform' ? agentPlatformModel : geminiModel;
  const modelList = provider === 'agent_platform' ? AGENT_PLATFORM_MODELS : GEMINI_MODELS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = activeKey.trim();

    if (!trimmedKey) {
      setError(
        provider === 'agent_platform'
          ? 'Vui lòng nhập Agent Platform API Key để tiếp tục.'
          : 'Vui lòng nhập Google Gemini API Key để tiếp tục.'
      );
      return;
    }

    if (!isValidGoogleAiApiKey(trimmedKey)) {
      setError('API Key không đúng định dạng (Key hợp lệ bắt đầu bằng AIzaSy... hoặc AQ...).');
      return;
    }

    // Lưu cấu hình cho cả 2 nguồn nếu người dùng có nhập
    if (geminiKey.trim()) setStoredApiKey(geminiKey.trim(), 'gemini');
    if (agentPlatformKey.trim()) setStoredApiKey(agentPlatformKey.trim(), 'agent_platform');
    setSelectedModel(geminiModel, 'gemini');
    setSelectedModel(agentPlatformModel, 'agent_platform');
    setApiProvider(provider);

    onSave(provider, trimmedKey, activeModel);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Cấu hình Nguồn API & Model AI</h3>
              <p className="text-indigo-100 text-xs">
                Hỗ trợ Google Gemini API (3.8 Flash) & Agent Platform API
              </p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Chọn nguồn API */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Chọn nguồn kết nối AI
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setProviderState('gemini');
                  setError('');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  provider === 'gemini'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Google Gemini API
                  </span>
                  {provider === 'gemini' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  AI Studio (Gemini 3.8 Flash)
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProviderState('agent_platform');
                  setError('');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  provider === 'agent_platform'
                    ? 'border-teal-600 bg-teal-50/80 dark:bg-teal-950/50 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Agent Platform API
                  </span>
                  {provider === 'agent_platform' && (
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Vertex AI Express (AQ... / AIzaSy...)
                </p>
              </button>
            </div>
          </div>

          {/* Ô nhập API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="api-key-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                2. Nhập {provider === 'agent_platform' ? 'Agent Platform Key' : 'Gemini API Key'}
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>Lấy Key miễn phí</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              id="api-key-input"
              type="password"
              value={activeKey}
              onChange={(e) => {
                if (provider === 'agent_platform') {
                  setAgentPlatformKey(e.target.value);
                } else {
                  setGeminiKey(e.target.value);
                }
                setError('');
              }}
              placeholder="Nhập API Key (bắt đầu bằng AIzaSy... hoặc AQ...)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs mt-2 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Chọn Model */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>3. Chọn Model AI ưu tiên (Tự động xoay vòng dự phòng khi quá tải)</span>
            </label>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {modelList.map((m) => {
                const isSelected = activeModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (provider === 'agent_platform') {
                        setAgentPlatformModel(m.id);
                      } else {
                        setGeminiModel(m.id);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {m.name}
                        </span>
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {m.id}
                        </code>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {m.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">
                        ✓ Đang chọn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              API Key được lưu trữ an toàn trực tiếp trên trình duyệt của bạn (LocalStorage). Khi model chính bận (503), hệ thống sẽ tự động chuyển tiếp qua chuỗi model dự phòng.
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors cursor-pointer"
              >
                Đóng
              </button>
            )}
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu cấu hình & Sử dụng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;
