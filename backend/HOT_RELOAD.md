# Hot Reload Configuration

Backend đã được cấu hình để tự động restart khi code thay đổi sử dụng nodemon.

## Cấu hình

### 1. nodemon.json
- Watch các thư mục: `routes`, `models`, `middleware`, `server.js`
- Ignore: `node_modules`, `uploads`, logs
- Sử dụng polling mode để hoạt động tốt trong Docker trên Windows

### 2. Docker Compose
- Volume mount: `./backend:/app` để sync code
- Exclude `node_modules` để tránh conflict
- Command: `npm run dev` (sử dụng nodemon)

### 3. Package.json Scripts
- `npm start`: Chạy production mode
- `npm run dev`: Chạy development mode với nodemon
- `npm run watch`: Chạy với watch mode tùy chỉnh

## Cách sử dụng

### Với Docker Compose
```bash
# Start services
docker-compose up

# Hoặc rebuild nếu cần
docker-compose up --build

# Xem logs để kiểm tra nodemon
docker-compose logs -f backend
```

### Local Development (không dùng Docker)
```bash
cd backend
npm run dev
```

## Kiểm tra Hot Reload

1. Start backend: `docker-compose up`
2. Sửa file trong `backend/routes/` hoặc `backend/models/`
3. Xem logs: Bạn sẽ thấy:
   ```
   [nodemon] restarting due to changes...
   [nodemon] starting `node server.js`
   ```

## Troubleshooting

### Nodemon không restart
1. Kiểm tra logs: `docker-compose logs backend`
2. Đảm bảo volume mount đúng: `./backend:/app`
3. Kiểm tra nodemon.json có đúng format không
4. Thử restart container: `docker-compose restart backend`

### File changes không được detect (Windows)
- Nodemon đã được cấu hình với `polling: true` và `legacyWatch: true`
- Nếu vẫn không hoạt động, thử tăng delay: `"delay": 1000`

### Node modules conflict
- Volume `/app/node_modules` được exclude để tránh conflict
- Nếu có vấn đề, rebuild: `docker-compose up --build`

