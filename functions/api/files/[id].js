import { google } from "googleapis";

export async function onRequest(context) {
  try {
    // --- BƯỚC 1: KIỂM TRA QUYỀN TRUY CẬP (TÙY CHỌN) ---
    // Đây là nơi bạn có thể thêm logic để kiểm tra xem người dùng có phải là thành viên,
    // đã đăng nhập hay chưa, trước khi cho phép họ xem file.
    // Ví dụ: const isAllowed = await checkUserPermission(context.request);
    // if (!isAllowed) return new Response('Unauthorized', { status: 401 });

    // --- BƯỚC 2: LẤY ID FILE VÀ "CHÌA KHÓA" BÍ MẬT ---
    const googleFileId = context.params.id; // Lấy ID từ URL (ví dụ: /api/files/abc -> id = 'abc')
    const credentialsJson = context.env.GOOGLE_CREDENTIALS; // Lấy "chìa khóa" từ biến môi trường bí mật

    if (!credentialsJson) {
      return new Response("Server is not configured correctly.", {
        status: 500,
      });
    }
    const credentials = JSON.parse(credentialsJson);

    // --- BƯỚC 3: XÁC THỰC VÀ GỌI GOOGLE DRIVE API ---
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"], // Yêu cầu quyền chỉ đọc
    });
    const drive = google.drive({ version: "v3", auth });

    // Yêu cầu lấy nội dung file từ Google Drive
    const fileResponse = await drive.files.get(
      { fileId: googleFileId, alt: "media" },
      { responseType: "stream" } // Yêu cầu trả về dạng stream để tiết kiệm bộ nhớ server
    );

    // --- BƯỚC 4: GỬI DỮ LIỆU FILE VỀ CHO TRÌNH DUYỆT ---
    // Tạo response và copy các header quan trọng (như content-type) từ Google
    const responseHeaders = new Headers({
      "Content-Type": fileResponse.headers["content-type"],
      "Content-Length": fileResponse.headers["content-length"],
      // Header này giúp trình duyệt cache file hiệu quả hơn
      "Cache-Control": "public, max-age=604800, immutable",
    });

    // Stream (truyền) nội dung file trực tiếp về trình duyệt
    return new Response(fileResponse.data, { headers: responseHeaders });
  } catch (error) {
    console.error("Cloudflare Function Error:", error);
    return new Response("An error occurred while fetching the file.", {
      status: 500,
    });
  }
}
