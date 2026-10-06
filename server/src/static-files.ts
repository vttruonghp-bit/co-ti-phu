/**
 * Phục vụ giao diện đã build (client/dist) trên cùng cổng với Socket.IO.
 * Đường dẫn không có đuôi tệp (ví dụ /?phong=ABC234) trả về index.html.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.wasm': 'application/wasm',
};

export type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

function send(res: ServerResponse, status: number, text: string) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** Đường dẫn tệp trong `root` ứng với URL, null nếu URL hỏng hoặc trỏ ra ngoài `root`. */
function fileFor(root: string, url: string): string | null {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(url, 'http://x').pathname);
  } catch {
    return null;
  }
  if (pathname.includes('\0')) return null;
  const path = resolve(root, `.${pathname}`);
  return path === root || path.startsWith(root + sep) ? path : null;
}

export function staticFiles(dir: string): RequestHandler {
  const root = resolve(dir);
  const index = join(root, 'index.html');

  async function serve(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return send(res, 405, 'Phương thức không được hỗ trợ');
    }
    const path = fileFor(root, req.url ?? '/');
    if (path === null) return send(res, 404, 'Không tìm thấy');
    let file = path;
    if (!(await isFile(file))) {
      // Tệp có đuôi mà không có thì báo thiếu, còn lại là đường dẫn của trang.
      if (extname(path) !== '') return send(res, 404, 'Không tìm thấy');
      file = index;
      if (!(await isFile(file))) {
        return send(res, 404, 'Chưa có giao diện: chạy "npm run build" ở thư mục gốc trước');
      }
    }
    const hashed = file.startsWith(join(root, 'assets') + sep);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file)
      .on('error', () => res.destroy())
      .pipe(res);
  }

  return (req, res) => {
    serve(req, res).catch(() => {
      if (!res.headersSent) send(res, 500, 'Lỗi máy chủ');
      else res.destroy();
    });
  };
}
