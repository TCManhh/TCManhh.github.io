// /assets/js/pdf-viewer.js (Bản cải tiến đầy đủ)

const viewerElement = document.getElementById("pdf-viewer");
const url = viewerElement?.dataset?.pdfUrl || "";

const loadingOverlay = document.getElementById("loading-overlay");
const loadingProgress = document.getElementById("loading-progress");

const pdfCanvasLeft = document.getElementById("pdf-canvas-left");
const pdfCanvasRight = document.getElementById("pdf-canvas-right");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const viewToggleBtn = document.getElementById("view-toggle-btn");
const pageNumSpan = document.getElementById("page-num");
const pageCountSpan = document.getElementById("page-count");

let pdfDoc = null;
let pageNum = 1;
let isSinglePageView = true;
let activeRenderTasks = { left: null, right: null };

function getPageNumFromUrl() {
  const hash = window.location.hash;
  if (hash.startsWith("#page=")) {
    const pageFromUrl = parseInt(hash.substring(6), 10);
    if (!isNaN(pageFromUrl) && pageFromUrl > 0) {
      return pageFromUrl;
    }
  }
  return 1;
}

pageNum = getPageNumFromUrl();

async function renderToCanvas(page, scale, canvas, taskKey) {
  if (activeRenderTasks[taskKey]) {
    activeRenderTasks[taskKey].cancel();
  }
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext("2d", { alpha: false });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const renderContext = { canvasContext: ctx, viewport };
  const renderTask = page.render(renderContext);
  activeRenderTasks[taskKey] = renderTask;
  try {
    await renderTask.promise;
  } catch (err) {
    if (err.name !== "RenderingCancelledException")
      console.error(`Lỗi renderToCanvas cho [${taskKey}]:`, err);
  } finally {
    activeRenderTasks[taskKey] = null;
  }
}

function currentScales() {
  const containerWidth = Math.max(320, viewerElement.clientWidth);
  const isMobile = window.innerWidth <= 1024;

  // Xác định xem có nên dùng tỉ lệ cho 1 trang hay không
  // Dùng tỉ lệ 1 trang nếu:
  // 1. Đang ở chế độ xem 1 trang.
  // 2. Hoặc đang ở chế độ xem 2 trang NHƯNG trên mobile (vì layout đã chuyển sang dọc).
  const useSinglePageScale =
    isSinglePageView || (!isSinglePageView && isMobile);

  const baseScale = useSinglePageScale
    ? containerWidth / 900 // Tỉ lệ cho 1 trang (hoặc 2 trang trên mobile)
    : containerWidth / 2 / 900; // Tỉ lệ cho 2 trang trên desktop

  return {
    full: Math.min(baseScale * 3.0, 4.0),
  };
}

async function renderPageDirectly(pageIndex, canvas, taskKey) {
  if (!pdfDoc || pageIndex < 1 || pageIndex > pdfDoc.numPages) {
    if (activeRenderTasks[taskKey]) activeRenderTasks[taskKey].cancel();
    canvas.style.visibility = "hidden";
    return;
  }
  const page = await pdfDoc.getPage(pageIndex);
  const scales = currentScales();
  const tempCanvas = document.createElement("canvas");
  await renderToCanvas(page, scales.full, tempCanvas, `${taskKey}-temp`);
  const mainCtx = canvas.getContext("2d");
  canvas.width = tempCanvas.width;
  canvas.height = tempCanvas.height;
  mainCtx.drawImage(tempCanvas, 0, 0);
  canvas.style.visibility = "visible";
}

async function renderCurrentView() {
  if (!pdfDoc) return;
  if (viewerElement.classList.contains("single-page-view")) {
    pageNum = Math.min(Math.max(1, pageNum), pdfDoc.numPages);
    pageNumSpan.textContent = pageNum;
    renderPageDirectly(pageNum, pdfCanvasLeft, "left");
    renderPageDirectly(0, pdfCanvasRight, "right");
  } else {
    let left = pageNum % 2 !== 0 ? pageNum : pageNum - 1;
    if (left < 1) left = 1;
    const right = left + 1;
    pageNumSpan.textContent =
      right <= pdfDoc.numPages ? `${left}-${right}` : `${left}`;
    renderPageDirectly(left, pdfCanvasLeft, "left");
    renderPageDirectly(right, pdfCanvasRight, "right");
  }
  window.location.hash = `#page=${pageNum}`;
}

function onPrevPage() {
  if (!pdfDoc) return;
  const jump = isSinglePageView ? 1 : 2;
  if (pageNum <= 1) return;
  pageNum = Math.max(1, pageNum - jump);
  renderCurrentView();
}

function onNextPage() {
  if (!pdfDoc) return;
  const jump = isSinglePageView ? 1 : 2;
  if (pageNum >= pdfDoc.numPages) return;
  if (!isSinglePageView && pageNum + 1 > pdfDoc.numPages) return;
  pageNum = Math.min(pdfDoc.numPages, pageNum + jump);
  renderCurrentView();
}

function onToggleView() {
  if (!pdfDoc) return;
  isSinglePageView = !isSinglePageView;
  viewerElement.classList.toggle("single-page-view");
  viewToggleBtn.innerHTML = isSinglePageView
    ? '<i class="fas fa-book-open"></i>'
    : '<i class="fas fa-file-alt"></i>';
  viewToggleBtn.title = isSinglePageView ? "Xem hai trang" : "Xem một trang";
  if (!isSinglePageView && pageNum % 2 === 0) pageNum -= 1;
  renderCurrentView();
}

prevPageBtn.addEventListener("click", onPrevPage);
nextPageBtn.addEventListener("click", onNextPage);
viewToggleBtn.addEventListener("click", onToggleView);

if (url) {
  const loadingTask = pdfjsLib.getDocument({
    url: url,
    onProgress: (progressData) => {
      if (progressData.total && loadingProgress) {
        const percent = Math.round(
          (progressData.loaded / progressData.total) * 100
        );
        loadingProgress.textContent = `${percent}%`;
      }
    },
  });
  loadingTask.promise
    .then((doc) => {
      if (loadingOverlay) loadingOverlay.classList.add("hidden");
      pdfDoc = doc;
      pageCountSpan.textContent = pdfDoc.numPages;
      // Khôi phục trang từ URL hoặc mặc định là trang 1
      pageNum = getPageNumFromUrl();
      if (pageNum > doc.numPages) pageNum = 1;

      viewerElement.classList.toggle("single-page-view", isSinglePageView);
      viewToggleBtn.innerHTML = isSinglePageView
        ? '<i class="fas fa-book-open"></i>'
        : '<i class="fas fa-file-alt"></i>';
      viewToggleBtn.title = isSinglePageView
        ? "Xem hai trang"
        : "Xem một trang";
      renderCurrentView();
    })
    .catch((err) => {
      console.error("Lỗi nghiêm trọng khi tải PDF:", err);
      if (loadingOverlay) loadingOverlay.style.display = "none";
      viewerElement.textContent = "Không thể tải file PDF.";
    });
} else {
  console.error("Không tìm thấy data-pdf-url.");
}

window.addEventListener("resize", () => {
  if (pdfDoc) renderCurrentView();
});
