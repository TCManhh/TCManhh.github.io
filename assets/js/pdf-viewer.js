// /assets/js/pdf-viewer.js (Phiên bản với hiệu ứng Cross-Fade mượt mà)

class PDFViewer {
  constructor(elementId) {
    this.viewerElement = document.getElementById(elementId);
    if (!this.viewerElement) return;

    this.url = this.viewerElement.dataset.pdfUrl || "";
    this.pdfDoc = null;
    this.isSinglePageView = true;
    this.activeRenderTasks = { left: null, right: null };
    this.pageNum = this.getPageNumFromUrl();
    this.isTransitioning = false;

    this.initDOM();
    if (this.url) {
      this.initViewer();
    } else {
      console.error("Không tìm thấy data-pdf-url.");
    }
  }

  initDOM() {
    this.loadingOverlay = document.getElementById("loading-overlay");
    this.canvasContainer = document.getElementById("canvas-container");
    this.pdfCanvasLeft = document.getElementById("pdf-canvas-left");
    this.pdfCanvasRight = document.getElementById("pdf-canvas-right");
    this.prevPageBtn = document.getElementById("prev-page");
    this.nextPageBtn = document.getElementById("next-page");
    this.viewToggleBtn = document.getElementById("view-toggle-btn");
    this.pageNumSpan = document.getElementById("page-num");
    this.pageCountSpan = document.getElementById("page-count");
  }

  initViewer() {
    this.attachEventListeners();
    this.loadDocument();
  }

  debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  attachEventListeners() {
    this.prevPageBtn.addEventListener("click", () => this.onPrevPage());
    this.nextPageBtn.addEventListener("click", () => this.onNextPage());
    this.viewToggleBtn.addEventListener("click", () => this.onToggleView());
    window.addEventListener(
      "resize",
      this.debounce(() => this.renderCurrentPageContent(), 250)
    );
  }

  getPageNumFromUrl() {
    const hash = window.location.hash;
    if (hash.startsWith("#page=")) {
      const pageFromUrl = parseInt(hash.substring(6), 10);
      if (!isNaN(pageFromUrl) && pageFromUrl > 0) return pageFromUrl;
    }
    return 1;
  }

  // ✅ HÀM MỚI CỐT LÕI: Vẽ trước trang vào một canvas ẩn
  async preparePage(pageNumber, isLeft) {
    if (!this.pdfDoc || pageNumber < 1 || pageNumber > this.pdfDoc.numPages) {
      return null; // Trả về null nếu trang không hợp lệ
    }
    const page = await this.pdfDoc.getPage(pageNumber);
    const scale = this.isSinglePageView
      ? this.viewerElement.clientWidth / page.getViewport({ scale: 1 }).width
      : this.viewerElement.clientWidth /
        2 /
        page.getViewport({ scale: 1 }).width;

    const viewport = page.getViewport({ scale });
    const offscreenCanvas = document.createElement("canvas");
    const offscreenCtx = offscreenCanvas.getContext("2d");
    offscreenCanvas.width = viewport.width;
    offscreenCanvas.height = viewport.height;

    const renderContext = { canvasContext: offscreenCtx, viewport };
    await page.render(renderContext).promise;
    return offscreenCanvas; // Trả về canvas đã được vẽ
  }

  // ✅ HÀM MỚI: Cập nhật giao diện và URL
  updateUI(newPageNum) {
    this.pageNum = newPageNum;
    this.pageNumSpan.textContent = this.isSinglePageView
      ? this.pageNum
      : `${this.pageNum}-${this.pageNum + 1}`;
    window.history.replaceState(null, "", `#page=${this.pageNum}`);
  }

