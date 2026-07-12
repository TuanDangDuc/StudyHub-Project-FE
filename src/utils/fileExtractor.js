import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Thiết lập worker cho PDF.js để hoạt động mượt mà với Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromFile = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase();

  try {
    if (extension === 'pdf') {
      return await extractTextFromPDF(file);
    } else if (['docx'].includes(extension)) {
      return await extractTextFromDOCX(file);
    } else if (['txt', 'md'].includes(extension)) {
      return await file.text();
    } else if (['csv'].includes(extension)) {
      // CSV: đọc toàn bộ nội dung thô
      return await file.text();
    } else {
      console.warn("Loại file chưa được hỗ trợ trích xuất text:", extension);
      return "";
    }
  } catch (error) {
    console.error(`Lỗi trích xuất chữ từ file ${file.name}:`, error);
    return "";
  }
};

const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    // Bật chế độ đọc text ẩn (dành cho PDF có layer text nhúng)
    useSystemFonts: true,
  }).promise;

  const totalPages = pdf.numPages;
  console.log(`[PDF Extract] Tổng số trang: ${totalPages}`);

  let fullText = "";

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Dùng hasEOL để giữ nguyên xuống dòng trong PDF
    let pageText = "";
    for (const item of textContent.items) {
      if (item.str) {
        pageText += item.str;
        // Nếu item có flag xuống dòng thì thêm newline
        if (item.hasEOL) pageText += "\n";
        else pageText += " ";
      }
    }

    const trimmedPage = pageText.trim();
    console.log(`[PDF Extract] Trang ${pageNum}/${totalPages}: ${trimmedPage.length} ký tự`);

    if (trimmedPage.length === 0) {
      console.warn(`[PDF Extract] ⚠️ Trang ${pageNum} không có text (có thể là ảnh scan)`);
    }

    fullText += trimmedPage + "\n\n";
  }

  console.log(`[PDF Extract] ✅ Tổng: ${fullText.length} ký tự từ ${totalPages} trang`);
  return fullText;
};

const extractTextFromDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  console.log(`[DOCX Extract] ✅ Tổng: ${result.value.length} ký tự`);
  return result.value;
};
