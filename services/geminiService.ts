import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  SYSTEM_INSTRUCTION,
  DEFAULT_GEMINI_MODEL,
  FALLBACK_GEMINI_MODELS,
  DEFAULT_AGENT_PLATFORM_MODEL,
  AGENT_PLATFORM_FALLBACK_MODELS,
  isValidGoogleAiApiKey,
} from '../constants';
import { GeneratedContent, GenerationOptions, FileData } from '../types';
import { sanitizeAndValidateFigureSpec } from './figureEngine';

function sanitizeFigureBlocksInMarkdown(md: string): string {
  if (!md) return '';
  return md.replace(/```figure-json\s*([\s\S]*?)```/gi, (full, jsonBody, offset) => {
    try {
      const before = md.slice(Math.max(0, Number(offset) - 600), Number(offset));
      const parsed = JSON.parse(String(jsonBody).trim());
      const fixed = sanitizeAndValidateFigureSpec(parsed, before);
      if (!fixed) return '';
      return `\`\`\`figure-json\n${JSON.stringify(fixed)}\n\`\`\``;
    } catch {
      return full;
    }
  });
}

export type ApiProvider = 'gemini' | 'agent_platform';

export const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
export const AGENT_PLATFORM_KEY_STORAGE = 'agent_platform_api_key';
export const API_PROVIDER_STORAGE_KEY = 'ai_api_provider';
export const GEMINI_MODEL_STORAGE_KEY = 'gemini_model_id_v38';
export const AGENT_PLATFORM_MODEL_STORAGE_KEY = 'agent_platform_model_id';

const LEGACY_MODEL_KEYS = ['gemini_model_id', 'GEMINI_SELECTED_MODEL', 'GEMINI_MODEL_ID'];

// ── Hệ thống thông báo Fallback (Pub/Sub cho UI Banner) ───────────────────────
type FallbackListener = (notice: string | null) => void;
const fallbackListeners = new Set<FallbackListener>();

export function onFallbackNoticeChange(listener: FallbackListener): () => void {
  fallbackListeners.add(listener);
  return () => {
    fallbackListeners.delete(listener);
  };
}

export function setFallbackNotice(notice: string | null): void {
  fallbackListeners.forEach((fn) => fn(notice));
}

// ── Quản lý Provider, API Key & Model trong localStorage ─────────────────────
export function getApiProvider(): ApiProvider {
  if (typeof window === 'undefined') return 'gemini';
  const saved = localStorage.getItem(API_PROVIDER_STORAGE_KEY);
  return saved === 'agent_platform' ? 'agent_platform' : 'gemini';
}

export function setApiProvider(provider: ApiProvider): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_PROVIDER_STORAGE_KEY, provider);
}

export function getStoredApiKey(provider: ApiProvider = getApiProvider()): string {
  if (typeof window === 'undefined') return '';
  if (provider === 'agent_platform') {
    return (localStorage.getItem(AGENT_PLATFORM_KEY_STORAGE) || '').trim();
  }
  // Tự động kế thừa key cũ 'GEMINI_API_KEY' nếu có
  const current = (localStorage.getItem(GEMINI_API_KEY_STORAGE) || '').trim();
  if (current) return current;
  const legacyKey = (localStorage.getItem('GEMINI_API_KEY') || '').trim();
  if (legacyKey) {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, legacyKey);
    localStorage.removeItem('GEMINI_API_KEY');
    return legacyKey;
  }
  return '';
}

export function setStoredApiKey(key: string, provider: ApiProvider = getApiProvider()): void {
  if (typeof window === 'undefined') return;
  const trimmed = key.trim();
  if (provider === 'agent_platform') {
    localStorage.setItem(AGENT_PLATFORM_KEY_STORAGE, trimmed);
  } else {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, trimmed);
  }
}

