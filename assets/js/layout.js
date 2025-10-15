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
  // [FIX] Chuẩn hóa URL để xử lý nhất quán
  const targetUrl = new URL(url, window.location.origin);
  const newPath = targetUrl.pathname;

  // Nếu link là trang chủ, luôn tải lại toàn bộ trang
  if (newPath === "/" || newPath === "/index.html") {
    window.location.href = "/index.html";
    return;
  }

  // Nếu click vào link của trang hiện tại, không làm gì cả
  if (targetUrl.href === window.location.href) {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }

  // Thêm class 'loading' để hiển thị hiệu ứng chuyển trang
  document.body.classList.add("page-loading");

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

      // Cập nhật URL trên thanh địa chỉ và history
      if (!isPopState) {
        // Chỉ pushState nếu URL thực sự thay đổi
        if (window.location.href !== targetUrl.href) {
          window.history.pushState(
            { path: targetUrl.href },
            newTitle,
            targetUrl.href
          );
        }
      }

      // Chạy lại các script cần thiết cho nội dung mới
      runPageSpecificScripts();
      window.scrollTo(0, 0); // Cuộn lên đầu trang
    }
  } catch (error) {
    console.error("Lỗi khi tải trang:", error);
    window.location.href = url; // Nếu có lỗi, quay về cách điều hướng truyền thống
  } finally {
    // Xóa class 'loading' sau khi hoàn thành tải trang
    document.body.classList.remove("page-loading");
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

  // [FIX] Khởi tạo lại chức năng đóng/mở cho các mục tài liệu
  initializeDocumentSections();
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

/**
 * [MỚI] Khởi tạo chức năng đóng/mở cho các section tài liệu.
 * Hàm này sẽ được gọi mỗi khi chuyển trang.
 */
function initializeDocumentSections() {
  const sectionHeaders = document.querySelectorAll(
    ".document-section .section-header"
  );
  if (sectionHeaders.length === 0) return;

  // Mặc định mở tất cả các section khi tải trang để đồng bộ với hành vi F5
  const sections = document.querySelectorAll(".document-section");
  sections.forEach((section) => {
    if (!section.classList.contains("active")) {
      section.classList.add("active");
    }
  });

  // Gắn sự kiện click để toggle
  sectionHeaders.forEach((header) => {
    // Tạo một bản sao để loại bỏ listener cũ, tránh gắn nhiều lần
    const newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);

    newHeader.addEventListener("click", () => {
      const section = newHeader.parentElement;
      section.classList.toggle("active");
    });
  });
}

/**
 * Hàm này tìm trang hiện tại trong thanh điều hướng và thêm class 'active'
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
  // [FIX] Lưu trạng thái ban đầu của trang vào history.
  // Điều này rất quan trọng để nút "Back" hoạt động đúng sau lần điều hướng đầu tiên.
  // Chúng ta dùng replaceState để không tạo entry thừa khi F5.
  const initialPath = window.location.href;
  window.history.replaceState(
    { path: initialPath },
    document.title,
    initialPath
  );

  initializeLayout().then(() => {
    // Sau khi layout chính đã tải xong, mới chạy các script phụ
    runPageSpecificScripts();
  });

  // 2. Chặn và xử lý các click vào link
  document.body.addEventListener("click", (e) => {
    // Tìm thẻ <a> gần nhất với phần tử được click
    const link = e.target.closest("a[href]"); // [FIX] Chỉ bắt các thẻ a có href

    // Kiểm tra các điều kiện để bỏ qua và dùng điều hướng mặc định
    if (
      !link || // Không phải là link
      link.target === "_blank" || // Mở tab mới
      e.ctrlKey ||
      e.metaKey || // Giữ Ctrl/Cmd để mở tab mới
      new URL(link.href).origin !== window.location.origin || // Link ra ngoài trang
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
  // [FIX] Đảm bảo event.state tồn tại. Nếu không, có thể là lần đầu vào trang
  // hoặc một sự kiện popstate không do chúng ta tạo ra.
  // Trong trường hợp đó, ta sẽ tải lại trang theo URL hiện tại.
  if (e.state && e.state.path) {
    // Chỉ tải nội dung nếu đường dẫn khác với đường dẫn hiện tại
    if (window.location.href !== e.state.path) {
      loadPageContent(e.state.path, true);
    }
  } else {
    // Nếu không có state, có thể là người dùng đã back về trang ban đầu
    // trước khi SPA được khởi tạo. Tải lại để đảm bảo.
    window.location.reload();
  }
});
