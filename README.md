# FlySmart - Dynamic Flight Booking System

**A real-time flight booking platform with intelligent dynamic pricing**

---

## 📋 Project Overview

FlySmart is a full-stack flight booking application that demonstrates dynamic pricing algorithms similar to real-world airline systems. The platform features real-time price updates, demand-based surge pricing, and an admin console for controlling the pricing simulator.

**Built for:** Infosys Internship Project  
**Tech Stack:** Next.js (Frontend) + FastAPI (Backend) + SQLite (Database)

---

## ✨ Key Features

### 1. **Dynamic Pricing Engine**
- **Time-Based Pricing**: Prices increase as departure time approaches (up to 1.6x)
- **Seat Scarcity**: Prices rise when seats fill up (exponential curve)
- **Demand Surge**: Event-based price spikes (e.g., IPL matches, festivals)
- **Same-Day Surge**: Aggressive pricing within 24 hours (0.5% per 5 minutes)
- **Price Clamping**: Prevents extreme prices (0.6x - 3.0x base price)

### 2. **Real-Time Updates**
- WebSocket integration for live price changes
- Price increase indicators on search results
- Countdown timers for price locks
- Instant updates across all connected clients

### 3. **Smart Booking Flow**
- **Two-Phase Booking**: Reserve (5-min hold) → Confirm
- **Price Locking**: Snapshot price during reservation
- **Seat Validation**: Prevents overbooking
- **PNR Generation**: Unique 6-character booking codes
- **Transaction Safety**: Atomic operations with retry logic

### 4. **Admin Console**
- **Start/Stop Engine**: Control automatic price updates
- **Hike Prices**: Manually trigger price recalculation
- **Event Generator**: Simulate demand surges for specific cities
- **Reset Demand**: Clear all active events
- **Real-time Monitoring**: View simulator status and flight stats

### 5. **User Interface**
- **Homepage**: Popular routes with dynamic pricing
- **Search**: One-way/Round-trip with city autocomplete
- **Filters**: Price range, airlines, sort by price/duration
- **Booking Modal**: Passenger details and payment simulation
- **PNR Lookup**: Check booking status

---

## 🏗️ Architecture

```
FlySmart/
├── backend/                 # FastAPI Server
│   ├── app/
│   │   ├── api/v1/         # REST API endpoints
│   │   ├── services/       # Business logic (pricing, booking, simulator)
│   │   ├── db/             # Database models
│   │   └── utils/          # Helper functions
│   └── main.py             # Application entry point
│
└── frontend/               # Next.js App
    ├── app/                # Pages (homepage, results, admin)
    ├── components/         # Reusable UI components
    ├── hooks/              # Custom React hooks (WebSocket)
    └── lib/                # Services and utilities
```

---

## 🚀 How It Works

### Pricing Algorithm

The dynamic price is calculated using multiple factors:

```python
final_price = clamp(
    base_price × time_factor × seat_factor × demand_factor × sameday_factor,
    min = 0.6 × base_price,
    max = 3.0 × base_price
)
```

**Factors:**
1. **Time Factor**: Increases as departure approaches (half-life: 48 hours)
2. **Seat Factor**: Exponential curve based on availability
3. **Demand Factor**: Event-based multiplier (0-45% increase)
4. **Same-Day Factor**: Linear growth (0.5% per 5-min interval)

### Simulator Workflow

1. **Start Engine** → Begins automatic price updates every 60 seconds
2. **Tick/Hike Prices** → Manually recalculates all flight prices
3. **Trigger Event** → Creates demand surge for selected city
4. **WebSocket Broadcast** → Pushes updates to all connected clients
5. **Frontend Updates** → Displays new prices with increase indicators

### Booking Process

```
User Search → View Results → Select Flight → Reserve (5 min hold)
→ Enter Details → Confirm Payment → Booking Confirmed (PNR Generated)
```

**Price Lock:** The price shown during reservation is locked for 5 minutes, protecting users from price increases during checkout.

---

