// --- INITIALIZATION ---
// Script này được layout.js tải sau khi DOM sẵn sàng, nên có thể chạy trực tiếp.
(function () {
  // Dừng lại nếu trang không có khối bình luận (do layout.js chèn vào)
  if (!document.getElementById("comments")) return;

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxGdIvBCFFCQGvX0bJxdrIMVz3uP5mZ9L7pEper1YiGQMp2HOtXwCMXNjCfJ7MD0exA/exec";

  // --- PAGE IDENTIFIER ---
  const main = document.querySelector("main");
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const baseForId = canonical || window.location.href;
  const PAGE_ID =
    main?.dataset?.threadId ||
    new URL(baseForId).pathname.replace(/[^a-zA-Z0-9]/g, "_");

  let FORM_STARTED_AT = Date.now(); // đo thời gian điền form

  // === DEVICE ID MANAGEMENT ===
  function ensureDeviceId() {
    let uid = localStorage.getItem("ss_device_id");
    if (!uid) {
      uid = "d_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      localStorage.setItem("ss_device_id", uid);
    }
    return uid;
  }
  const DEVICE_ID = ensureDeviceId();

  // === STATE QUẢN LÝ TRẠNG THÁI ===
  const state = {
    raw: [],
    tree: [],
    page: 1,
    pageSize: 10,
    lastFetch: 0,
  };

  // === DOM ELEMENTS ===
  const el = {
    container: document.getElementById("comments-container"),
    form: document.getElementById("comment-form"),
    nameInput: document.getElementById("comment-name"),
    commentInput: document.getElementById("comment-text"),
    formActions: document.querySelector(".comment-main-form .form-actions"),
    mainAvatar: document.getElementById("main-form-avatar"),
    submitBtn: document.querySelector(
      '.comment-main-form button[type="submit"]'
    ),
    cancelBtn: document.querySelector(".comment-main-form .cancel-btn"),
    loadMore: document.getElementById("comments-load-more"),
    toast: document.getElementById("comments-toast"),
    hpWebsite: document.getElementById("hp-website"), // Honeypot field
    ratingStars: document.querySelectorAll("#rating-stars .star"),
    ratingValueInput: document.getElementById("rating-value"),
  };

  // === HELPER FUNCTIONS ===
  const formatTimeAgo = (dateInput) => {
    if (!dateInput) return "(đang gửi...)";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    if (seconds < 5) return "vừa xong";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.round(hours / 24)} ngày trước`;
  };

  const generateCommentId = () =>
    `c_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

  const escapeHTML = (str) =>
    String(str).replace(
      /[&<>"'`]/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
          "`": "&#96;",
        }[m])
    );

  const showToast = (msg, isSuccess = true) => {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.style.background = isSuccess ? "#28a745" : "#dc3545";
    el.toast.classList.add("show");
    setTimeout(() => el.toast.classList.remove("show"), 5000);
  };

  const nameToColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 60%)`;
  };

  const getRandomColor = () =>
    `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

  // === CORE LOGIC: DATA PROCESSING & RENDERING ===

  const renderStarsHTML = (rating) => {
    if (!rating || rating == 0) return "";
    let starsHTML = '<div class="comment-rating">';
    for (let i = 0; i < 5; i++) {
      starsHTML += `<span class="star ${
        i < rating ? "selected" : ""
      }">${"★"}</span>`;
    }
    starsHTML += "</div>";
    return starsHTML;
  };

  const buildCommentTree = (comments) => {
    const commentMap = new Map();
    comments.forEach((c) => {
      if (c && c.comment_id)
        commentMap.set(c.comment_id, { ...c, replies: [] });
    });
    const tree = [];
    commentMap.forEach((comment) => {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        commentMap.get(comment.parent_id).replies.push(comment);
      } else {
        tree.push(comment);
      }
    });
    return tree;
  };

  const createCommentHTML = (comment, level = 1) => {
    const author = escapeHTML(comment.name || "Ẩn danh");
    const initial = author.charAt(0).toUpperCase();
    const avatarColor = nameToColor(author);
    const timeDisplay = formatTimeAgo(comment.timestamp);
    const body = escapeHTML(comment.comment || "").replace(/\n/g, "<br>");
    const cid = escapeHTML(comment.comment_id);
    const replyButtonHTML =
      level < 4
        ? `<button class="reply-btn-text reply-btn" data-comment-id="${cid}" data-level="${level}">Trả lời</button>`
        : "";

    return `
      <div class="thread-item">
        <div class="avatar" style="background-color: ${avatarColor};">${initial}</div>
        <div class="col">
          <div class="meta">
            <span class="author">${author}</span>
            ${renderStarsHTML(comment.rating)}
            <span class="time status">${timeDisplay}</span>
          </div>
          <div class="body">${body}</div>
          <div class="actions">
            <button class="action-btn like-btn" data-cid="${cid}"><i class="far fa-thumbs-up"></i><span class="like-count">${
      comment.like_count || 0
    }</span></button>
            <button class="action-btn dislike-btn" data-cid="${cid}"><i class="far fa-thumbs-down"></i><span class="dislike-count">${
      comment.dislike_count || 0
    }</span></button>
            ${replyButtonHTML}
          </div>
          <div class="reply-form-container" id="reply-form-for-${cid}"></div>
          <div class="replies" id="replies-to-${cid}"></div>
        </div>
      </div>`;
  };

  const renderCommentList = (comments, container, level = 1) => {
    const sorted = comments
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const frag = document.createDocumentFragment();
    sorted.forEach((c) => {
      const wrapper = document.createElement("div");
      wrapper.className = "thread";
      wrapper.id = `thread-${c.comment_id}`;
      wrapper.innerHTML = createCommentHTML(c, level);
      frag.appendChild(wrapper);
      if (Array.isArray(c.replies) && c.replies.length && level < 4) {
        const repliesContainer = wrapper.querySelector(
          `#replies-to-${c.comment_id}`
        );
        if (repliesContainer)
          renderCommentList(c.replies, repliesContainer, level + 1);
      }
    });
    // Chỉ xóa các bình luận cũ, giữ lại bình luận tạm
    Array.from(container.children).forEach((child) => {
      if (
        !child.classList.contains("pending") &&
        !child.classList.contains("sent")
      ) {
        child.remove();
      }
    });
    container.prepend(frag);
  };

  const reRenderWithControls = () => {
    const sorted = state.tree
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const end = state.page * state.pageSize;
    renderCommentList(sorted.slice(0, end), el.container, 1);
    el.loadMore.style.display = sorted.length > end ? "inline-block" : "none";
  };

  // === API & EVENT HANDLING ===
  window.renderCommentsJSONP = function (resp) {
    try {
      if (!resp || !resp.success)
        throw new Error(resp?.error || "Không xác định");

      // Xóa các skeleton loader trước khi render
      el.container
        .querySelectorAll(".comment-skeleton")
        .forEach((sk) => sk.remove());

      resp.data.forEach((comment) => {
        const tempComment = document.getElementById(
          `thread-${comment.comment_id}`
        );
        if (tempComment) tempComment.remove();
      });

      state.raw = resp.data || [];
      state.tree = buildCommentTree(state.raw);
      state.lastFetch = Date.now();

      if (state.raw.length === 0 && el.container.children.length === 0) {
        el.container.innerHTML = `<div class="no-comments">
            <p>Hãy là người đầu tiên chia sẻ suy nghĩ của bạn nhé! 💬</p>
          </div>`;
        el.loadMore.style.display = "none";
        return;
      }
      reRenderWithControls();
    } catch (err) {
      el.container.innerHTML = `<p style="color:red;">Lỗi tải bình luận: ${err.message}</p>`;
    }
  };

  function loadComments() {
    if (el.container.children.length === 0) {
      el.container.innerHTML =
        '<div class="comment-skeleton"></div><div class="comment-skeleton"></div>';
    }
    const s = document.createElement("script");
    s.src = `${SCRIPT_URL}?page_id=${encodeURIComponent(
      PAGE_ID
    )}&callback=renderCommentsJSONP`;
    s.onerror = () => {
      el.container.innerHTML =
        '<p style="color:red;">Lỗi kết nối đến máy chủ bình luận.</p>';
      s.remove();
    };
    s.onload = () => s.remove();
    document.body.appendChild(s);
  }

  async function postComment({ name, comment, parent_id, comment_id, rating }) {
    const body = new URLSearchParams({
      action: "comment",
      name,
      comment,
      page_id: PAGE_ID,
      comment_id,
      parent_id: parent_id || "",
      device_id: DEVICE_ID,
      website: el.hpWebsite?.value || "",
      form_started_at: String(FORM_STARTED_AT),
      rating: rating || "0", // Thêm rating
    });

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
    });
    const result = await response.json();
    if (!result.success)
      throw new Error(result.error || "Gửi bình luận thất bại.");
    return result;
  }

  // [SỬA] Nâng cấp hàm postReaction để xử lý logic like/dislike chéo
  async function postReaction({
    comment_id,
    reaction,
    targetButton,
    oppositeButton,
  }) {
    const isTargetActive = targetButton.classList.contains("active");
    const isOppositeActive = oppositeButton.classList.contains("active");
    const finalReaction = isTargetActive ? "remove" : reaction;

    // --- Bắt đầu cập nhật giao diện tạm thời (Optimistic UI) ---

    // 1. Xử lý nút đối diện: Nếu nó đang active, tắt nó đi và giảm số đếm
    if (isOppositeActive) {
      oppositeButton.classList.remove("active");
      const oppositeCountSpan = oppositeButton.querySelector(
        reaction === "like" ? ".dislike-count" : ".like-count"
      );
      if (oppositeCountSpan) {
        oppositeCountSpan.textContent = Math.max(
          0,
          parseInt(oppositeCountSpan.textContent, 10) - 1
        );
      }
    }

    // 2. Xử lý nút vừa nhấn: Bật/tắt và tăng/giảm số đếm
    const targetCountSpan = targetButton.querySelector(
      reaction === "like" ? ".like-count" : ".dislike-count"
    );
    if (targetCountSpan) {
      const currentCount = parseInt(targetCountSpan.textContent, 10);
      targetCountSpan.textContent = isTargetActive
        ? currentCount - 1
        : currentCount + 1;
      targetButton.classList.toggle("active");
    }

    // --- Gửi yêu cầu lên server và xử lý nếu có lỗi ---
    try {
      const body = new URLSearchParams({
        action: "react",
        page_id: PAGE_ID,
        comment_id,
        device_id: DEVICE_ID,
        reaction: finalReaction,
      });
      const res = await fetch(SCRIPT_URL, { method: "POST", body });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Lỗi phản ứng.");
      }
      // Thành công: Giao diện đã được cập nhật, không cần làm gì thêm.
    } catch (error) {
      // Lỗi: Khôi phục lại trạng thái giao diện về như cũ
      if (isOppositeActive) {
        oppositeButton.classList.add("active");
        const oppositeCountSpan = oppositeButton.querySelector(
          reaction === "like" ? ".dislike-count" : ".like-count"
        );
        if (oppositeCountSpan)
          oppositeCountSpan.textContent =
            parseInt(oppositeCountSpan.textContent, 10) + 1;
      }
      if (targetCountSpan) {
        const currentCount = parseInt(targetCountSpan.textContent, 10);
        targetCountSpan.textContent = isTargetActive
          ? currentCount + 1
          : currentCount - 1;
        targetButton.classList.toggle("active");
      }
      throw error; // Ném lỗi ra ngoài để được xử lý
    }
  }

  // --- Main Form Logic ---
  const handleFormInteraction = () => {
    el.form.classList.add("active");
    el.formActions.style.display = "flex";
    el.commentInput.rows = 2;
    FORM_STARTED_AT = Date.now();
  };

  const resetMainForm = () => {
    el.form.reset();
    el.form.classList.remove("active");
    el.formActions.style.display = "none";
    el.submitBtn.disabled = true;
    el.commentInput.rows = 1;
    updateMainAvatar("?");
    el.ratingValueInput.value = "0"; // Reset rating
    updateStarSelection(0);
  };

  const updateMainAvatar = (name) => {
    const initial = name.charAt(0).toUpperCase();
    el.mainAvatar.textContent = initial;
    el.mainAvatar.style.backgroundColor =
      name === "?" ? getRandomColor() : nameToColor(name);
    el.mainAvatar.style.color = name === "?" ? "var(--dark-color)" : "#fff";
  };

  // --- Rating Stars Logic ---
  function updateStarSelection(rating) {
    el.ratingStars.forEach((star, index) => {
      star.classList.toggle("selected", index < rating);
    });
  }

  el.ratingStars.forEach((star) => {
    star.addEventListener("click", () => {
      const rating = parseInt(star.dataset.value, 10);
      el.ratingValueInput.value = rating;
      updateStarSelection(rating);
    });
    star.addEventListener("mouseover", () => {
      const hoverValue = parseInt(star.dataset.value, 10);
      el.ratingStars.forEach((s, i) =>
        s.classList.toggle("hover", i < hoverValue)
      );
    });
    star.addEventListener("mouseout", () => {
      el.ratingStars.forEach((s) => s.classList.remove("hover"));
    });
  });

  el.nameInput.addEventListener("input", () =>
    updateMainAvatar(el.nameInput.value || "?")
  );
  el.commentInput.addEventListener("input", () => {
    el.submitBtn.disabled = el.commentInput.value.trim() === "";
  });
  el.commentInput.addEventListener("focus", handleFormInteraction);
  el.nameInput.addEventListener("focus", handleFormInteraction);
  el.cancelBtn.addEventListener("click", resetMainForm);

  el.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    el.submitBtn.disabled = true;
    el.submitBtn.innerHTML = `<i class="fas fa-spinner fa-pulse"></i>`;

    const name = el.nameInput.value;
    const comment = el.commentInput.value;
    const rating = parseInt(el.ratingValueInput.value, 10);
    const tempCommentId = generateCommentId();

    const tempCommentData = {
      name,
      comment,
      comment_id: tempCommentId,
      timestamp: null,
      like_count: 0,
      dislike_count: 0,
      rating: rating,
      replies: [],
    };
    const tempCommentElement = document.createElement("div");
    tempCommentElement.className = "thread pending";
    tempCommentElement.id = `thread-${tempCommentId}`;
    tempCommentElement.innerHTML = createCommentHTML(tempCommentData, 1);

    const noCommentMsg = el.container.querySelector(".no-comments");
    if (noCommentMsg) noCommentMsg.remove();

    el.container.prepend(tempCommentElement);
    resetMainForm();

    try {
      await postComment({
        name,
        comment,
        parent_id: null,
        comment_id: tempCommentId,
        rating: rating,
      });

      const sentComment = document.getElementById(`thread-${tempCommentId}`);
      if (sentComment) {
        sentComment.classList.remove("pending");
        sentComment.classList.add("sent");
        sentComment.querySelector(".time.status").textContent = "vừa xong";
      }
    } catch (error) {
      const failedComment = document.getElementById(`thread-${tempCommentId}`);
      if (failedComment) {
        failedComment.classList.add("failed");
        failedComment.querySelector(".status").textContent = "(Lỗi gửi)";
        setTimeout(() => failedComment.remove(), 5000);
      }
      showToast(`Lỗi: ${error.message}`, false);
    } finally {
      el.submitBtn.disabled = false;
      el.submitBtn.innerHTML = "Bình luận";
    }
  });

  // --- Event Delegation for Likes, Dislikes, and Replies ---
  el.container.addEventListener("click", async (e) => {
    const likeBtn = e.target.closest(".like-btn");
    const dislikeBtn = e.target.closest(".dislike-btn");
    const replyBtn = e.target.closest(".reply-btn");

    if (likeBtn) {
      const actionsContainer = likeBtn.closest(".actions");
      const dislikeBtnRef = actionsContainer.querySelector(".dislike-btn");
      likeBtn.disabled = true;
      dislikeBtnRef.disabled = true;
      try {
        await postReaction({
          comment_id: likeBtn.dataset.cid,
          reaction: "like",
          targetButton: likeBtn,
          oppositeButton: dislikeBtnRef,
        });
      } catch (error) {
        showToast(`Lỗi: ${error.message}`, false);
      } finally {
        likeBtn.disabled = false;
        dislikeBtnRef.disabled = false;
      }
      return;
    }

    if (dislikeBtn) {
      const actionsContainer = dislikeBtn.closest(".actions");
      const likeBtnRef = actionsContainer.querySelector(".like-btn");
      dislikeBtn.disabled = true;
      likeBtnRef.disabled = true;
      try {
        await postReaction({
          comment_id: dislikeBtn.dataset.cid,
          reaction: "dislike",
          targetButton: dislikeBtn,
          oppositeButton: likeBtnRef,
        });
      } catch (error) {
        showToast(`Lỗi: ${error.message}`, false);
      } finally {
        dislikeBtn.disabled = false;
        likeBtnRef.disabled = false;
      }
      return;
    }

    if (replyBtn) {
      const parentId = replyBtn.dataset.commentId;
      const container = document.getElementById(`reply-form-for-${parentId}`);

      document.querySelectorAll(".reply-form-container").forEach((c) => {
        if (c.id !== container.id) c.innerHTML = "";
      });

      if (container.innerHTML) {
        container.innerHTML = "";
        return;
      }

      const currentUserName = el.nameInput.value;
      const userInitial = (currentUserName || "?").charAt(0).toUpperCase();
      const avatarColor = currentUserName
        ? nameToColor(currentUserName)
        : "var(--light-color)";
      const textColor = currentUserName ? "#fff" : "var(--dark-color)";

      container.innerHTML = `
        <div class="reply-box">
          <div class="avatar" style="background-color: ${avatarColor}; color: ${textColor};">${userInitial}</div>
          <div class="form-content">
            <form data-parent-id="${parentId}">
              <textarea placeholder="Viết câu trả lời..." required rows="1"></textarea>
              <div class="form-actions" style="display: flex;">
                 <button type="button" class="btn btn-secondary cancel-reply-btn">Hủy</button>
                 <button type="submit" class="btn btn-primary">Trả lời</button>
              </div>
            </form>
          </div>
        </div>`;

      const replyForm = container.querySelector("form");
      const replyTextarea = replyForm.querySelector("textarea");
      replyTextarea.focus();

      container
        .querySelector(".cancel-reply-btn")
        .addEventListener("click", () => {
          container.innerHTML = "";
        });

      replyForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!el.nameInput.value.trim()) {
          showToast(
            "Vui lòng nhập tên của bạn ở khung bình luận chính.",
            false
          );
          el.nameInput.focus();
          return;
        }
        const button = replyForm.querySelector("button[type='submit']");
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-pulse"></i>`;

        const name = el.nameInput.value;
        const comment = replyTextarea.value;
        const tempReplyId = generateCommentId();

        const parentLevel = parseInt(replyBtn.dataset.level, 10);
        const newLevel = parentLevel + 1;

        const tempReplyData = {
          name,
          comment,
          parent_id: parentId,
          comment_id: tempReplyId,
          timestamp: null,
          like_count: 0,
          dislike_count: 0,
        };

        const tempReplyElement = document.createElement("div");
        tempReplyElement.className = "thread pending";
        tempReplyElement.id = `thread-${tempReplyId}`;
        tempReplyElement.innerHTML = createCommentHTML(tempReplyData, newLevel);

        const repliesContainer = document.getElementById(
          `replies-to-${parentId}`
        );
        repliesContainer.prepend(tempReplyElement);
        container.innerHTML = "";

        try {
          await postComment({
            name,
            comment,
            parent_id: parentId,
            comment_id: tempReplyId,
          });
          const sentReply = document.getElementById(`thread-${tempReplyId}`);
          if (sentReply) {
            sentReply.classList.remove("pending");
            sentReply.classList.add("sent");
            sentReply.querySelector(".time.status").textContent = "vừa xong";
          }
        } catch (error) {
          const failedReply = document.getElementById(`thread-${tempReplyId}`);
          if (failedReply) {
            failedReply.classList.add("failed");
            failedReply.querySelector(".status").textContent = "(Lỗi gửi)";
            setTimeout(() => failedReply.remove(), 5000);
          }
          showToast(`Lỗi: ${error.message}`, false);
          button.disabled = false;
          button.innerHTML = "Trả lời";
        }
      });
    }
  });

  el.loadMore.addEventListener("click", () => {
    state.page++;
    reRenderWithControls();
  });

  // === INITIAL LOAD ===
  loadComments();
  updateMainAvatar("?");
})();