export function getSelectedModel(provider: ApiProvider = getApiProvider()): string {
  if (typeof window === 'undefined') {
    return provider === 'agent_platform' ? DEFAULT_AGENT_PLATFORM_MODEL : DEFAULT_GEMINI_MODEL;
  }
  // Xoá các key model thế hệ cũ để tự động nâng cấp lên gemini-3.8-flash
  LEGACY_MODEL_KEYS.forEach((k) => localStorage.removeItem(k));

  if (provider === 'agent_platform') {
    const saved = localStorage.getItem(AGENT_PLATFORM_MODEL_STORAGE_KEY);
    if (saved && AGENT_PLATFORM_FALLBACK_MODELS.includes(saved)) {
      return saved;
    }
    localStorage.setItem(AGENT_PLATFORM_MODEL_STORAGE_KEY, DEFAULT_AGENT_PLATFORM_MODEL);
    return DEFAULT_AGENT_PLATFORM_MODEL;
  }

  const saved = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  if (saved && FALLBACK_GEMINI_MODELS.includes(saved)) {
    return saved;
  }
  localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, DEFAULT_GEMINI_MODEL);
  return DEFAULT_GEMINI_MODEL;
}

export function setSelectedModel(modelId: string, provider: ApiProvider = getApiProvider()): void {
  if (typeof window === 'undefined') return;
  if (provider === 'agent_platform') {
    localStorage.setItem(AGENT_PLATFORM_MODEL_STORAGE_KEY, modelId);
  } else {
    localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, modelId);
  }
}

export function getActiveContext(overrideApiKey?: string, overrideModelId?: string) {
  const provider = getApiProvider();
  const apiKey = (overrideApiKey || getStoredApiKey(provider)).trim();
  const model = overrideModelId || getSelectedModel(provider);
  const fallbackPool =
    provider === 'agent_platform' ? AGENT_PLATFORM_FALLBACK_MODELS : FALLBACK_GEMINI_MODELS;

  const fallbackChain = [model, ...fallbackPool.filter((m) => m !== model)];
  return { provider, apiKey, model, fallbackChain };
}

export function createGoogleAiClient(provider: ApiProvider, apiKey: string): GoogleGenAI {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error(
      provider === 'agent_platform'
        ? 'Vui lòng nhập Agent Platform API Key trong phần Cấu hình API.'
        : 'Vui lòng nhập Google Gemini API Key trong phần Cấu hình API.'
    );
  }
  if (!isValidGoogleAiApiKey(trimmedKey)) {
    throw new Error(
      'Định dạng API Key không hợp lệ (Key chuẩn bắt đầu bằng AIzaSy... hoặc AQ...). Vui lòng kiểm tra lại.'
    );
  }
  if (provider === 'agent_platform') {
    return new GoogleGenAI({ vertexai: true, apiKey: trimmedKey });
  }
  return new GoogleGenAI({ apiKey: trimmedKey });
}

export function createGeminiConfig(
  modelId: string,
  extraConfig: Record<string, any> = {},
  level: ThinkingLevel = ThinkingLevel.MEDIUM
): Record<string, any> {
  const isGemini3 = modelId.startsWith('gemini-3');
  if (isGemini3) {
    const { temperature, topP, topK, ...safeExtra } = extraConfig;
    return {
      ...safeExtra,
      thinkingConfig: { thinkingLevel: level },
    };
  }
  return {
    ...extraConfig,
  };
}

// ── Phân loại lỗi API chuẩn xác (503 vs 429 vs 401/403) ──────────────────────
export function isFallbackEligibleError(error: any): boolean {
  const msg = String(error?.message || error || '').toLowerCase();
  const status = error?.status || error?.code || error?.error?.code;
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    status === 404 ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('not found') ||
    msg.includes('502') ||
    msg.includes('504') ||
    msg.includes('fetch failed') ||
    msg.includes('network')
  );
}

