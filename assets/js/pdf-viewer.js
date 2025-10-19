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

  async renderCurrentView() {
    if (!this.pdfDoc || !this.canvasContainer) return;

    this.canvasContainer.classList.add("pdf-page-transitioning");
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (this.isSinglePageView) {
      this.pageNum = Math.min(Math.max(1, this.pageNum), this.pdfDoc.numPages);
      this.pageNumSpan.textContent = this.pageNum;
      await this.renderPageDirectly(this.pageNum, this.pdfCanvasLeft, "left");
      this.renderPageDirectly(0, this.pdfCanvasRight, "right");
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

    // ✅ Dùng CSS để canvas hiển thị đúng kích thước logic, trình duyệt sẽ tự scale down
    canvas.style.width = `100%`;
    canvas.style.height = `auto`;

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

  // ✅ HÀM NÀY ĐÃ BỊ XÓA: currentScales()
  // Lý do: Logic tính toán scale đã được chuyển trực tiếp vào renderPageDirectly
  // để sử dụng kích thước thực tế của trang PDF, giúp kết quả chính xác hơn.

  // ✅ HÀM ĐÃ ĐƯỢC SỬA LỖI - PHIÊN BẢN CUỐI CÙNG
  async renderPageDirectly(pageIndex, canvas, taskKey) {
    if (!this.pdfDoc || pageIndex < 1 || pageIndex > this.pdfDoc.numPages) {
      if (this.activeRenderTasks[taskKey])
        this.activeRenderTasks[taskKey].cancel();
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); // Xóa canvas
      canvas.style.visibility = "hidden";
      return;
    }

    const page = await this.pdfDoc.getPage(pageIndex);

    // 1. Lấy viewport gốc của trang (scale = 1) để biết kích thước thực
    const viewportDefault = page.getViewport({ scale: 1 });

    // 2. Xác định chiều rộng của khung chứa slide
    const containerWidth = this.pdfCanvasLeft.parentElement.clientWidth;

    // ✅ SỬA LỖI LOGIC QUAN TRỌNG:
    // Luôn sử dụng TOÀN BỘ chiều rộng của khung chứa để tính toán scale,
    // bất kể đang ở chế độ 1 hay 2 trang.
    // Điều này đảm bảo mỗi slide được render với độ phân giải gốc như nhau.
    const scaleCalculationWidth = containerWidth;

    // 3. Tính toán scale cơ bản dựa trên chiều rộng đã xác định ở trên.
    // Giờ đây, baseScale sẽ có giá trị cao và nhất quán ở cả 2 chế độ.
    const baseScale = scaleCalculationWidth / viewportDefault.width;

    // 4. Lấy tỷ lệ pixel của thiết bị để render sắc nét trên màn hình HiDPI/Retina
    const dpr = window.devicePixelRatio || 1;

    // 5. Tính toán scale cuối cùng để render
    const finalScale = Math.min(baseScale * dpr, 4.0);

    // 6. Sử dụng một canvas tạm để render
    const tempCanvas = document.createElement("canvas");
    await this.renderToCanvas(page, finalScale, tempCanvas, `${taskKey}-temp`);

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
