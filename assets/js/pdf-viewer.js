// /assets/js/pdf-viewer.js (Phiên bản Class tối ưu)

class PDFViewer {
  constructor(elementId) {
    this.viewerElement = document.getElementById(elementId);
    if (!this.viewerElement) return;

    this.url = this.viewerElement.dataset.pdfUrl || "";
    this.pdfDoc = null;
    this.isSinglePageView = true;
    this.activeRenderTasks = { left: null, right: null };
    this.pageNum = this.getPageNumFromUrl();

    this.initDOM();
    if (this.url) {
      this.initViewer();
    } else {
      console.error("Không tìm thấy data-pdf-url.");
    }
  }

  initDOM() {
    this.loadingOverlay = document.getElementById("loading-overlay");
    this.loadingProgress = document.getElementById("loading-progress");
    // ✅ THÊM DÒNG NÀY
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
      this.debounce(() => this.renderCurrentView(), 250)
    );

    this.viewerElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }

  getPageNumFromUrl() {
    const hash = window.location.hash;
    if (hash.startsWith("#page=")) {
      const pageFromUrl = parseInt(hash.substring(6), 10);
      if (!isNaN(pageFromUrl) && pageFromUrl > 0) return pageFromUrl;
    }
    return 1;
  }

  updateUrlHash() {
    window.history.replaceState(null, "", `#page=${this.pageNum}`);
  }

  // ✅ HÀM NÀY ĐÃ ĐƯỢC CẬP NHẬT HOÀN TOÀN
  async renderCurrentView() {
    if (!this.pdfDoc || !this.canvasContainer) return;

    // 1. Bắt đầu hiệu ứng: Làm mờ container
    this.canvasContainer.classList.add("pdf-page-transitioning");

    // 2. Chờ một chút để hiệu ứng fade-out kịp diễn ra
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 3. Render trang mới (khi container đang trong suốt)
    if (this.isSinglePageView) {
      this.pageNum = Math.min(Math.max(1, this.pageNum), this.pdfDoc.numPages);
      this.pageNumSpan.textContent = this.pageNum;
      await this.renderPageDirectly(this.pageNum, this.pdfCanvasLeft, "left");
      this.renderPageDirectly(0, this.pdfCanvasRight, "right"); // Vẫn gọi để ẩn đi
    } else {
      let left = this.pageNum % 2 !== 0 ? this.pageNum : this.pageNum - 1;
      if (left < 1) left = 1;
      const right = left + 1;
      this.pageNumSpan.textContent =
        right <= this.pdfDoc.numPages ? `${left}-${right}` : `${left}`;
      // Render song song để tăng tốc
      await Promise.all([
        this.renderPageDirectly(left, this.pdfCanvasLeft, "left"),
        this.renderPageDirectly(right, this.pdfCanvasRight, "right"),
      ]);
    }

    // 4. Cập nhật URL và hiển thị lại container với nội dung mới
    this.updateUrlHash();
    this.canvasContainer.classList.remove("pdf-page-transitioning");
  }

  onPrevPage() {
    if (this.pageNum <= 1) return;
    const jump = this.isSinglePageView ? 1 : 2;
    this.pageNum = Math.max(1, this.pageNum - jump);
    this.renderCurrentView();
  }

  onNextPage() {
    if (!this.pdfDoc) return;
    if (this.isSinglePageView && this.pageNum >= this.pdfDoc.numPages) return;
    if (!this.isSinglePageView && this.pageNum + 1 >= this.pdfDoc.numPages)
      return;

    const jump = this.isSinglePageView ? 1 : 2;
    this.pageNum = Math.min(this.pdfDoc.numPages, this.pageNum + jump);
    this.renderCurrentView();
  }

  onToggleView() {
    if (!this.pdfDoc) return;
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
    if (!this.isSinglePageView && this.pageNum % 2 === 0) this.pageNum -= 1;
    this.renderCurrentView();
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
        // Render lần đầu không cần hiệu ứng
        const originalRender = async () => {
          if (this.isSinglePageView) {
            this.pageNumSpan.textContent = this.pageNum;
            await this.renderPageDirectly(
              this.pageNum,
              this.pdfCanvasLeft,
              "left"
            );
          } else {
            let left = this.pageNum % 2 !== 0 ? this.pageNum : this.pageNum - 1;
            if (left < 1) left = 1;
            const right = left + 1;
            this.pageNumSpan.textContent =
              right <= this.pdfDoc.numPages ? `${left}-${right}` : `${left}`;
            await Promise.all([
              this.renderPageDirectly(left, this.pdfCanvasLeft, "left"),
              this.renderPageDirectly(right, this.pdfCanvasRight, "right"),
            ]);
          }
          this.updateUrlHash();
        };
        originalRender();
      })
      .catch((err) => {
        console.error("Lỗi nghiêm trọng khi tải PDF:", err);
        this.loadingOverlay.style.display = "none";
        this.viewerElement.innerHTML = `<div class="error-message">Không thể tải được file PDF. Vui lòng thử lại sau.</div>`;
      });
  }

  async renderToCanvas(page, scale, canvas, taskKey) {
    if (this.activeRenderTasks[taskKey])
      this.activeRenderTasks[taskKey].cancel();
    const viewport = page.getViewport({ scale });
    const ctx = canvas.getContext("2d", { alpha: false });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const renderContext = { canvasContext: ctx, viewport };
    const renderTask = page.render(renderContext);
    this.activeRenderTasks[taskKey] = renderTask;
    try {
      await renderTask.promise;
    } catch (err) {
      if (err.name !== "RenderingCancelledException")
        console.error(`Lỗi renderToCanvas cho [${taskKey}]:`, err);
    } finally {
      this.activeRenderTasks[taskKey] = null;
    }
  }

  currentScales() {
    const containerWidth = Math.max(320, this.viewerElement.clientWidth);
    const baseScale = this.isSinglePageView
      ? containerWidth / 900
      : containerWidth / 2 / 900;
    return { full: Math.min(baseScale * 3.0, 4.0) };
  }

  async renderPageDirectly(pageIndex, canvas, taskKey) {
    if (!this.pdfDoc || pageIndex < 1 || pageIndex > this.pdfDoc.numPages) {
      if (this.activeRenderTasks[taskKey])
        this.activeRenderTasks[taskKey].cancel();
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); // Xóa canvas
      canvas.style.visibility = "hidden";
      return;
    }
    const page = await this.pdfDoc.getPage(pageIndex);
    const scales = this.currentScales();
    const tempCanvas = document.createElement("canvas");
    await this.renderToCanvas(page, scales.full, tempCanvas, `${taskKey}-temp`);
    const mainCtx = canvas.getContext("2d");
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    mainCtx.drawImage(tempCanvas, 0, 0);
    canvas.style.visibility = "visible";
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => new PDFViewer("pdf-viewer")
);
