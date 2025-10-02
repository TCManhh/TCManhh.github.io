// File: assets/js/layout.js

document.addEventListener('DOMContentLoaded', function() {
 
    // --- 1. Tải Header ---
 const headerPlaceholder = document.getElementById('header-placeholder');
 if (headerPlaceholder) {
    fetch('/header.html')
        .then(response => response.text())
        .then(data => {
            headerPlaceholder.innerHTML = data;
            initializeHeaderScrollEffect();
            setActiveNavLink(); // <<< GỌI HÀM MỚI Ở ĐÂY

            // --- LOGIC CHO NÚT MENU MOBILE ---
            const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
            const header = document.querySelector('.header');

            if (mobileNavToggle && header) {
                mobileNavToggle.addEventListener('click', function() {
                    header.classList.toggle('mobile-nav-open');
                });
            }
        });
}
 
    // --- 2. Tải Footer --- (Giữ nguyên)
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('/footer.html')
            .then(response => response.text())
            .then(data => {
                footerPlaceholder.innerHTML = data;
            });
    }
   
    // --- 3. Tải Breadcrumb (PHẦN NÂNG CẤP) ---
    const breadcrumbPlaceholder = document.getElementById('breadcrumb-placeholder');
    if (breadcrumbPlaceholder) {
        fetch('/breadcrumb.html')
            .then(response => response.text())
            .then(data => {
                breadcrumbPlaceholder.innerHTML = data;
               
                // Rất quan trọng: Chạy đoạn script nằm bên trong file breadcrumb.html
                // vì innerHTML không tự chạy script.
                const scriptTag = breadcrumbPlaceholder.querySelector('script');
                if (scriptTag) {
                    const newScript = document.createElement('script');
                    newScript.textContent = scriptTag.textContent;
                    document.body.appendChild(newScript).remove();
                }
            });
    }

 });

 // --- Hàm xử lý hiệu ứng header --- (Giữ nguyên)
function initializeHeaderScrollEffect() {
    const header = document.querySelector('.header');
    if (!header) return;

    function toggleHeaderSize() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    toggleHeaderSize();
    window.addEventListener('scroll', toggleHeaderSize, { passive: true });
}

/* DÁN HÀM NÀY VÀO CUỐI FILE assets/js/layout.js */

/**
 * Hàm này tìm trang hiện tại và thêm class 'active' 
 * vào link tương ứng trên thanh công cụ (header).
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.main-nav a');

  navLinks.forEach(link => {
  // Lấy đường dẫn của link (loại bỏ phần domain nếu có)
  const linkPath = new URL(link.href).pathname;

 // Xử lý đặc biệt cho Trang Chủ
  if (linkPath === '/index.html' || linkPath === '/') {
            if (currentPath === '/index.html' || currentPath === '/') {
                link.classList.add('active');
            }
        }
 // Xử lý cho các trang con khác
  else if (currentPath.startsWith(linkPath)) {
            link.classList.add('active');
 }
    });
}