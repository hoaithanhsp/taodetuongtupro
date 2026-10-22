# AI_INSTRUCTIONS.md — Chuẩn kỹ thuật cho AI Tạo Đề Thi Tương Tự THPT

> **Tác giả**: Phan Lâm — Trường THPT Trần Kỳ Phong  
> **Phiên bản chuẩn**: API v4.2 (`gemini-3.8-flash` + Agent Platform API + 300 DPI Figure Engine)

---

## 1. Model AI & Cơ chế Fallback
- **Google Gemini API (`@google/genai`)**:
  - Model mặc định: `gemini-3.8-flash` (localStorage key: `gemini_model_id_v38`)
  - Chuỗi fallback tự động: `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.5-flash-lite` → `gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-3.1-flash-lite` → `gemini-2.5-flash`
- **Agent Platform API (`vertexai: true`)**:
  - Model mặc định: `gemini-2.5-flash` (localStorage key: `agent_platform_model_id`)
  - Chuỗi fallback tự động: `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2.5-pro` → `gemini-3.1-pro-preview`
- **Cấu hình Gemini 3**: Không truyền `temperature`, `topP`, `topK` cho các model `gemini-3*`, sử dụng `thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM }`.

## 2. Bộ máy vẽ Hình học & Bảng biến thiên 300 DPI (`services/engine/`)
- `bbt.js`: Vẽ Bảng biến thiên tự động từ biểu thức hàm số `fn` (tự tính tập xác định, đạo hàm $y'$, cực trị, tiệm cận đứng/ngang).
- `graph.js`: Vẽ Đồ thị hàm số $y = f(x)$, miền phẳng tích phân, khối tròn xoay.
- `geo2d.js`: Vẽ Hình học phẳng 2D & Vector lực Vật lý.
- `geo3d.js`: Vẽ Hình học không gian 3D (hình chóp, lăng trụ, hình hộp, nón, trụ, cầu, chóp cụt) với nét đứt/liền tự động.
- `export.js` & `exportUtils.ts`: Chuyển đổi SVG sang ảnh PNG 300 DPI nhúng trực tiếp vào file Word (`.docx`) và giữ nguyên công thức LaTeX.
