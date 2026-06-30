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
    } else if (['txt', 'csv', 'md'].includes(extension)) {
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
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + "\n";
  }

  return fullText;
};

const extractTextFromDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};
