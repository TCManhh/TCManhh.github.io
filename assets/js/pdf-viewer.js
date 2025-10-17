// File: /assets/js/pdf-viewer.js (Đã sửa lỗi)

const viewerElement = document.getElementById("pdf-viewer");
const url = viewerElement.dataset.pdfUrl; // Lấy URL từ thuộc tính data-pdf-url

// Lấy các phần tử HTML
const pdfCanvas = document.getElementById("pdf-canvas");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageNumSpan = document.getElementById("page-num");
const pageCountSpan = document.getElementById("page-count");

// Khởi tạo các biến trạng thái
let pdfDoc = null;
let pageNum = 1;
let pageIsRendering = false;
let pageNumIsPending = null;

// Hàm để hiển thị một trang PDF cụ thể
const renderPage = (num) => {
  pageIsRendering = true;
  pdfDoc.getPage(num).then((page) => {
    // =================== PHẦN ĐƯỢC SỬA LỖI ===================
    // Lấy chiều rộng của khung chứa để tính toán tỷ lệ cho PDF
    const containerWidth = viewerElement.clientWidth;
    const viewportDefault = page.getViewport({ scale: 1 });
    const scale = containerWidth / viewportDefault.width;
    const viewport = page.getViewport({ scale: scale });
    // ==========================================================

    const canvasContext = pdfCanvas.getContext("2d");
    pdfCanvas.height = viewport.height;
    pdfCanvas.width = viewport.width;

    const renderContext = { canvasContext, viewport };
    page.render(renderContext).promise.then(() => {
      pageIsRendering = false;
      if (pageNumIsPending !== null) {
        renderPage(pageNumIsPending);
        pageNumIsPending = null;
      }
    });
    pageNumSpan.textContent = num;
  });
};

// Hàm để xử lý khi có yêu cầu render trang mới
const queueRenderPage = (num) => {
  if (pageIsRendering) {
    pageNumIsPending = num;
  } else {
    renderPage(num);
  }
};

// Xử lý sự kiện cho các nút
const onPrevPage = () => {
  if (pageNum <= 1) return;
  pageNum--;
  queueRenderPage(pageNum);
};
const onNextPage = () => {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  queueRenderPage(pageNum);
};
prevPageBtn.addEventListener("click", onPrevPage);
nextPageBtn.addEventListener("click", onNextPage);

// Tải file PDF
if (url) {
  pdfjsLib
    .getDocument(url)
    .promise.then((doc) => {
      pdfDoc = doc;
      pageCountSpan.textContent = pdfDoc.numPages;
      renderPage(pageNum);
    })
    .catch((err) => {
      console.error("Lỗi khi tải PDF:", err);
      const errorDiv = document.createElement("div");
      errorDiv.textContent =
        "Không thể tải được file PDF. Vui lòng kiểm tra lại đường dẫn file.";
      errorDiv.style.color = "red";
      errorDiv.style.textAlign = "center";
      errorDiv.style.padding = "20px";
      viewerElement.appendChild(errorDiv);
    });
} else {
  console.error("Không tìm thấy đường dẫn PDF trong thuộc tính data-pdf-url.");
}
