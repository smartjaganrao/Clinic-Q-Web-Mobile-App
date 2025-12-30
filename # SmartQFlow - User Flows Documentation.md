# SmartQFlow - User Flows Documentation

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

## User Flows

### 1. Patient User Flow

**Primary Goal**: Book appointments, track visits, and manage healthcare interactions.

1. **Landing & Discovery**
   - Visit public landing page
   - Search clinics by location, specialty, or doctor name
   - View clinic details, doctor profiles, and ratings
   - Filter by availability, fees, and amenities

2. **Authentication**
   - Login with phone number and name (guest mode available)
   - OTP verification (planned feature)

3. **Booking Process**
   - Select clinic and doctor
   - Choose between walk-in token or appointment booking
   - Select date/time slot
   - Provide personal details (age, gender, symptoms)
   - Confirm booking

4. **Visit Management**
   - View active visits with real-time status
   - Check-in via QR code scan at clinic
   - Track position in queue
   - Receive notifications for status changes

5. **Post-Visit**
   - View visit history
   - Rate doctors and provide feedback
   - Manage profile and family members

### 2. Receptionist User Flow

**Primary Goal**: Manage daily clinic operations and patient flow.

1. **Login & Setup**
   - Login with clinic credentials
   - Access clinic-specific dashboard

2. **Patient Management**
   - Add walk-in patients with token generation
   - Register appointment patients
   - Edit patient details and demographics
   - Update patient status (waiting → with doctor → completed)
   - Handle emergency cases with priority

3. **Queue Management**
   - View real-time patient queue
   - Reorder queue via drag-and-drop
   - Bulk status updates
   - Manual check-in for patients

4. **Doctor Management**
   - Add/edit doctor profiles and schedules
   - Manage doctor availability and status
   - Assign patients to doctors

5. **Staff Management**
   - Add/manage reception and nursing staff
   - Update staff roles and permissions

6. **Reporting**
   - View daily statistics
   - Track wait times and completion rates

### 3. Doctor User Flow

**Primary Goal**: Efficiently manage patient consultations.

1. **Login & Clinic Selection**
   - Login with doctor credentials
   - Select clinic (if multi-clinic doctor)

2. **Queue Management**
   - View personal patient queue
   - Sort by priority, appointment time, and emergency status
   - Call next patient

3. **Consultation Process**
   - Mark patient as "with doctor"
   - Record consultation notes and diagnosis
   - Update vitals and medical data
   - Complete or hold consultations

4. **Status Management**
   - Update availability status (available, on break, off duty)
   - Set delay times for patient notifications

5. **Multi-Clinic Support**
   - Switch between clinics seamlessly
   - Maintain consistent profile across locations

### 4. Admin (Super Admin) User Flow

**Primary Goal**: Oversee all clinics and system management.

1. **System Overview**
   - Login as super administrator
   - View all clinics and system statistics

2. **Clinic Management**
   - Create new clinics
   - Edit clinic details, plans, and settings
   - Suspend/activate clinic subscriptions
   - Delete clinics

3. **Staff Management**
   - Add/manage staff across all clinics
   - Update permissions and roles

4. **System Administration**
   - Reset system to default state
   - Delete all data (for testing)
   - Monitor system health

### 5. Kiosk Display Flow

**Primary Goal**: Provide public information about current queue status.

1. **Display Mode**
   - Show current patient numbers in queue
   - Display clinic information
   - No user interaction required

## Data Models

### Core Entities

- **Clinic**: Contains doctors, patients, staff, settings
- **Doctor**: Profile, schedule, ratings, multi-clinic support
- **Patient**: Visit details, status, demographics, medical data
- **Staff**: Receptionists, nurses, managers
- **Appointment**: Scheduled visits with time slots

### Key Status Enums

- **PatientStatus**: WAITING, WITH_DOCTOR, COMPLETED, CANCELLED, ON_HOLD
- **DoctorStatus**: AVAILABLE, ON_BREAK, OFF_DUTY
- **UserRole**: ADMIN, DOCTOR, RECEPTIONIST, KIOSK, PATIENT