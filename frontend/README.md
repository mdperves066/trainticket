# Frontend - Bangladesh Railway Online Booking

Modern, responsive Next.js 14 App Router web client for Bangladesh Railway online ticket reservations.

## 🚀 Features
- **Train Search**: Station auto-complete and date selector.
- **Seat Selection**: Interactive seat classes (Shovon Chair, Snigdha, AC Berth, etc.) with real-time seat inventory.
- **Client-Side PDF Generation**: Digital Bangladesh Railway tickets with passenger info and itinerary details.
- **User Dashboard**: Profile management + **"My Bookings"** tab to view ticket history, re-download PDFs, and cancel active reservations.
- **Secure Authentication**: Protected routes with token persistence.

## 📦 Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env` (or use the pre-configured default):
```env
NEXT_PUBLIC_ENDPOINT=http://localhost:8000
NEXT_PUBLIC_SERVICE_NAME=BD Railways Online Ticket Booking
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
