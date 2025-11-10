# MongoDB Connection Guide

## Connection Status

Backend đã được cấu hình để kết nối với MongoDB với các tính năng:

### ✅ Tính năng đã có:

1. **Auto-connect**: Tự động kết nối khi server khởi động
2. **Auto-retry**: Tự động thử lại nếu kết nối thất bại (mỗi 5 giây)
3. **Auto-reconnect**: Tự động kết nối lại khi bị ngắt kết nối
4. **Connection events**: Theo dõi các sự kiện kết nối (error, disconnected, reconnected)
5. **Health check**: Endpoint `/health` hiển thị trạng thái MongoDB

## Kiểm tra kết nối

### 1. Kiểm tra qua Health Check API

```bash
curl https://skygear.online/health
```

Response khi MongoDB đã kết nối:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "mongodb": {
    "status": "connected",
    "readyState": 1
  }
}
```

Response khi MongoDB chưa kết nối:
```json
{
  "status": "degraded",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "mongodb": {
    "status": "disconnected",
    "readyState": 0
  }
}
```

### 2. Kiểm tra qua logs

Khi server khởi động, bạn sẽ thấy:
- `Attempting to connect to MongoDB...`
- `✅ MongoDB Connected successfully` (nếu thành công)
- `❌ MongoDB connection failed: ...` (nếu thất bại)

### 3. MongoDB Connection States

- `0` = disconnected
- `1` = connected ✅
- `2` = connecting
- `3` = disconnecting

## Cấu hình

### Environment Variables

Trong `backend/.env`:
```env
MONGODB_URI=mongodb://mongo:27017/skygear
```

### Connection String Formats

**Docker Compose (default):**
```
mongodb://mongo:27017/skygear
```

**Local MongoDB:**
```
mongodb://localhost:27017/skygear
```

**MongoDB Atlas:**
```
mongodb+srv://username:password@cluster.mongodb.net/skygear
```

## Troubleshooting

### MongoDB không kết nối được

1. **Kiểm tra MongoDB đang chạy:**
   ```bash
   docker ps | grep mongo
   ```

2. **Kiểm tra logs MongoDB:**
   ```bash
   docker-compose logs mongo
   ```

3. **Kiểm tra network:**
   ```bash
   docker network ls
   docker network inspect skygear-network
   ```

4. **Test kết nối từ backend container:**
   ```bash
   docker exec -it skygear-backend sh
   # Trong container
   ping mongo
   ```

### Lỗi thường gặp

**"MongoServerError: Authentication failed"**
- Kiểm tra username/password trong connection string

**"MongoNetworkError: connect ECONNREFUSED"**
- MongoDB chưa sẵn sàng hoặc không chạy
- Kiểm tra MongoDB container đang chạy

**"MongoServerSelectionError: getaddrinfo ENOTFOUND mongo"**
- Vấn đề về DNS trong Docker network
- Đảm bảo cả backend và mongo trong cùng network

## Manual Connection Test

Nếu muốn test kết nối thủ công:

```bash
# Vào MongoDB container
docker exec -it skygear-mongo mongosh

# Hoặc từ backend container
docker exec -it skygear-backend sh
# Sau đó cài mongosh nếu cần
```

## Production Recommendations

1. **Connection Pooling**: Đã được mongoose tự động xử lý
2. **Retry Logic**: Đã có sẵn trong code
3. **Monitoring**: Sử dụng health check endpoint
4. **Backup**: Cấu hình MongoDB backup strategy
5. **SSL/TLS**: Sử dụng cho MongoDB Atlas hoặc production

