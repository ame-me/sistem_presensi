# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a school attendance management system ("Sistem Presensi Sekolah") built with Next.js 16 (App Router) and a PHP backend API. The system manages student attendance, leave requests, scheduling, and communication between teachers, parents, and administrators.

## Architecture

### Frontend (Next.js)
- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: Zustand with persistence middleware
- **API Communication**: Fetch API with SWR for caching
- **Form Handling**: React Hook Form with Zod validation

### Backend (PHP API)
- Located in `/api/` directory
- Traditional PHP API endpoints organized by domain (guru, siswa, presensi, etc.)
- MySQL database with schema defined in `database.sql`
- File uploads stored in `/uploads/` directory

### Key Directories
- `src/app/`: Next.js App Router pages and layouts organized by role (admin, guru, ortu, it)
- `src/lib/`: Core utilities, store, access control, API config
- `src/components/`: Reusable React components including UI components from shadcn/ui
- `api/`: PHP backend API endpoints
- `uploads/`: File uploads directory (selfies, attachments)

## Development Setup

### Prerequisites
- Node.js (for Next.js frontend)
- Docker and Docker Compose (recommended for full stack)
- Or XAMPP/WAMP for PHP/MySQL locally

### Using Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

Services:
- Frontend: http://localhost:3000
- PHP API: http://localhost:8080
- MySQL: localhost:3306
- phpMyAdmin: http://localhost:8081

### Manual Setup
1. **Frontend**: 
   ```bash
   npm install
   npm run dev
   ```

2. **Backend**: 
   - Copy `api/` directory to XAMPP/WAMP htdocs
   - Import `database.sql` to MySQL
   - Configure database connection in API config

3. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL`: API endpoint (default: `http://127.0.0.1/presensipander/api`)
   - `NEXT_PUBLIC_UPLOAD_BASE_URL`: Uploads endpoint

## Common Development Tasks

### Running the Development Server
```bash
# Start frontend only (requires backend running separately)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Management
- Initial schema: `database.sql`
- PHPMyAdmin available at http://localhost:8081 when using Docker
- Database name: `presensipander_db`
- Credentials: root/root

### Testing Demo Accounts
Use these credentials for quick access:
- Kepala Sekolah: `guru1@sekolah.id` / `password123`
- Admin TU: `admin.tu@sekolah.id` / `password123`
- Admin IT: `guru13@sekolah.id` / `password123`
- Guru: `guru2@sekolah.id` / `password123`
- Orang Tua: `1234567890123456` / `password123`

## Access Control System

The system uses a role-based access control (RBAC) with configurable access matrix:

### User Roles
1. `ADMIN` - Kepala Sekolah (full access)
2. `ADMIN_IT` - IT Administrator (system management)
3. `ADMIN_TU` - Tata Usaha (administrative tasks)
4. `GURU` - Teachers (attendance, leave approval, classes)
5. `ORTU` - Parents (view child attendance, submit leave requests)

### Key Access Control Files
- `src/lib/access-control.ts`: Core access matrix and permission logic
- `src/lib/access-api.ts`: API calls for fetching/saving access matrix
- `src/components/access-guard.tsx`: Component for route protection
- `src/components/access-matrix-loader.tsx`: Loads access matrix on app start

### Access Levels
- `NONE`: No access
- `VIEW`: Read-only access
- `EDIT`: Can modify data
- `FULL`: Full control (create, read, update, delete)

## Data Flow

### Authentication
1. Login attempts both Guru and Ortu endpoints
2. User data stored in Zustand store with persistence
3. Access matrix fetched after successful login
4. Routing based on role and permissions

### Attendance Flow
1. Teachers take attendance during class sessions
2. QR code scanning for student check-in
3. Statuses: HADIR, IZIN, SAKIT, ALPHA, TERLAMBAT, KEPERLUAN_SEKOLAH
4. Parents can view attendance records and submit leave requests

### Leave Request Flow
1. Parents submit leave requests with selfie verification
2. Requests go to PENDING state
3. Teachers/Wali Kelas review and approve/reject
4. Notifications sent to parents

## API Structure

### Backend Organization
```
api/
├── config/          # Database configuration
├── guru/           # Teacher-related endpoints
├── siswa/          # Student endpoints  
├── presensi/       # Attendance endpoints
├── izin/           # Leave request endpoints
├── jadwal/         # Schedule endpoints
├── kelas/          # Class/grade endpoints
├── mapel/          # Subject endpoints
├── ruangan/        # Room management
├── ortu/           # Parent endpoints
├── notifikasi/     # Notification system
├── jurnal/         # Class journal
└── system/         # System utilities
```

### Frontend API Integration
- API base URL dynamically determined based on hostname
- Upload URLs handled separately
- Error handling with user-friendly messages

## Important Patterns

### State Management
- Global state: `src/lib/store.ts` (Zustand)
- Persists auth state and user preferences
- Contains mock data for development
- Role-specific data access methods

### Component Structure
- `src/components/ui/`: shadcn/ui base components
- Role-specific layouts in `src/app/[role]/layout.tsx`
- Sidebar navigation with role-based menu items
- Access-controlled page components

### Styling
- Tailwind CSS with custom configuration
- Color scheme: Navy blue (`#000080`) primary
- Responsive design with mobile-first approach
- Consistent spacing and typography scale

## Deployment

### Frontend Deployment
- Build with `npm run build`
- Output in `.next/` directory
- Can deploy to Vercel, Netlify, or any Node.js hosting

### Backend Deployment
- PHP files require Apache/nginx with PHP 8+
- MySQL database required
- Uploads directory with write permissions
- Configure CORS if frontend/backend on different domains

## Troubleshooting

### Common Issues
1. **API Connection Failed**: Check `NEXT_PUBLIC_API_BASE_URL` and ensure backend is running
2. **Database Errors**: Verify MySQL is running and credentials match
3. **Upload Issues**: Check uploads directory permissions
4. **CORS Errors**: Ensure API allows requests from frontend domain

### Development Tips
- Use Docker Compose for consistent environment
- Check browser console for API errors
- Use demo accounts for quick testing
- Refer to `database.sql` for schema reference