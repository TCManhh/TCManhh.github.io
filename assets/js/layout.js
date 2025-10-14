// File: assets/js/layout.js

/**
 * Tải và khởi tạo các thành phần layout chung (header, footer).
 * Chỉ chạy một lần khi trang được tải lần đầu.
 */
async function initializeLayout() {
  const headerPlaceholder = document.getElementById("header-placeholder");
  const footerPlaceholder = document.getElementById("footer-placeholder");

  // Tải header và footer song song
  await Promise.all([
    (async () => {
      if (headerPlaceholder) {
        try {
          const response = await fetch("/header.html");
          const data = await response.text();
          headerPlaceholder.outerHTML = data; // Thay thế placeholder
          initializeHeaderFunctionality();
        } catch (error) {
          console.error("Lỗi khi tải header:", error);
        }
      }
    })(),
    (async () => {
      if (footerPlaceholder) {
        try {
          const response = await fetch("/footer.html");
          const data = await response.text();
          footerPlaceholder.innerHTML = data;
        } catch (error) {
          console.error("Lỗi khi tải footer:", error);
        }
      }
    })(),
  ]);
}

/**
 * Tải và hiển thị nội dung chính của một trang mới.
 * @param {string} url - URL của trang cần tải.
 * @param {boolean} isPopState - Đánh dấu nếu đây là sự kiện từ nút back/forward của trình duyệt.
 */
async function loadPageContent(url, isPopState = false) {
  // [FIX v2] Xử lý khi click vào link của trang hiện tại (ví dụ: click logo ở trang chủ)
  // Chuẩn hóa pathname để so sánh (coi / và /index.html là một)
  const normalizePath = (path) => {
    if (path.endsWith("/index.html")) {
      return path.slice(0, -10); // Bỏ "/index.html"
    }
    return path.replace(/\/$/, ""); // Bỏ dấu / ở cuối
  };

  const currentPath = normalizePath(window.location.pathname);
  const newPath = normalizePath(new URL(url, window.location.origin).pathname);

  if (currentPath === newPath) {
    // [FIX v3] Nếu click vào link của trang hiện tại, cuộn lên đầu trang thay vì không làm gì.
    // Điều này mang lại phản hồi cho người dùng.
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return; // Dừng lại, không tải lại nội dung
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Nếu không tìm thấy trang, chuyển hướng đến trang 404
      window.location.href = "/404.html";
      return;
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Lấy nội dung chính và tiêu đề từ trang mới
    const newMain = doc.querySelector("main");
    const newTitle = doc.querySelector("title").innerText;

    if (newMain) {
      // Thay thế nội dung cũ bằng nội dung mới
      document.querySelector("main").replaceWith(newMain);
      document.title = newTitle;

      // Cập nhật URL trên thanh địa chỉ
      if (!isPopState) {
        window.history.pushState({ path: url }, newTitle, url);
      }

      // Chạy lại các script cần thiết cho nội dung mới
      runPageSpecificScripts();
      window.scrollTo(0, 0); // Cuộn lên đầu trang
    }
  } catch (error) {
    console.error("Lỗi khi tải trang:", error);
    window.location.href = url; // Nếu có lỗi, quay về cách điều hướng truyền thống
  }
}

/**
 * Chạy lại các script cần thiết sau khi nội dung trang được thay thế.
 */
function runPageSpecificScripts() {
  // Tải lại breadcrumb
  const breadcrumbPlaceholder = document.getElementById(
    "breadcrumb-placeholder"
  );
  if (breadcrumbPlaceholder) {
    fetch("/breadcrumb.html")
      .then((response) => response.text())
      .then((data) => {
        breadcrumbPlaceholder.innerHTML = data;
        const scriptTag = breadcrumbPlaceholder.querySelector("script");
        if (scriptTag) {
          const newScript = document.createElement("script");
          newScript.textContent = scriptTag.textContent;
          document.body.appendChild(newScript).remove();
        }
      });
  }

  // Tải lại các thành phần phụ (bình luận,...)
  loadSecondaryComponents();

  // Cập nhật trạng thái 'active' cho link điều hướng
  setActiveNavLink();
}

/**
 * Tải các thành phần phụ (bình luận,...) sau khi toàn bộ trang đã tải xong
 * để không làm chậm quá trình hiển thị ban đầu.
 */
