# SmartQFlow - Backend Development Documentation

## Project Overview

SmartQFlow is a comprehensive web and mobile application designed to streamline clinic operations through intelligent queue management. The system supports multiple user roles including patients, receptionists, doctors, administrators, and public kiosk displays. It enables online appointment booking, real-time queue tracking, doctor consultation management, and administrative oversight.

### Key Features
- **Multi-Role Support**: Separate interfaces for patients, staff, doctors, and admins
- **Online Booking**: Patients can book appointments or generate tokens online
- **Real-Time Queue Management**: Live status updates and priority handling
- **Multi-Clinic Support**: Doctors can work across multiple clinics
- **Kiosk Display**: Public screens showing current queue status
- **Mobile-First Design**: Responsive web app with mobile optimization
- **Offline Capability**: Local storage for basic operations

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **Routing**: React Router 6
- **Mapping**: Leaflet with React-Leaflet
- **AI Integration**: Google Gemini AI for smart features
- **Styling**: Tailwind CSS (inferred from components)
- **State Management**: React hooks with local storage persistence

## Backend API Requirements

The following APIs are required to replace the current localStorage-based mock service. All APIs should return JSON responses with appropriate HTTP status codes.

### Authentication APIs

```
POST /api/auth/login
Body: { email: string, password: string }
Response: { role: UserRole, clinicId: string, userId: string, name: string } | null
```

### Clinic APIs

```
GET /api/clinics
Response: Clinic[]

POST /api/clinics
Body: Clinic (without id)
Response: Clinic

PUT /api/clinics/:clinicId
Body: Partial<Clinic>
Response: Clinic

DELETE /api/clinics/:clinicId
Response: { success: boolean }
```

### Patient APIs

```
GET /api/clinics/:clinicId/patients
Response: Patient[]

POST /api/clinics/:clinicId/patients
Body: Patient (without id)
Response: Patient

PUT /api/clinics/:clinicId/patients/:patientId
Body: Partial<Patient>
Response: Patient

PUT /api/clinics/:clinicId/patients/:patientId/status
Body: { status: PatientStatus }
Response: Patient

DELETE /api/clinics/:clinicId/patients/:patientId
Response: { success: boolean }

POST /api/clinics/:clinicId/patients/bulk-status
Body: { patientIds: string[], status: PatientStatus }
Response: { updated: number }

POST /api/clinics/:clinicId/patients/reorder
Body: { draggedId: string, targetId: string }
Response: { success: boolean }
```

### Doctor APIs

```
GET /api/clinics/:clinicId/doctors
Response: Doctor[]

POST /api/clinics/:clinicId/doctors
Body: Doctor (without id)
Response: Doctor

PUT /api/clinics/:clinicId/doctors/:doctorId
Body: Partial<Doctor>
Response: Doctor

DELETE /api/clinics/:clinicId/doctors/:doctorId
Response: { success: boolean }

PUT /api/clinics/:clinicId/doctors/:doctorId/status
Body: { status: DoctorStatus, delayMinutes: number }
Response: Doctor
```

### Staff APIs

```
GET /api/clinics/:clinicId/staff
Response: Staff[]

POST /api/clinics/:clinicId/staff
Body: Staff (without id)
Response: Staff

PUT /api/clinics/:clinicId/staff/:staffId
Body: Partial<Staff>
Response: Staff

DELETE /api/clinics/:clinicId/staff/:staffId
Response: { success: boolean }
```

### Patient Self-Service APIs

```
POST /api/patient/login
Body: { phone: string, name: string }
Response: { token: string, patient: Patient }

GET /api/patient/visits?phone=:phone
Response: Patient[]

POST /api/patient/book
Body: { clinicId: string, doctorId: string, date: string, time: string, ...patientDetails }
Response: Patient

PUT /api/patient/checkin/:patientId
Body: { clinicId: string }
Response: { success: boolean }

PUT /api/patient/cancel/:patientId
Body: { clinicId: string }
Response: { success: boolean }
```

### Real-Time Updates

For real-time functionality, implement WebSocket support:

```
WebSocket: /ws/clinics/:clinicId
Events:
- patient:updated
- doctor:status_changed
- queue:reordered
```

### Additional Requirements

1. **Authentication**: JWT tokens for session management
2. **Validation**: Input validation on all endpoints
3. **Error Handling**: Consistent error response format
4. **Rate Limiting**: Prevent abuse on public endpoints
5. **Caching**: Redis for session and frequently accessed data
6. **Database**: PostgreSQL or MongoDB for data persistence
7. **Timezone Handling**: Store all times in UTC, convert on frontend
8. **File Upload**: For doctor avatars and clinic images
9. **Email/SMS**: For appointment confirmations and notifications

### Security Considerations

- Password hashing (bcrypt)
- Input sanitization
- CORS configuration
- HTTPS enforcement
- Role-based access control
- API key authentication for mobile apps

This specification provides a complete foundation for implementing the backend services required by the SmartQFlow application.