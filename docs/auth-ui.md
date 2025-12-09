# Frontend Authentication UI

## Flows
- Sign In and Sign Up via monorepo API endpoints
- Persistent state via `GET /api/me` with stored access token
- Refresh access tokens via `POST /api/refresh` (HTTP-only cookie)
- Protected routes redirect unauthenticated users to `/signin`

## Validation
- Email: basic RFC-like regex
- Password: min 8, uppercase, lowercase, number, special char

## Env Variables
- `VITE_API_BASE_URL` (defaults to `http://localhost:8000`)

## Communication Pattern
- Frontend calls `GET /api/csrf` to obtain CSRF token
- Authentication: `POST /api/login` and `POST /api/signup` with `x-xsrf-token`
- Session: `POST /api/refresh` rotates access token; refresh token stored as HTTP-only cookie
- User info: `GET /api/me` with `Authorization: Bearer <accessToken>`
- Logout: `POST /api/logout` clears refresh cookie

### Notes
- Social login via Google has been removed. Email/password login remains.

## Testing
- Uses Vitest + Testing Library; JSDOM environment.
