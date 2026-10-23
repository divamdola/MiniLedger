# MiniLedger

MiniLedger keeps track of money lent to friends: sign in with a mock phone OTP, record a due date, and see what is still outstanding or overdue.

GitHub repository: https://github.com/divamdola/MiniLedger

## Stack

- API: Node.js, TypeScript, Express, PostgreSQL, JWT
- App: React Native and Expo (Android, iOS, and web)

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer
- Expo Go for device testing, or an Android/iOS simulator

## Run locally

1. Create a PostgreSQL database, for example `miniledger`.
2. Configure and start the API:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set `DATABASE_URL` and `JWT_SECRET` in `backend/.env`, then:

```powershell
npm run dev
```

The API creates its tables at startup and listens on port `3000` by default. The mock OTP appears in this terminal. Keep it local; this OTP flow is for development only.

3. In another terminal, install and run the app:

```powershell
cd mobile
npm install
npm start
```

Web development uses `http://localhost:3000` automatically. For a physical phone, create `mobile/.env` with `EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:3000` before starting Expo. The phone and computer must be on the same network.

## API

All endpoints are prefixed with `/api`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/send-otp` | Generate and log a five-minute mock OTP (`phone_number`) |
| `POST` | `/auth/verify-otp` | Verify (`phone_number`, `otp`) and return a bearer token |
| `GET` | `/loans` | List the signed-in user's loans, including overdue status |
| `POST` | `/loans` | Add `{ "friend_name": "Sam", "amount": 25, "due_date": "2027-01-31" }` |
| `PATCH` | `/loans/:id/repaid` | Mark one of the signed-in user's loans as repaid |
| `GET` | `/loans/summary` | Return total lent, repaid, overdue, and pending amounts |

Loan endpoints require `Authorization: Bearer <token>`. Dates use `YYYY-MM-DD`; amounts are positive and capped at 1,000,000. A loan is overdue when it is unpaid and its due date is before the current database date.

## Checks

```powershell
cd backend
npm test
npm run build
```

## Notes

This is a development starter, not a production authentication service. OTPs are kept in memory and printed to logs; use a real SMS provider, persistent sessions, HTTPS, and production secrets before deployment. Receipt uploads are not included in this version.