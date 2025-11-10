# SkyGear Setup Guide

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose installed
- Node.js 22 (for local development)
- Bridge.xyz API key

### 2. Environment Setup

#### Backend Environment
Create `backend/.env`:
```env
PORT=5656
MONGODB_URI=mongodb://mongo:27017/skygear
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
BRIDGE_API_KEY=your-bridge-api-key-here
BRIDGE_API_URL=https://api.bridge.xyz
UPLOAD_DIR=./uploads
```

#### Frontend Environment
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://skygear.online/api
```

### 3. Start with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: https://skygear.online
- MongoDB: localhost:27017

### 5. Create Test Users

#### Create a Seller
1. Go to http://localhost:3000/register
2. Select "Seller" role
3. Fill in details and register

#### Create a Rigger
1. Go to http://localhost:3000/register
2. Select "Rigger" role
3. Fill in details and register
4. **Note**: Rigger verification status needs to be set to "approved" in the database for them to appear in the rigger list

#### Create a Buyer
1. Go to http://localhost:3000/register
2. Select "Buyer" role
3. Fill in details and register

### 6. Approve a Rigger (Database)

To make a rigger appear in the vetted riggers list, update their verification status:

```javascript
// Connect to MongoDB
// Use MongoDB Compass or mongo shell
db.users.updateOne(
  { email: "rigger@example.com" },
  { $set: { "riggerInfo.verificationStatus": "approved" } }
)
```

### 7. Test the Flow

1. **Seller Flow**:
   - Login as seller
   - Go to "Submit Rig"
   - Fill in rig details
   - Upload verification images
   - Submit

2. **Rigger Flow**:
   - Login as rigger
   - Go to Rigger Dashboard
   - View incoming rigs
   - Inspect and create listing

3. **Buyer Flow**:
   - Browse listings
   - View listing details
   - Contact rigger (WhatsApp)
   - Proceed to checkout
   - Complete payment

## Local Development (without Docker)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or install MongoDB locally
```

## Bridge.xyz Integration

1. Sign up at https://bridge.xyz
2. Get your API key
3. Add it to `backend/.env` as `BRIDGE_API_KEY`
4. Configure webhook URL in Bridge.xyz dashboard: `http://your-domain.com/api/payments/webhook`

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB container is running: `docker ps`
- Check MongoDB logs: `docker-compose logs mongo`

### Backend Issues
- Check backend logs: `docker-compose logs backend`
- Verify environment variables are set correctly
- Ensure MongoDB is accessible

### Frontend Issues
- Check frontend logs: `docker-compose logs frontend`
- Verify `NEXT_PUBLIC_API_URL` is correct
- Clear `.next` cache: `rm -rf frontend/.next`

### Image Upload Issues
- Ensure `backend/uploads` directory exists
- Check file permissions
- Verify multer configuration

## Production Deployment

1. Update environment variables for production
2. Use production MongoDB (MongoDB Atlas recommended)
3. Set up proper SSL certificates
4. Configure Bridge.xyz webhook for production URL
5. Use environment-specific Docker images
6. Set up monitoring and logging
7. Configure backup strategies

## Support

For issues or questions, please refer to the main README.md or contact the development team.