## 🎯 Demonstration Scenarios

### Scenario 1: Time-Based Pricing
1. Search for a flight departing in 3 days
2. Note the price
3. Click "Hike Prices" multiple times
4. Observe price increase as "time to departure" decreases

### Scenario 2: Demand Surge
1. Select a city (e.g., Mumbai)
2. Trigger "IPL Match" event
3. Click "Hike Prices"
4. See prices spike for flights to/from Mumbai

### Scenario 3: Real-Time Updates
1. Open search results in two browser windows
2. Click "Hike Prices" in admin panel
3. Watch both windows update simultaneously via WebSocket

### Scenario 4: Booking Flow
1. Search and select a flight
2. Reserve seats (price locked for 5 minutes)
3. Complete booking
4. Receive PNR code
5. Look up booking using PNR

---

## 📊 Technical Highlights

### Backend (FastAPI)
- **RESTful API**: 20+ endpoints for flights, bookings, admin
- **WebSocket**: Real-time price broadcasting
- **SQLAlchemy ORM**: Type-safe database operations
- **Transaction Safety**: Atomic booking confirmations with retry logic
- **Fare History**: Audit trail for all price changes

### Frontend (Next.js)
- **Server-Side Rendering**: Fast initial page loads
- **React Hooks**: Custom WebSocket hook for real-time updates
- **TypeScript**: Type-safe API calls
- **Responsive Design**: Mobile-friendly UI
- **Dark Mode**: Automatic theme detection

### Database (SQLite)
- **Flights**: Origin, destination, prices, seats, timestamps
- **Bookings**: PNR, passenger details, status, payment
- **FareHistory**: Price change audit log
- **DemandScore**: Event-based surge tracking

---

## 🔧 Setup & Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access
- **Frontend**: https://skyfly-dynamic-flight-booking.vercel.app
- **Backend API**: https://flysmart-dynamic-flight-booking.onrender.com
- **API Docs**: https://flysmart-dynamic-flight-booking.onrender.com/docs
- **Admin Panel**: https://skyfly-dynamic-flight-booking.vercel.app/admin


> Note: Admin credentials are hardcoded in `frontend/lib/utils/auth.ts` for demo purposes.

---

## 📈 Key Metrics

- **API Response Time**: < 200ms average
- **WebSocket Latency**: < 50ms
- **Price Update Frequency**: 60 seconds (configurable)
- **Booking Hold Time**: 5 minutes
- **Max Price Increase**: 3x base price
- **Min Price Floor**: 0.6x base price

---

## 🎓 Learning Outcomes

This project demonstrates:
- ✅ Full-stack development (React + Python)
- ✅ Real-time communication (WebSockets)
- ✅ Complex business logic (dynamic pricing algorithms)
- ✅ Database design and transactions
- ✅ RESTful API design
- ✅ State management in React
- ✅ Responsive UI/UX design

---

## 🚧 Future Enhancements

1. **Email Notifications**: Booking confirmations via email
2. **Payment Integration**: Stripe/Razorpay integration
3. **Seat Selection**: Visual seat map
4. **Multi-currency**: USD, EUR support
5. **Analytics Dashboard**: Revenue tracking, popular routes
6. **Mobile App**: React Native version
7. **Price Alerts**: Notify users of price drops

---

## 📝 Popular Routes

The homepage displays 6 curated popular routes:
1. **HYD → BLR** (Hyderabad to Bengaluru)
2. **HYD → DEL** (Hyderabad to Delhi)
3. **HYD → MAA** (Hyderabad to Chennai)
4. **BLR → DEL** (Bengaluru to Delhi)
5. **BLR → BOM** (Bengaluru to Mumbai)
6. **DEL → BOM** (Delhi to Mumbai)

---

## 👨‍💻 Developer

**Yashwanth Kesanam**  
Infosys Internship Project  
Email: yashwanthkesanam9gmail.com


---

## 🙏 Acknowledgments

- Infosys Internship Program
- FastAPI & Next.js Communities
- Open-source contributors