function loadSecondaryComponents() {
  const mainElement = document.querySelector("main");
  if (!mainElement) return;

  // Tải song song 2 file html
  Promise.all([
    fetch("/assets/html/author-respect.html").then((res) =>
      res.ok ? res.text() : ""
    ),
    fetch("/assets/html/comments.html").then((res) =>
      res.ok ? res.text() : ""
    ),
  ])
    .then(([respectHTML, commentsHTML]) => {
      if (commentsHTML) {
        // Chèn khối "Tôn trọng tác giả" trước, nếu có
        if (respectHTML) {
          mainElement.insertAdjacentHTML("beforeend", respectHTML);
        }
        // Sau đó chèn khối bình luận
        mainElement.insertAdjacentHTML("beforeend", commentsHTML);

        // Chỉ tải script bình luận nếu HTML của nó được chèn thành công
        const script = document.createElement("script");
        script.src = "/assets/js/comments.js";
        script.defer = true;
        document.body.appendChild(script);
      }
    })
    .catch((err) => console.warn("Lỗi khi tải các module phụ:", err));
}

// --- Hàm xử lý hiệu ứng header --- (Giữ nguyên)
function initializeHeaderFunctionality() {
  // Hiệu ứng cuộn
  const header = document.querySelector(".header");
  if (!header) return;

  function toggleHeaderSize() {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  toggleHeaderSize();
  window.addEventListener("scroll", toggleHeaderSize, { passive: true });

  // Logic cho nút menu mobile
  const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener("click", function () {
      header.classList.toggle("mobile-nav-open");
    });
  }
}

/* DÁN HÀM NÀY VÀO CUỐI FILE assets/js/layout.js */

/**
 * Hàm này tìm trang hiện tại và thêm class 'active'
 * vào link tương ứng trên thanh công cụ (header).
 */
function setActiveNavLink() {
  const currentPath = window.location.pathname.replace(/\/$/, ""); // Xóa dấu / ở cuối nếu có
  const navLinks = document.querySelectorAll(".header .main-nav a");

  navLinks.forEach((link) => {
    // Lấy đường dẫn của link (loại bỏ phần domain nếu có)
    const linkPath = new URL(link.href).pathname
      .replace(/\/$/, "")
      .replace(/\.html$/, "");

    link.classList.remove("active"); // Xóa active cũ

    // Xử lý đặc biệt cho Trang Chủ
    if (linkPath === "/index" || linkPath === "") {
      if (
        currentPath === "/index" ||
        currentPath === "" ||
        currentPath === "/index.html"
      ) {
        link.classList.add("active");
      }
    }
    // Xử lý cho các trang con khác
    else if (currentPath.startsWith(linkPath)) {
      link.classList.add("active");
    }
  });
}

// === KHỞI TẠO VÀ XỬ LÝ ĐIỀU HƯỚNG ===

// 1. Khi trang tải lần đầu
document.addEventListener("DOMContentLoaded", () => {
  initializeLayout().then(() => {
    // Sau khi layout chính đã tải xong, mới chạy các script phụ
    runPageSpecificScripts();
  });

  // 2. Chặn và xử lý các click vào link
  document.body.addEventListener("click", (e) => {
    // Tìm thẻ <a> gần nhất với phần tử được click
    const link = e.target.closest("a");

    // Kiểm tra các điều kiện để bỏ qua và dùng điều hướng mặc định
    if (
      !link || // Không phải là link
      link.target === "_blank" || // Mở tab mới
      e.ctrlKey ||
      e.metaKey || // Giữ Ctrl/Cmd để mở tab mới
      !link.href.startsWith(window.location.origin) || // Link ra ngoài trang
      link.href.includes("#") || // Link có hash (anchor link)
      link.hasAttribute("download") || // Link tải file
      link.href.endsWith(".pdf") ||
      link.href.endsWith(".zip") // Link là file
    ) {
      return;
    }

    e.preventDefault(); // Chặn hành vi mặc định
    loadPageContent(link.href); // Tải nội dung mới
  });
});

// 3. Xử lý khi người dùng nhấn nút back/forward của trình duyệt
window.addEventListener("popstate", (e) => {
  if (e.state && e.state.path) {
    loadPageContent(e.state.path, true);
  }
});
