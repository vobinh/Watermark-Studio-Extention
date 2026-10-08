# Watermark Studio - Chrome Extension (Manifest V3)

Extension đóng dấu bản quyền hình ảnh trực tiếp trên trình duyệt, hỗ trợ **Thanh bên (Side Panel)** và **Tab đầy đủ (Full Tab)**.

---

## 🌟 Các tính năng nổi bật của Extension

1. **Thanh bên (Side Panel) tiện lợi (Mặc định)**:
   - Mở ngay ở cạnh phải màn hình duyệt web.
   - Không bị đóng khi bạn bấm chuột ra ngoài trang web.
2. **Mở Tab mới đầy đủ (Full Tab)**:
   - Dễ dàng bấm nút `[ ⛶ Mở Tab đầy đủ ]` trên thanh công cụ để mở giao diện toàn màn hình 2 cột chuyên nghiệp.
   - Trạng thái ảnh và thiết lập được đồng bộ liền mạch giữa Side Panel và Full Tab.
3. **Tùy chọn chế độ mở mặc định**:
   - Bấm biểu tượng ⚙️ (Cài đặt) trên Header để chọn mở mặc định dạng **Side Panel** hoặc **Full Tab** khi bấm vào icon trên thanh công cụ trình duyệt.
4. **Chuột phải vào ảnh bất kỳ trên Web (Context Menu)**:
   - Click chuột phải vào ảnh trên bất kỳ website nào (Facebook, X, Báo chí, TMĐT...) $\rightarrow$ chọn **"Chèn Watermark (Mở thanh bên Side Panel)"** hoặc **"Chèn Watermark (Mở Tab mới)"** để nạp ảnh trực tiếp và vượt qua rào cản CORS.
5. **Hỗ trợ 3 chế độ Watermark: Chữ (Text), Logo (Hình ảnh), và [ 🌟 Cả hai (Text + Logo) ]**:
   - **Chế độ Chữ**: Đóng dấu văn bản bản quyền với phông, màu, bóng, viền.
   - **Chế độ Logo & Hình dạng cơ bản (Shapes)**:
     - Nạp file logo PNG trong suốt, SVG, JPG.
     - **Cắt khuôn hình dạng (Shape Masking)**: Hỗ trợ biến logo / ảnh avatar thành các hình dạng cơ bản: **Gốc (Original), Tròn (Circle), Bo góc (Rounded), Trái tim (Heart), Ngôi sao (Star), Chiếc khiên (Shield)**.
     - **Tùy chỉnh viền khuôn (Border Stroke)**: Điều chỉnh độ dày viền (0 - 8px) và màu sắc viền khuôn theo ý muốn.
     - **Logo biểu tượng có sẵn (Shape Presets)**: Chọn ngay các logo biểu tượng đẹp mắt tạo sẵn chỉ bằng 1 cú click: **❤️ Trái tim (With Love), ⭐ Ngôi sao (Gold Star), 🛡️ Khiên bảo vệ (Verified Emblem), ⭕ Dấu tròn (Official Seal), 💎 Kim cương (Diamond)** mà không cần tự tải ảnh lên.
   - **Chế độ Cả hai (Text + Logo)**: Cho phép xuất hiện cả Logo và Chữ cùng lúc trên ảnh, hỗ trợ tùy chỉnh vị trí (ví dụ Logo ở góc trên, Chữ ở góc dưới), kích thước và độ mờ độc lập cho từng lớp.
6. **Đồng bộ & Lưu tự động (Auto-save)**:
   - Tự động lưu logo thương hiệu và cấu hình watermark vào `chrome.storage.local`.
7. **Hỗ trợ đa ngôn ngữ (Tiếng Việt & English)**:
   - Chuyển đổi ngôn ngữ tức thì qua nút `[ 🌐 EN / VI ]` trên Header hoặc trong menu Cài đặt (⚙️).
   - Tự động đồng bộ và thay đổi ngôn ngữ cả giao diện lẫn menu chuột phải (Context Menus).
8. **Hỗ trợ tải về & sao chép**:
   - Xuất PNG, JPG, WEBP giữ nguyên 100% độ nét gốc.
   - Tải về trực tiếp qua Chrome Downloads API hoặc bấm sao chép ảnh vào Clipboard để dán ngay (Ctrl+V).

---

## 🚀 Hướng dẫn cài đặt vào trình duyệt (Chrome, Edge, Brave, Cốc Cốc)

### Bước 1: Build extension
Ở thư mục gốc dự án, chạy lệnh:
```bash
npm run build:ext
```
Thư mục hoàn chỉnh của extension sẽ được tạo ra tại: `extension/dist/`.

### Bước 2: Nạp extension vào trình duyệt
1. Mở trình duyệt Chrome/Edge và truy cập địa chỉ: `chrome://extensions/`
2. Bật công tắc **Chế độ dành cho nhà phát triển** (**Developer mode**) ở góc trên bên phải.
3. Bấm vào nút **Tải tiện ích đã giải nén** (**Load unpacked**).
4. Chọn thư mục `extension/dist` (đường dẫn: `/home/torin/Downloads/image-watermark-tool/extension/dist`).
5. Ghim (Pin) biểu tượng extension lên thanh công cụ trình duyệt để sử dụng thuận tiện.

---

## 📁 Cấu trúc thư mục

```
extension/
├── dist/                     # Thư mục build sẵn sàng để load vào Chrome
│   ├── manifest.json         # Manifest V3
│   ├── background.js         # Service Worker
│   ├── sidepanel.html        # Giao diện thanh bên
│   ├── fulltab.html          # Giao diện tab mới đầy đủ
│   ├── icons/                # Biểu tượng 16, 32, 48, 128px
│   └── assets/               # JS & CSS bundle
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── background/
│   │   └── background.ts     # Service Worker (Context Menu, Action, CORS fetch)
│   ├── components/
│   │   ├── Header.tsx        # Header với nút đổi Mode & Cài đặt mặc định
│   │   ├── PreviewCanvas.tsx # Canvas hiển thị và tương tác vị trí
│   │   ├── UploadZone.tsx    # Kéo thả, duyệt ảnh, phím tắt Ctrl+V
│   │   └── WatermarkControls.tsx # Bảng điều khiển Watermark 3 tab
│   ├── utils/
│   │   ├── storage.ts        # Lưu & đồng bộ qua chrome.storage.local
│   │   ├── watermarkRenderer.ts # Thuật toán vẽ Canvas & tải file
│   │   └── sampleImage.ts    # Tạo ảnh mẫu phong cảnh 4K
│   ├── types.ts
│   ├── sidepanel.tsx         # Entry point Side Panel
│   ├── fulltab.tsx           # Entry point Full Tab
│   ├── App.tsx               # Component chính hỗ trợ đa chế độ
│   └── index.css             # Tailwind CSS
├── sidepanel.html
├── fulltab.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```
