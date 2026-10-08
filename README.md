# Watermark Studio - Tiện Ích Đóng Dấu & Chú Thích Ảnh Cho Trình Duyệt

<div align="center">

![Watermark Studio](extension/public/icons/icon-128.png)

**Tiện ích mở rộng Chrome (Manifest V3) chuyên nghiệp dùng để đóng dấu bản quyền hình ảnh, chèn logo, và chỉnh sửa/chú thích ảnh (Photo Annotation Studio) trực tiếp trên trình duyệt.**

Hỗ trợ giao diện **Thanh bên (Side Panel)** & **Tab độc lập (Full Tab)** | Đa ngôn ngữ (Tiếng Việt & English) | Lưu trữ ngoại tuyến an toàn

</div>

---

## ✨ Điểm Nổi Bật

- 🚀 **Tiện lợi tức thì**: Mở nhanh ở thanh bên (Side Panel) hoặc mở tab lớn (Full Tab) với bố cục làm việc 2 cột chuyên nghiệp.
- 🖱️ **Tích hợp chuột phải (Context Menu)**: Nhấp chuột phải vào bất kỳ hình ảnh nào trên web (Facebook, X/Twitter, báo điện tử, sàn TMĐT...) để đưa thẳng vào studio, tự động xử lý rào cản CORS.
- 📋 **Nhận diện Clipboard linh hoạt**: Nhấn `Ctrl + V` ở bất kỳ đâu để dán ảnh chụp màn hình hoặc kéo thả file ảnh cực nhanh.
- 🎨 **Studio Chú Thích & Vẽ Đè (Annotation Studio)**: Công cụ vẽ mũi tên, hình chữ nhật, hình tròn, ngôi sao, trái tim, bút tự do, bút dạ quang, làm mờ/mosaic và chèn ghi chú văn bản tương tác.
- 🔒 **Bảo mật & Riêng tư**: Toàn bộ thao tác xử lý ảnh (render canvas, đóng dấu) diễn ra 100% tại máy người dùng (client-side), không tải dữ liệu lên bất kỳ máy chủ nào.

---

## 🛠️ Tính Năng Chi Tiết

### 1. Đóng Dấu Bản Quyền (Watermark Studio)
* **3 Chế độ linh hoạt**:
  * 🔤 **Chữ (Text)**: Tùy biến nội dung, phông chữ, cỡ chữ, màu sắc, viền chữ (stroke), đổ bóng (shadow), độ mờ (opacity) và góc xoay.
  * 🖼️ **Logo & Biểu Tượng (Image / Shapes)**:
    * Tải logo cá nhân (PNG trong suốt, SVG, JPG).
    * **Cắt khuôn hình dạng (Shape Masking)**: Bo tròn, Tròn, Trái tim, Ngôi sao, Khiên bảo vệ.
    * **Thư viện biểu tượng có sẵn (Shape Presets)**: Chọn nhanh biểu tượng Trái tim, Ngôi sao vàng, Khiên bảo vệ, Dấu mộc tròn, Kim cương mà không cần tải file.
    * Tùy chỉnh đường viền khuôn (độ dày, màu viền).
  * 🌟 **Kết Hợp (Text + Logo)**: Hiển thị đồng thời cả Logo và Chữ, tùy chỉnh vị trí và thuộc tính độc lập cho từng thành phần.
* **Định vị chính xác**:
  * 9 vị trí cố định (Góc trên/dưới/giữa, trái/phải).
  * Chế độ **Lưới lặp lại (Tile Grid)** phủ mờ bảo vệ toàn bộ bề mặt ảnh.
  * Tọa độ tự do (Custom X/Y) và chỉnh góc nghiêng.

### 2. Studio Chú Thích Hình Ảnh (Photo Annotation Studio)
* **Bộ công cụ vẽ đa dạng**:
  * ⬛ Hình chữ nhật, ⚪ Hình elip/tròn, ➡️ Mũi tên chỉ dẫn, 📏 Đường thẳng, ⭐ Ngôi sao, ❤️ Trái tim.
  * ✏️ Bút vẽ tự do (Pen) & 🖌️ Bút dạ quang làm nổi bật (Highlighter).
  * 📝 **Hộp ghi chú văn bản (Text Box)**: Đặt vị trí tự do, hỗ trợ kéo đổi kích thước, chỉnh màu chữ, cỡ chữ và viền hộp.
  * 💧 **Công cụ làm mờ (Mosaic/Blur)**: Che thông tin nhạy cảm (SĐT, biển số xe, thông tin cá nhân).
