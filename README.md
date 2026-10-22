# MiniLedger

A simple mobile app to track money lent to friends, built with Node.js/TypeScript (backend) and React Native (frontend).

## Features

- **Phone Number Login**: Mock OTP-based authentication (OTP is printed in server logs)
- **Loan Management**: Add, view, and track loans to friends
- **Overdue Tracking**: Visual highlighting of overdue loans
- **Summary Dashboard**: View total lent, repaid, overdue, and pending amounts
- **Receipt Photos**: Upload and attach receipt photos to loan entries (bonus feature)
- **Input Validation**: Comprehensive validation for all user inputs (bonus feature)

## Tech Stack

### Backend
- Node.js with TypeScript
- Express.js
- PostgreSQL database
- JWT authentication
- Multer for file uploads

### Frontend
- React Native with Expo SDK 49
- Axios for API calls
- Expo Image Picker for photo uploads

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn
- Web browser (for web version) or Expo Go app (for mobile)

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Assignment
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/miniledger
JWT_SECRET=your-secret-key-change-this-in-production
```

Replace `yourpassword` with your PostgreSQL password.

#### Setup PostgreSQL Database

Create a database named `miniledger`:

```sql
CREATE DATABASE miniledger;
```

The application will automatically create the required tables on startup.

#### Run the Backend

```bash
npm run dev
```

The backend will start on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

#### Run the Frontend

```bash
npm start
```

This will start the Expo development server and open in your web browser automatically.
- The app will open at `http://localhost:19006`
- For mobile testing, press `a` for Android emulator or `i` for iOS simulator (macOS only)
- You can also scan the QR code with Expo Go app on your phone

## API Endpoints

### Authentication

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone_number": "1234567890"
}
```

The OTP will be printed in the backend server console.

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone_number": "1234567890",
  "otp": "123456"
}
```

Returns a JWT token and user information.

### Loans

#### Add Loan
```http
POST /api/loans
Authorization: Bearer <token>
Content-Type: application/json

{
  "friend_name": "John Doe",
  "amount": 100.50,
  "due_date": "2024-12-31",
  "receipt_photo": "/uploads/receipt.jpg" // optional
}
```

#### Get All Loans
```http
GET /api/loans
Authorization: Bearer <token>
```

Returns all loans for the authenticated user with overdue status.

#### Mark as Repaid
```http
PATCH /api/loans/:id/repaid
Authorization: Bearer <token>
```

#### Get Summary
```http
GET /api/loans/summary
Authorization: Bearer <token>
```

Returns summary statistics:
- `total_lent`: Total amount lent
- `total_repaid`: Total amount repaid
- `overdue_amount`: Total overdue amount
- `pending_amount`: Total pending amount

#### Upload Receipt
```http
POST /api/loans/upload-receipt
Authorization: Bearer <token>
Content-Type: multipart/form-data

receipt: <file>
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Loans Table
```sql
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  friend_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  is_repaid BOOLEAN DEFAULT FALSE,
  receipt_photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Usage

1. **Login**: Enter your phone number and click "Send OTP"
2. **Get OTP**: Check the backend server console for the mock OTP
3. **Verify**: Enter the OTP to login
4. **Add Loan**: Click the "+ Add Loan" button to add a new loan entry
5. **View Loans**: See all your loans with overdue ones highlighted in red
6. **Mark Repaid**: Click "Mark as Repaid" on any unpaid loan
7. **View Summary**: Check the summary card at the top for overview statistics

## Project Structure

```
Assignment/
├── backend/
│   ├── src/
│   │   ├── auth.ts           # Authentication logic
│   │   ├── db.ts             # Database connection and initialization
│   │   ├── index.ts          # Express server setup
│   │   ├── loans.ts          # Loan CRUD operations
│   │   ├── validation.ts     # Input validation functions
│   │   └── validation.test.ts # Validation tests
│   ├── uploads/              # Uploaded receipt photos
│   ├── .env                  # Environment variables
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api.js            # API client
│   │   ├── AuthContext.js    # Authentication context
│   │   ├── HomeScreen.js     # Main app screen
│   │   └── LoginScreen.js    # Login screen
│   ├── App.js                # App entry point
│   ├── app.json              # Expo configuration
│   └── package.json
└── README.md
```

## Bonus Features Implemented

1. **Photo Upload**: Users can attach receipt photos to loan entries
2. **Input Validation**: Comprehensive validation for:
   - Phone numbers
   - OTP codes
   - Loan amounts
   - Due dates
   - Friend names
3. **Unit Tests**: Validation tests using Jest

## Troubleshooting

### Backend Issues

**Database Connection Error**
- Ensure PostgreSQL is running
- Check the DATABASE_URL in `.env` file
- Verify the database name matches

**Port Already in Use**
- Change the PORT in `.env` file
- Or kill the process using port 3000

### Frontend Issues

**Metro Bundler Issues**
- Clear cache: `npm start -- --clear`
- Reset cache: `expo start -c`

**Network Error**
- Ensure backend is running on `http://localhost:3000`
- Check if the API_BASE_URL in `src/api.js` is correct

**Image Picker Not Working**
- Ensure permissions are granted in the Expo app
- Check if expo-image-picker is properly installed

## Development

### Running Tests

```bash
cd backend
npm test
```

### Building Backend for Production

```bash
cd backend
npm run build
npm start
```

### Building Frontend for Production

```bash
cd frontend
expo build:android
# or
expo build:ios
```

## License

ISC

## Contributing

Feel free to submit issues and enhancement requests!
