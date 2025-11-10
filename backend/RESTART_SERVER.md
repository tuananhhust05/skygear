# Restart Server để áp dụng thay đổi

## Nếu dùng Docker Compose:

```bash
# Restart backend service
docker-compose restart backend

# Hoặc rebuild và restart
docker-compose up -d --build backend

# Xem logs để kiểm tra
docker-compose logs -f backend
```

## Nếu chạy local (không dùng Docker):

```bash
# Dừng server (Ctrl+C) và chạy lại
cd backend
npm run dev
```

## Kiểm tra route đã hoạt động:

1. Kiểm tra route list:
```bash
curl http://localhost:5656/api/routes
```

2. Test route profile:
```bash
curl -X PUT http://localhost:5656/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profile": {"firstName": "Test"}}'
```

## Lưu ý:

- Route `PUT /api/auth/profile` đã được thêm vào `backend/routes/auth.js`
- Route được đăng ký trong `backend/server.js` tại dòng 66: `app.use('/api/auth', authRoutes);`
- Nếu vẫn lỗi, kiểm tra logs backend để xem có error gì không