export function parseApiError(error: any): string {
  const raw = String(error?.message || error || '');
  const lower = raw.toLowerCase();

  if (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('overloaded') ||
    lower.includes('high demand')
  ) {
    return 'Máy chủ AI hiện đang quá tải tạm thời (503). Hệ thống đã thử xoay vòng các model dự phòng nhưng đều bận — bạn vui lòng đợi 10–20 giây rồi nhấn "Tạo Đề Tương Tự" lại nhé!';
  }

  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return 'API Key hiện tại đã chạm giới hạn tần suất hoặc hết hạn mức (429 Quota Exceeded). Vui lòng đợi khoảng 1 phút hoặc đổi sang API Key khác trong phần Cấu hình.';
  }

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('unauthenticated') ||
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('permission_denied')
  ) {
    return 'API Key không hợp lệ hoặc không có quyền truy cập (401/403). Vui lòng mở "Cấu hình API" để kiểm tra lại Key (bắt đầu bằng AIzaSy... hoặc AQ...).';
  }

  return raw || 'Đã xảy ra lỗi không xác định khi kết nối tới AI.';
}

// ── Hàm gọi AI có tự động Fallback Model & thông báo trạng thái ──────────────
async function callWithModelFallback<T>(
  taskFn: (ai: GoogleGenAI, modelId: string) => Promise<T>,
  overrideApiKey?: string,
  overrideModelId?: string
): Promise<T> {
  const { provider, apiKey, fallbackChain } = getActiveContext(overrideApiKey, overrideModelId);
  const ai = createGoogleAiClient(provider, apiKey);

  let lastError: any = null;

  try {
    for (let i = 0; i < fallbackChain.length; i++) {
      const currentModel = fallbackChain[i];
      try {
        const result = await taskFn(ai, currentModel);
        return result;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Fallback] Model ${currentModel} gặp lỗi:`, err?.message || err);

        const canFallback = isFallbackEligibleError(err) && i < fallbackChain.length - 1;
        if (!canFallback) {
          throw err;
        }

        const nextModel = fallbackChain[i + 1];
        setFallbackNotice(
          `Đang tự động chuyển từ ${currentModel} sang ${nextModel} (do ${currentModel} đang bận)...`
        );
      }
    }
    throw lastError;
  } finally {
    setFallbackNotice(null);
  }
}

// ── Hàm chính: Phân tích Đề Gốc & Sinh Đề Thi Tương Tự ───────────────────────
export const generateSimilarExam = async (
  fileData: FileData,
  options: GenerationOptions,
  overrideApiKey?: string,
  overrideModelId?: string
): Promise<GeneratedContent> => {
  // 1. Xây dựng chỉ dẫn theo môn học
  let subjectInstruction = '';
  switch (options.subjectMode) {
    case 'physics':
      subjectInstruction = `
- **MÔN HỌC CHỈ ĐỊNH: VẬT LÝ THPT (Chương trình GDPT 2018)**.
- Áp dụng nghiêm ngặt hệ thống ký hiệu Vật lý, đơn vị chuẩn SI, các hằng số vật lý chuẩn và kiểm tra tính hợp lý thực tế của mọi đại lượng sau khi thay số.
- Đặc biệt chú trọng thay đổi bối cảnh thí nghiệm / hiện tượng thực tiễn (Vật lý nhiệt, Khí lý tưởng, Từ trường - Cảm ứng điện từ, Hạt nhân, Dao động, Sóng, Điện) sao cho sinh động, chuẩn xác khoa học và tương đương độ khó với đề gốc.`;
      break;
    case 'math':
      subjectInstruction = `
- **MÔN HỌC CHỈ ĐỊNH: TOÁN HỌC THPT (Chương trình GDPT 2018)**.
- Kiểm tra chặt chẽ điều kiện xác định, đạo hàm, cực trị, tiệm cận, toạ độ Oxyz, xác suất và tính toán lại chính xác 100% các phương án sau khi thay đổi hàm số/số liệu và bối cảnh thực tế.`;
      break;
    case 'chemistry':
      subjectInstruction = `
- **MÔN HỌC CHỈ ĐỊNH: HOÁ HỌC THPT (Chương trình GDPT 2018)**.
- Sử dụng danh pháp IUPAC chuẩn GDPT 2018 (ví dụ: iron, copper, sodium, potassium, ester, carboxylic acid...), bảo toàn nguyên tố, bảo toàn electron và khối lượng chính xác.`;
      break;
    default:
      subjectInstruction = `
- **TỰ ĐỘNG NHẬN DIỆN MÔN HỌC** từ đề gốc (ưu tiên Toán THPT và Vật lý THPT theo Chương trình GDPT 2018). Nếu đề gốc là Vật lý, áp dụng đầy đủ chuẩn kiến thức Vật lý THPT; nếu là Toán học, áp dụng chuẩn kiến thức Toán THPT.`;
      break;
  }

  // 2. Xây dựng chỉ dẫn khối lớp
  let gradeInstruction = '';
  if (options.gradeLevel && options.gradeLevel !== 'auto') {
    const gradeLabel =
      options.gradeLevel === 'thpt_qg'
        ? 'Kỳ thi Tốt nghiệp THPT Quốc gia (theo cấu trúc mới Công văn 7991)'
        : `Lớp ${options.gradeLevel} THPT (GDPT 2018)`;
    gradeInstruction = `- **KHỐI LỚP / KỲ THI MỤC TIÊU**: ${gradeLabel}. Đảm bảo kiến thức nằm đúng trong phạm vi chương trình ${gradeLabel}.`;
  }

  // 3. Xây dựng chỉ dẫn mức độ Thay số & Thay đổi bối cảnh
  let variationInstruction = '';
  switch (options.contextVariation) {
    case 'numbers_only':
      variationInstruction = `
- **CHẾ ĐỘ BIẾN ĐỔI: THAY SỐ LIỆU & GIỮ NGUYÊN BỐI CẢNH**:
  + Giữ nguyên mô hình/tình huống của từng câu trong đề gốc nhưng **BẮT BUỘC thay đổi toàn bộ số liệu, hàm số, tham số** để tạo thành câu hỏi mới.
  + Tính toán lại toàn bộ đáp án A, B, C, D, các mệnh đề Đúng/Sai a, b, c, d và đáp số trả lời ngắn theo bộ số mới.`;
      break;
    case 'moderate':
      variationInstruction = `
- **CHẾ ĐỘ BIẾN ĐỔI: THAY SỐ LIỆU & LÀM MỚI BỐI CẢNH VỪA PHẢI**:
  + **Bắt buộc thay đổi toàn bộ số liệu** và điều chỉnh đối tượng/ngữ cảnh trong các bài toán thực tế hoặc thí nghiệm để đề mới tự nhiên, không trùng lặp nguyên xi câu chữ của đề gốc.`;
      break;
    case 'creative':
    default:
      variationInstruction = `
- **CHẾ ĐỘ BIẾN ĐỔI: THAY SỐ LIỆU + ĐỔI BỐI CẢNH SÁNG TẠO & HỢP LÝ (MẶC ĐỊNH KHUYÊN DÙNG)**:
  + **BẮT BUỘC THAY ĐỔI SỐ LIỆU**: Thay đổi toàn bộ hàm số, số đo, đại lượng vật lý/toán học sao cho kết quả hợp lý, có ý nghĩa thực tế.
  + **BẮT BUỘC ĐỔI BỐI CẢNH (CONTEXT / SCENARIO)**: Đối với mọi câu hỏi có gắn với thực tiễn, thí nghiệm, mô hình vật lý hoặc bài toán có lời văn, hãy **chuyển đổi sang một bối cảnh/tình huống mới hợp lý** nhưng **giữ nguyên bản chất định luật vật lý / phương pháp giải toán và mức độ tư duy** của câu gốc.
  + Ghi rõ trong phần Phân tích: câu gốc hỏi bối cảnh gì $\\rightarrow$ câu tương tự đã đổi sang bối cảnh gì và thay số ra sao.`;
      break;
  }

  // 4. Chỉ dẫn hình vẽ (figure-json 300 DPI)
  const diagramInstruction =
    options.diagramMode === 'detailed'
      ? `
- **CHẾ ĐỘ HÌNH VẼ & BẢNG BIẾN THIÊN (TỐI ĐA TRỰC QUAN - 300 DPI)**:
  + Bắt buộc tái tạo đầy đủ mọi Bảng biến thiên (\`"type": "bbt"\`), Đồ thị hàm số (\`"type": "graph"\`), Hình học phẳng 2D (\`"type": "geo2d"\`) và Hình học không gian 3D (\`"type": "geo3d"\`) có trong Đề thi bằng khối mã \`\`\`figure-json chuẩn xác (đã cập nhật theo hàm số và số liệu mới của đề tương tự!).
  + Trong phần **Lời giải chi tiết**, hãy chủ động bổ sung thêm các khối \`\`\`figure-json (Bảng biến thiên, Đồ thị minh hoạ nghiệm, Hình chóp/lăng trụ 3D, Hình phẳng 2D) cho những câu khảo sát hàm số hoặc hình học để học sinh dễ hình dung nhất.`
      : `
- **CHẾ ĐỘ HÌNH VẼ & BẢNG BIẾN THIÊN (TIÊU CHUẨN - 300 DPI)**:
  + Câu hỏi nào trong đề gốc có Bảng biến thiên, Đồ thị hoặc Hình vẽ thì trong Đề tương tự cũng PHẢI có khối mã \`\`\`figure-json tương ứng (cập nhật khớp 100% với hàm số/tọa độ mới của câu tương tự).`;

  // 5. Chỉ dẫn độ chi tiết lời giải
  let solutionInstruction = '';
  switch (options.solutionMode) {
    case 'concise':
      solutionInstruction = `
- **CHẾ ĐỘ LỜI GIẢI: NGẮN GỌN, TRỌNG TÂM**:
  + Lập Bảng đáp án tổng hợp ở đầu phần lời giải.
  + Trình bày các bước biến đổi và công thức cốt lõi dẫn tới đáp số nhanh gọn, rõ ràng.`;
      break;
    case 'very_detailed':
      solutionInstruction = `
- **CHẾ ĐỘ LỜI GIẢI: SIÊU CHI TIẾT (SƯ PHẠM CHUYÊN SÂU)**:
  + Lập Bảng đáp án tổng hợp đầy đủ ở đầu phần lời giải.
  + Giải thích cặn kẽ từng bước biến đổi, nhắc lại định lý/công thức Vật lý hoặc Toán học áp dụng, đổi đơn vị rõ ràng.
  + Với câu Đúng/Sai (Phần II), giải thích chi tiết từng mệnh đề a), b), c), d) vì sao Đúng, vì sao Sai.
  + Nêu thêm **Phương pháp giải nhanh / Bấm máy tính Casio** (nếu có) và **Sai lầm thường gặp** để học sinh tránh bẫy.`;
      break;
    case 'detailed':
    default:
      solutionInstruction = `
- **CHẾ ĐỘ LỜI GIẢI: CHI TIẾT TIÊU CHUẨN**:
  + Lập Bảng đáp án tổng hợp đầy đủ ở đầu phần lời giải.
  + Trình bày lời giải rõ ràng từng bước, đầy đủ công thức, thay số và kết luận đáp án cho mọi câu hỏi (bao gồm giải thích cả 4 ý a, b, c, d ở Phần II).`;
      break;
  }

  const customNotePrompt = options.customInstructions?.trim()
    ? `\n- **YÊU CẦU BỔ SUNG TỪ GIÁO VIÊN**: ${options.customInstructions.trim()}`
    : '';

  const promptText = `
Hãy đọc thật kỹ đề thi gốc được đính kèm và thực hiện nhiệm vụ tạo **ĐỀ THI TƯƠNG TỰ** chất lượng cao (Biên soạn: **Phan Lâm — Trường THPT Trần Kỳ Phong**):

YÊU CẦU CẤU HÌNH:
${subjectInstruction}
${gradeInstruction}
${variationInstruction}
${diagramInstruction}
${solutionInstruction}${customNotePrompt}

LƯU Ý QUAN TRỌNG VỀ TÍNH CHÍNH XÁC:
1. Đề tương tự phải có ĐẦY ĐỦ 100% số câu như đề gốc, không được bỏ sót hay tóm tắt câu nào.
2. Mọi câu hỏi đều phải được **thay số mới** và **thay đổi bối cảnh hợp lý** (đối với bài toán thực tế/vật lý), sau đó **tính toán lại đáp án từ đầu** để đảm bảo phương án đúng trong bảng đáp án và 4 lựa chọn A, B, C, D khớp nhau tuyệt đối.
3. Khi vẽ Bảng biến thiên, Đồ thị hàm số, Hình phẳng 2D hoặc Hình không gian 3D, bắt buộc sử dụng khối \`\`\`figure-json theo đúng hướng dẫn hệ thống (tuyệt đối không dùng bảng Markdown hay ASCII art cho Bảng biến thiên).
4. Tuân thủ nghiêm ngặt 3 thẻ phân tách:
   ---PHAN_TICH_BAT_DAU---
   ---DE_THI_BAT_DAU---
   ---LOI_GIAI_BAT_DAU---
`;

  return callWithModelFallback(
    async (ai, modelId) => {
      const parts: any[] = [];

      if (fileData.extractedText && fileData.extractedText.trim()) {
        parts.push({
          text: `NỘI DUNG ĐỀ THI GỐC (Trích xuất từ file ${fileData.name}):\n\n${fileData.extractedText}\n\n========================================\n\n${promptText}`,
        });
      } else {
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.base64,
          },
        });
        parts.push({
          text: promptText,
        });
      }

      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: createGeminiConfig(
          modelId,
          { systemInstruction: SYSTEM_INSTRUCTION },
          ThinkingLevel.MEDIUM
        ),
      });

      const fullText = response.text || '';
      if (!fullText.trim()) {
        throw new Error('Model không trả về nội dung. Vui lòng thử lại.');
      }

      return parseResponse(fullText);
    },
    overrideApiKey,
    overrideModelId
  );
};

