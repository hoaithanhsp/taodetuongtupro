import React, { useCallback, useState } from 'react';
import { FileData } from '../types';
import { Upload, FileText, Image as ImageIcon, X, Sparkles, ClipboardPaste, CheckCircle2 } from 'lucide-react';
import { parseDocxWithMath } from '../services/docxMathParser';

interface FileUploadProps {
  onFileSelect: (fileData: FileData | null) => void;
  selectedFile: FileData | null;
  disabled: boolean;
}

const SAMPLE_EXAMS = [
  {
    id: 'sample-physics-12',
    title: '⚡ Đề mẫu Vật lý 12 (GDPT 2018 - CV 7991)',
    name: 'De_Mau_Vat_Ly_12_GDPT2018.docx',
    content: `ĐỀ KIỂM TRA ĐỊNH KỲ MÔN VẬT LÝ 12 — CHƯƠNG TRÌNH GDPT 2018

PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.
Câu 1. Một lượng khí lý tưởng xác định có thể tích $V_1 = 6\\text{ lít}$ ở áp suất $p_1 = 1{,}5\\text{ atm}$. Nếu nén đẳng nhiệt lượng khí này đến khi áp suất đạt $p_2 = 4{,}5\\text{ atm}$ thì thể tích của khí là bao nhiêu?
A. $2{,}0\\text{ lít}$.
B. $3{,}0\\text{ lít}$.
C. $1{,}5\\text{ lít}$.
D. $4{,}0\\text{ lít}$.

Câu 2. Đổ $1{,}5\\text{ kg}$ nước ở nhiệt độ $20^\\circ\\text{C}$ vào ấm điện có công suất $1500\\text{ W}$. Biết nhiệt dung riêng của nước là $c = 4200\\text{ J/(kg}\\cdot\\text{K)}$ và hiệu suất của ấm là $84\\%$. Thời gian cần thiết để đun sôi lượng nước trên (ở $100^\\circ\\text{C}$) là:
A. $400\\text{ s}$.
B. $336\\text{ s}$.
C. $500\\text{ s}$.
D. $280\\text{ s}$.

Câu 3. Một đoạn dây dẫn thẳng dài $l = 0{,}4\\text{ m}$ mang dòng điện $I = 5\\text{ A}$ đặt trong từ trường đều có cảm ứng từ $B = 0{,}2\\text{ T}$. Góc hợp bởi dây dẫn và vectơ cảm ứng từ là $30^\\circ$. Độ lớn lực từ tác dụng lên đoạn dây dẫn là:
A. $0{,}2\\text{ N}$.
B. $0{,}4\\text{ N}$.
C. $0{,}35\\text{ N}$.
D. $0{,}1\\text{ N}$.

Câu 4. Đồng vị phóng xạ Polonium $\\text{}^{210}_{84}\\text{Po}$ có chu kỳ bán rã $T = 138\\text{ ngày}$. Ban đầu có một mẫu $\\text{}^{210}_{84}\\text{Po}$ nguyên chất khối lượng $m_0 = 80\\text{ mg}$. Khối lượng $\\text{}^{210}_{84}\\text{Po}$ còn lại sau $276\\text{ ngày}$ là:
A. $20\\text{ mg}$.
B. $40\\text{ mg}$.
C. $60\\text{ mg}$.
D. $10\\text{ mg}$.

PHẦN II. Câu trắc nghiệm đúng sai.
Câu 5. Một xi-lanh kín có pit-tông di chuyển không ma sát chứa $0{,}5\\text{ mol}$ khí Helium (coi là khí lý tưởng) ở nhiệt độ $t_1 = 27^\\circ\\text{C}$ và áp suất $p_1 = 1{,}2 \\cdot 10^5\\text{ Pa}$. Người ta nung nóng đẳng áp khối khí đến nhiệt độ $t_2 = 127^\\circ\\text{C}$. Cho $R = 8{,}31\\text{ J/(mol}\\cdot\\text{K)}$.
a) Nhiệt độ tuyệt đối ban đầu của khối khí là $T_1 = 300\\text{ K}$.
b) Thể tích ban đầu của khối khí xấp xỉ bằng $10{,}39\\text{ lít}$.
c) Thể tích của khối khí ở trạng thái sau là $15{,}25\\text{ lít}$.
d) Công mà khối khí thực hiện được trong quá trình đẳng áp trên là $415{,}5\\text{ J}$.

PHẦN III. Câu trắc nghiệm trả lời ngắn.
Câu 6. Một khung dây dẫn phẳng gồm $N = 200$ vòng dây, diện tích mỗi vòng là $S = 50\\text{ cm}^2$, đặt trong từ trường đều có vectơ cảm ứng từ vuông góc với mặt phẳng khung dây. Trong khoảng thời gian $\\Delta t = 0{,}05\\text{ s}$, độ lớn cảm ứng từ giảm đều từ $0{,}6\\text{ T}$ về $0{,}1\\text{ T}$. Độ lớn suất điện động cảm ứng xuất hiện trong khung dây bằng bao nhiêu Vôn (V)?`,
  },
  {
    id: 'sample-math-12',
    title: '📐 Đề mẫu Toán 12 (Khảo sát hàm số, Oxyz & Hình 3D)',
    name: 'De_Mau_Toan_12_GDPT2018.docx',
    content: `ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN 12 — CHƯƠNG TRÌNH GDPT 2018

PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.
Câu 1. Cho hàm số $y = x^3 - 3x + 2$. Hàm số đã cho nghịch biến trên khoảng nào dưới đây?
A. $(-1; 1)$.
B. $(-\\infty; -1)$.
C. $(1; +\\infty)$.
D. $(0; 2)$.

Câu 2. Đường tiệm cận ngang của đồ thị hàm số $y = \\frac{2x + 1}{x - 1}$ có phương trình là:
A. $y = 2$.
B. $x = 1$.
C. $y = -1$.
D. $x = 2$.

Câu 3. Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, cạnh bên $SA$ vuông góc với mặt phẳng đáy và $SA = a\\sqrt{3}$. Thể tích của khối chóp $S.ABCD$ bằng:
A. $\\frac{a^3\\sqrt{3}}{3}$.
B. $a^3\\sqrt{3}$.
C. $\\frac{a^3\\sqrt{3}}{6}$.
D. $\\frac{a^3}{3}$.

PHẦN II. Câu trắc nghiệm đúng sai.
Câu 4. Một vật chuyển động thẳng với vận tốc $v(t) = 12t - 3t^2\\text{ (m/s)}$, trong đó $t$ là thời gian tính bằng giây kể từ lúc vật bắt đầu chuyển động ($0 \\le t \\le 4$).
a) Gia tốc của vật tại thời điểm $t = 1\\text{ s}$ là $a(1) = 6\\text{ m/s}^2$.
b) Vận tốc lớn nhất của vật trong khoảng thời gian từ $t = 0$ đến $t = 4\\text{ s}$ là $12\\text{ m/s}$.
c) Vật dừng lại tại thời điểm $t = 3\\text{ s}$.
d) Quãng đường vật đi được từ lúc bắt đầu chuyển động đến khi dừng hẳn là $32\\text{ m}$.

PHẦN III. Câu trắc nghiệm trả lời ngắn.
Câu 5. Một cơ sở sản xuất muốn làm các thùng chứa hình trụ không có nắp có thể tích bằng $8\\pi\\text{ m}^3$. Để diện tích vật liệu làm thùng (diện tích đáy cộng diện tích xung quanh) là nhỏ nhất thì bán kính đáy của thùng phải bằng bao nhiêu mét?`,
  },
];

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, disabled }) => {
  const [inputTab, setInputTab] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [isParsingDocx, setIsParsingDocx] = useState(false);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileNameLower = file.name.toLowerCase();
      const isDocx =
        fileNameLower.endsWith('.docx') ||
        fileNameLower.endsWith('.doc') ||
        file.type.includes('wordprocessingml') ||
        file.type === 'application/msword';

      if (isDocx) {
        setIsParsingDocx(true);
        try {
          const arrayBuffer = await file.arrayBuffer();
          const parsed = await parseDocxWithMath(arrayBuffer);
          onFileSelect({
            base64: '',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            name: file.name,
            extractedText: parsed.text,
          });
        } catch (err: any) {
          alert(err?.message || 'Không thể đọc file Word. Vui lòng thử lại với file .docx hoặc .pdf.');
        } finally {
          setIsParsingDocx(false);
        }
        return;
      }

      if (fileNameLower.endsWith('.txt') || file.type === 'text/plain') {
        const text = await file.text();
        onFileSelect({
          base64: '',
          mimeType: 'text/plain',
          name: file.name,
          extractedText: text,
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        onFileSelect({
          base64: base64Content,
          mimeType: file.type || 'application/pdf',
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    },
    [onFileSelect]
  );

  const handleApplyPastedText = () => {
    if (!pastedText.trim()) return;
    onFileSelect({
      base64: '',
      mimeType: 'text/plain',
      name: 'De_Goc_Nhap_Truc_Tiep.txt',
      extractedText: pastedText.trim(),
    });
  };

  const handleSelectSample = (sample: (typeof SAMPLE_EXAMS)[number]) => {
    setPastedText(sample.content);
    onFileSelect({
      base64: '',
      mimeType: 'text/plain',
      name: sample.name,
      extractedText: sample.content,
    });
  };

  const handleRemove = useCallback(() => {
    onFileSelect(null);
  }, [onFileSelect]);

  if (selectedFile) {
    const isImage = selectedFile.mimeType.startsWith('image/');
    const isDoc = Boolean(selectedFile.extractedText);
    return (
      <div className="w-full p-4 bg-teal-50/80 dark:bg-slate-800/80 border border-teal-300 dark:border-teal-800/60 rounded-2xl flex items-center justify-between transition-all shadow-xs">
        <div className="flex items-center space-x-3.5 overflow-hidden">
          <div className="p-2.5 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-xl shadow-xs shrink-0">
            {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-teal-950 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <p className="text-xs text-teal-800/80 dark:text-slate-400">
              {isDoc
                ? `Đã trích xuất công thức & văn bản (${selectedFile.extractedText?.length.toLocaleString('vi-VN')} ký tự)`
                : isImage
                  ? 'Hình ảnh đề thi gốc'
                  : 'Tài liệu PDF đề thi gốc'}
            </p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="p-2 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-xl text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            title="Chọn đề khác"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Chuyển đổi giữa Tải file và Dán văn bản / Đề mẫu */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-teal-50/70 dark:bg-slate-800 rounded-xl border border-teal-100 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setInputTab('file')}
          disabled={disabled}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            inputTab === 'file'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-teal-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Tải file (PDF / Word / Ảnh)
        </button>
        <button
          type="button"
          onClick={() => setInputTab('paste')}
          disabled={disabled}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            inputTab === 'paste'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-teal-900'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          Dán văn bản / Đề mẫu
        </button>
      </div>

      {inputTab === 'file' ? (
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            disabled || isParsingDocx
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
              : 'border-teal-300 dark:border-slate-700 bg-teal-50/40 dark:bg-slate-800/40 hover:bg-teal-50/90 dark:hover:bg-slate-800 hover:border-teal-500'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-4 pb-5 text-center px-4">
            <div className="mb-3 p-3 bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 rounded-2xl shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <p className="mb-1 text-sm text-teal-950 dark:text-slate-200 font-semibold">
              {isParsingDocx ? 'Đang trích xuất công thức Toán/Vật lý từ Word...' : 'Nhấn để chọn file hoặc kéo thả vào đây'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hỗ trợ <strong>PDF</strong>, <strong>Word (.docx)</strong>, <strong>PNG, JPG</strong> (Tối đa 20MB)
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            disabled={disabled || isParsingDocx}
          />
        </label>
      ) : (
        <div className="space-y-2.5">
          <textarea
            rows={5}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Dán nội dung câu hỏi hoặc đề thi gốc (Toán, Vật lý...) vào đây..."
            className="w-full p-3 text-xs rounded-xl border border-teal-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none"
          />
          <button
            type="button"
            onClick={handleApplyPastedText}
            disabled={!pastedText.trim() || disabled}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            ✓ Sử dụng văn bản này làm Đề gốc
          </button>
        </div>
      )}

      {/* Nút chọn nhanh đề mẫu Vật lý 12 & Toán 12 */}
      <div className="pt-1">
        <p className="text-[11px] font-semibold text-teal-800 dark:text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-600" />
          Thử nhanh với đề mẫu chuẩn GDPT 2018:
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {SAMPLE_EXAMS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectSample(sample)}
              className="text-left text-xs font-medium px-3 py-2 rounded-xl bg-teal-50/50 dark:bg-slate-800 hover:bg-teal-100/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-teal-200/80 dark:border-slate-700 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">{sample.title}</span>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 ml-2 shrink-0">
                Chọn mẫu →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;