* **Điều khiển linh hoạt**:
  * Chỉnh độ mờ màu nền (Fill Opacity), độ dày nét vẽ (Stroke Width), bảng màu phong phú.
  * Hoàn tác (Undo) / Làm lại (Redo) / Xóa toàn bộ.
  * Đổi ảnh nền chú thích nhanh, sao chép vào bộ nhớ tạm hoặc áp dụng thẳng về Watermark Studio.

### 3. Tùy Chọn & Trải Nghiệm Người Dùng
* **Đồng bộ tự động**: Tự động lưu cấu hình watermark, logo thương hiệu và cài đặt vào `chrome.storage.local`.
* **Chế độ mở mặc định**: Cài đặt mở ưu tiên dạng **Side Panel** hoặc **Full Tab**.
* **Đa ngôn ngữ (i18n)**: Chuyển đổi mượt mà giữa Tiếng Việt và English.
* **Xuất file chất lượng cao**: Lưu file định dạng PNG, JPG, WebP giữ nguyên độ phân giải gốc, hoặc sao chép thẳng vào Clipboard để dán nhanh (Ctrl + V).

---

## 💻 Hướng Dẫn Cài Đặt & Phát Triển

### Yêu cầu môi trường
- [Node.js](https://nodejs.org/) (phiên bản 18 trở lên khuyến nghị)
- Trình duyệt nhân Chromium: Google Chrome, Microsoft Edge, Brave, Cốc Cốc...

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Build Tiện Ích (Extension)
Để biên dịch mã nguồn sang thư mục `extension/dist/`:
```bash
npm run build:ext
```

### 3. Nạp Extension Vào Trình Duyệt
1. Mở trình duyệt Chrome/Edge và truy cập: `chrome://extensions/`
2. Bật công tắc **Chế độ dành cho nhà phát triển** (**Developer mode**) ở góc trên bên phải.
3. Nhấp vào nút **Tải tiện ích đã giải nén** (**Load unpacked**).
4. Chọn thư mục `extension/dist` trong dự án.
5. Ghim tiện ích vào thanh công cụ trình duyệt để tiện sử dụng.

### 4. Chạy Bản Thử Nghiệm Web Trực Tiếp (Dev Server)
Nếu muốn phát triển và xem trước giao diện nhanh trên trình duyệt web:
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`

---

## 📂 Cấu Trúc Mã Nguồn

```text
image-watermark-tool/
├── extension/
│   ├── dist/                   # Bản build hoàn chỉnh để nạp vào Chrome
│   ├── public/                 # Icons và manifest.json gốc
│   ├── src/
│   │   ├── background/         # Service Worker (xử lý Context Menu, CORS fetch)
│   │   ├── components/         # Giao diện React
│   │   │   ├── Header.tsx                 # Thanh điều hướng, chọn mode, đổi ngôn ngữ
│   │   │   ├── PreviewCanvas.tsx          # Canvas hiển thị & tương tác watermark
│   │   │   ├── UploadZone.tsx             # Tải ảnh, kéo thả, paste clipboard
│   │   │   ├── WatermarkControls.tsx      # Bảng điều khiển Watermark (Text, Logo, Cả hai)
│   │   │   └── ImageAnnotationModal.tsx   # Studio vẽ & chú thích ảnh
│   │   ├── utils/
│   │   │   ├── storage.ts                 # Wrapper lưu trữ chrome.storage.local
│   │   │   ├── watermarkRenderer.ts       # Logic render Canvas chất lượng cao
│   │   │   └── sampleImage.ts             # Khởi tạo ảnh mẫu demo
│   │   ├── sidepanel.tsx       # Điểm vào (Entry) cho chế độ Side Panel
│   │   ├── fulltab.tsx         # Điểm vào (Entry) cho chế độ Full Tab
│   │   ├── App.tsx             # Ứng dụng trung tâm
│   │   └── index.css           # Tailwind CSS styling
│   ├── sidepanel.html          # HTML template cho Side Panel
│   ├── fulltab.html            # HTML template cho Full Tab
│   └── vite.config.ts          # Cấu hình Vite build multi-page extension
├── package.json
└── README.md
```

---

## 🛡️ Giấy Phép & Bản Quyền

Dự án được phát triển dưới bản quyền mã nguồn mở. Toàn bộ tính năng bảo mật dữ liệu hình ảnh người dùng hoàn toàn ngoại tuyến.