const parseResponse = (text: string): GeneratedContent => {
  const analysisMarker = '---PHAN_TICH_BAT_DAU---';
  const examMarker = '---DE_THI_BAT_DAU---';
  const solutionMarker = '---LOI_GIAI_BAT_DAU---';

  let analysis = '';
  let examContent = '';
  let detailedSolution = '';

  const analysisStart = text.indexOf(analysisMarker);
  const examStart = text.indexOf(examMarker);
  const solutionStart = text.indexOf(solutionMarker);

  if (analysisStart !== -1 && examStart !== -1 && solutionStart !== -1) {
    analysis = text.substring(analysisStart + analysisMarker.length, examStart).trim();
    examContent = text.substring(examStart + examMarker.length, solutionStart).trim();
    detailedSolution = text.substring(solutionStart + solutionMarker.length).trim();
  } else if (examStart !== -1 && solutionStart !== -1) {
    analysis = text.substring(0, examStart).replace(analysisMarker, '').trim();
    examContent = text.substring(examStart + examMarker.length, solutionStart).trim();
    detailedSolution = text.substring(solutionStart + solutionMarker.length).trim();
  } else {
    analysis = 'Đã hoàn tất phân tích và tạo đề thi tương tự.';
    examContent = text;
    detailedSolution = 'Lời giải chi tiết đã được tích hợp ở phần trên.';
  }

  // Tự động kiểm tra và chuẩn hoá các khối figure-json (BBT, Đồ thị, Hình 2D/3D)
  examContent = sanitizeFigureBlocksInMarkdown(examContent);
  detailedSolution = sanitizeFigureBlocksInMarkdown(detailedSolution);

  return {
    analysis,
    examContent,
    detailedSolution,
  };
};