  // ✅ HÀM MỚI: Logic chuyển trang mượt mà
  async transitionToPage(newPageNum) {
    if (this.isTransitioning || !this.pdfDoc) return;
    this.isTransitioning = true;

    // 1. Vẽ trước các trang cần hiển thị vào canvas ẩn
    const pagesToPrepare = [];
    if (this.isSinglePageView) {
      pagesToPrepare.push(this.preparePage(newPageNum, true));
    } else {
      const leftPage = newPageNum % 2 !== 0 ? newPageNum : newPageNum - 1;
      pagesToPrepare.push(this.preparePage(leftPage, true));
      pagesToPrepare.push(this.preparePage(leftPage + 1, false));
    }
    const preparedCanvases = await Promise.all(pagesToPrepare);

    // 2. Làm mờ trang cũ
    this.canvasContainer.classList.add("pdf-page-transitioning");
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 3. Cập nhật UI và "tráo đổi" nội dung canvas
    this.updateUI(newPageNum);
    const leftCtx = this.pdfCanvasLeft.getContext("2d");
    this.pdfCanvasLeft.width = preparedCanvases[0]?.width || 1;
    this.pdfCanvasLeft.height = preparedCanvases[0]?.height || 1;
    if (preparedCanvases[0]) leftCtx.drawImage(preparedCanvases[0], 0, 0);

    const rightCtx = this.pdfCanvasRight.getContext("2d");
    this.pdfCanvasRight.style.display = preparedCanvases[1] ? "block" : "none";
    if (preparedCanvases[1]) {
      this.pdfCanvasRight.width = preparedCanvases[1].width;
      this.pdfCanvasRight.height = preparedCanvases[1].height;
      rightCtx.drawImage(preparedCanvases[1], 0, 0);
    }

    // 4. Làm hiện trang mới
    this.canvasContainer.classList.remove("pdf-page-transitioning");
    this.isTransitioning = false;
  }

  // ✅ HÀM ĐƯỢC RÚT GỌN: Chỉ dùng để render lần đầu hoặc khi resize
  async renderCurrentPageContent() {
    if (!this.pdfDoc) return;
    await this.transitionToPage(this.pageNum);
  }

  onPrevPage() {
    if (this.pageNum <= 1) return;
    const jump = this.isSinglePageView ? 1 : 2;
    const newPage = Math.max(1, this.pageNum - jump);
    this.transitionToPage(newPage);
  }

  onNextPage() {
    if (!this.pdfDoc) return;
    if (this.isSinglePageView && this.pageNum >= this.pdfDoc.numPages) return;
    if (!this.isSinglePageView && this.pageNum + 1 >= this.pdfDoc.numPages)
      return;
    const jump = this.isSinglePageView ? 1 : 2;
    const newPage = Math.min(this.pdfDoc.numPages, this.pageNum + jump);
    this.transitionToPage(newPage);
  }

  onToggleView() {
    if (!this.pdfDoc || this.isTransitioning) return;
    this.isSinglePageView = !this.isSinglePageView;
    this.viewerElement.classList.toggle(
      "single-page-view",
      this.isSinglePageView
    );
    this.viewToggleBtn.innerHTML = this.isSinglePageView
      ? '<i class="fas fa-book-open"></i>'
      : '<i class="fas fa-file-alt"></i>';
    this.viewToggleBtn.title = this.isSinglePageView
      ? "Xem hai trang"
      : "Xem một trang";
    if (!this.isSinglePageView && this.pageNum % 2 === 0) {
      this.pageNum = Math.max(1, this.pageNum - 1);
    }
    this.renderCurrentPageContent();
  }

  loadDocument() {
    const loadingTask = pdfjsLib.getDocument({ url: this.url });
    loadingTask.promise
      .then((doc) => {
        this.loadingOverlay.classList.add("hidden");
        this.pdfDoc = doc;
        this.pageCountSpan.textContent = doc.numPages;
        if (this.pageNum > doc.numPages) this.pageNum = 1;
        this.viewerElement.classList.toggle(
          "single-page-view",
          this.isSinglePageView
        );
        this.viewToggleBtn.innerHTML = this.isSinglePageView
          ? '<i class="fas fa-book-open"></i>'
          : '<i class="fas fa-file-alt"></i>';
        this.viewToggleBtn.title = this.isSinglePageView
          ? "Xem hai trang"
          : "Xem một trang";
        this.renderCurrentPageContent();
      })
      .catch((err) => {
        console.error("Lỗi nghiêm trọng khi tải PDF:", err);
        this.loadingOverlay.style.display = "none";
        this.viewerElement.innerHTML = `<div class="error-message">Không thể tải được file PDF. Vui lòng thử lại sau.</div>`;
      });
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => new PDFViewer("pdf-viewer")
);
