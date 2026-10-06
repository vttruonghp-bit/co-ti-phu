# Cờ Tỉ Phú

Game cờ tỉ phú chơi trên web qua mạng cho 2–6 người.

Luật chơi đầy đủ: [docs/luat-choi.md](docs/luat-choi.md).

## Cấu trúc

| Thư mục   | Nội dung                                                             |
| --------- | -------------------------------------------------------------------- |
| `shared/` | Luật chơi và dữ liệu dùng chung: bàn cờ 40 ô, thẻ, hằng số, giá tiền |
| `server/` | Server Node.js + Socket.IO, là "trọng tài" duy nhất của ván chơi     |
| `client/` | Giao diện React + Vite                                               |

## Chạy trên máy

Cần Node.js 22 trở lên.

```bash
npm install
npm run dev:server   # cửa sổ 1: server ở http://localhost:3001
npm run dev:client   # cửa sổ 2: mở http://localhost:5173
```

## Chạy bản thật (một tiến trình)

```bash
npm install
npm run build        # dựng giao diện vào client/dist
npm start            # server phục vụ cả game và Socket.IO ở http://localhost:3001
```

Biến môi trường: `PORT` (mặc định 3001), `CLIENT_DIST` (thư mục giao diện đã dựng), `CLIENT_ORIGIN` (thêm nguồn được phép kết nối, cách nhau bằng dấu phẩy).

## Kiểm tra

```bash
npm run typecheck
npm test
npm run format:check
```
