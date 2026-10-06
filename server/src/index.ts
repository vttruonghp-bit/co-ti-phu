import { DEV_ORIGINS, createAppServer } from './app';

const PORT = Number(process.env.PORT ?? 3001);

// CLIENT_ORIGIN: thêm trang ở cổng khác được kết nối, cách nhau bằng dấu phẩy.
const extraOrigins = (process.env.CLIENT_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = createAppServer({
  clientDist: process.env.CLIENT_DIST || undefined,
  corsOrigins: [...DEV_ORIGINS, ...extraOrigins],
});

app.httpServer.listen(PORT, () => {
  console.log(`Server Cờ tỉ phú chạy ở cổng ${PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    setTimeout(() => process.exit(0), 2000).unref();
    void app.close().then(() => process.exit(0));
  });
}
