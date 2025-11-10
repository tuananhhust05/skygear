# SkyGear - Consignment Platform for Skydiving Gear

StockX-inspired consignment platform for skydiving gear, starting with rigs.

## Tech Stack

- **Frontend**: Next.js 14, Shadcn UI, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js 22, MongoDB
- **Payment**: Bridge.xyz integration
- **Containerization**: Docker & Docker Compose

## Features

### Seller Flow
- Select vetted rigger
- Choose delivery method (self-deliver or platform shipping)
- Provide rig details (canopy, rig, reserve, jump count, price)
- Upload verification images (serial number, reserve packing sheet, full rig view)
- Submit rig for inspection

### Rigger Flow
- View incoming rigs for inspection
- Generate detailed inspection reports
- Create verified listings with high-quality images
- Publish listings on the platform

### Buyer Flow
- Browse and search rigs with detailed reports
- One-click chat with riggers (WhatsApp/Telegram)
- Secure checkout with multiple payment options
- Pickup or shipping options

### Payment System
- Multi-party payouts: 88% to Seller, 10% to Rigger, 2% to Platform
- Payment methods: Cards, Stablecoins (USDC/USDT), Bank Transfers
- Integrated with Bridge.xyz

## Setup

### Prerequisites
- Node.js 22
- Docker & Docker Compose
- Bridge.xyz API key

### Environment Variables

Create `.env` files in `backend/` and `frontend/` directories:

**backend/.env:**
```
PORT=5000
MONGODB_URI=mongodb://mongo:27017/skygear
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
BRIDGE_API_KEY=your-bridge-api-key
BRIDGE_API_URL=https://api.bridge.xyz
UPLOAD_DIR=./uploads
```

**frontend/.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Running with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Running Locally (without Docker)

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**MongoDB:**
```bash
# Make sure MongoDB is running locally on port 27017
# Or use Docker: docker run -d -p 27017:27017 mongo:7.0
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Riggers
- `GET /api/riggers` - Get all vetted riggers
- `GET /api/riggers/:id` - Get rigger by ID
- `GET /api/riggers/:id/incoming` - Get incoming rigs for rigger
- `PUT /api/riggers/:id/listings/:listingId/inspect` - Update inspection

### Listings
- `GET /api/listings` - Get all listings (public)
- `GET /api/listings/:id` - Get listing by ID
- `POST /api/listings` - Create new listing (seller)
- `GET /api/listings/seller/mine` - Get seller's listings
- `PUT /api/listings/:id/images` - Update listing images

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/user/mine` - Get user's orders
- `PUT /api/orders/:id/status` - Update order status

### Payments
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/payments/webhook` - Bridge.xyz webhook
- `GET /api/payments/:orderId/status` - Get payment status

### Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images

## Project Structure

```
.
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/       # Auth middleware
│   ├── uploads/          # Uploaded images
│   └── server.js         # Express server
├── frontend/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── contexts/         # React contexts
├── mongo/
│   └── Dockerfile        # MongoDB Dockerfile
└── docker-compose.yml    # Docker Compose configuration
```

## Development

### Adding New Features

1. Backend: Add routes in `backend/routes/`
2. Frontend: Add pages in `frontend/app/`
3. Models: Update schemas in `backend/models/`

### Testing

```bash
# Backend tests (to be implemented)
cd backend
npm test

# Frontend tests (to be implemented)
cd frontend
npm test
```

## License

Proprietary - SkyGear Platform

