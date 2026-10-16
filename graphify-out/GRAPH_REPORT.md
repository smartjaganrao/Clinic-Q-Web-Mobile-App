# Graph Report - Clinic-Q-Web-Mobile-App  (2026-08-19)

## Corpus Check
- 112 files · ~125,571 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1144 nodes · 2030 edges · 68 communities (62 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `34bcb5b6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- SmartQFlow - World-Class Design System
- COMPLETION_STATUS.md
- Backend API Requirements
- 🚀 QUICK REFERENCE - Backend Integration Setup
- Backend API Requirements
- User Flows
- Phase 2 Integration - Pending Items Checklist
- Phase 2 Integration Summary
- Authentication Fix Plan - Login & Register Not Working
- MapPanel.tsx
- 3. ✅ Frontend Integration
- 📦 COMPLETE BACKEND INTEGRATION DELIVERABLES
- 📊 Backend Integration - Final Report
- 📖 Comprehensive Documentation (6 Files)
- App
- 🎯 Production-Grade Service Layer (5 Files)
- 🔧 Technical Deliverables
- Key Features Implemented
- 📊 Database Schema (SUPABASE_SCHEMA.sql)
- 🚀 What You Can Do Now
- 🚦 Next Steps (In Priority Order)
- Cost-Benefit Analysis
- Recommendations
- Support & Troubleshooting
- ⏳ PENDING - HIGH PRIORITY
- 📈 Capabilities Enabled
- 📋 Integration Checklist
- 📞 Support & Maintenance
- Security Implementation
- Code Quality
- Deployment Readiness
- Performance Metrics
- Deployment Checklist
- ⏳ PENDING - LOW PRIORITY
- ⏳ PENDING - MEDIUM PRIORITY
- 💼 Business Value
- What Changed from Old Architecture
- Maintenance & Support
- Testing Coverage
- Run and deploy your AI Studio app

## God Nodes (most connected - your core abstractions)
1. `Doctor` - 58 edges
2. `Clinic` - 56 edges
3. `Patient` - 41 edges
4. `StorageService` - 37 edges
5. `Button()` - 30 edges
6. `AuthService` - 30 edges
7. `PatientStatus` - 26 edges
8. `delay()` - 24 edges
9. `DoctorService` - 23 edges
10. `DoctorStatus` - 21 edges

## Surprising Connections (you probably didn't know these)
- `App()` --indirect_call--> `delay()`  [INFERRED]
  App.tsx → services/storage.ts
- `StatsCardsProps` --references--> `Clinic`  [EXTRACTED]
  features/admin/components/StatsCards.tsx → types.ts
- `MapPanelProps` --references--> `Clinic`  [EXTRACTED]
  features/patient/components/MapPanel.tsx → types.ts
- `DoctorLoginProps` --references--> `Clinic`  [EXTRACTED]
  pages/DoctorLogin.tsx → types.ts
- `LandingPageProps` --references--> `Clinic`  [EXTRACTED]
  pages/LandingPage.tsx → types.ts

## Import Cycles
- None detected.

## Communities (68 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (76): AuthModalProps, AuthMode, Button(), ButtonProps, Card(), CardProps, ConfirmationModal(), ConfirmationModalProps (+68 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (55): AuthModal(), Breadcrumbs(), IndianRupeeIcon(), Ticket(), StarRating(), StarRatingProps, Tooltip(), TooltipProps (+47 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (29): Badge(), BadgeProps, COMMON_MEDICINES, ConsultationWorkspace(), ConsultationWorkspaceProps, DOSAGE_FREQUENCIES, DateRangePicker(), DateRangePickerProps (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (43): @google/genai, leaflet, lucide-react, dependencies, @google/genai, leaflet, lucide-react, react (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (30): BreadcrumbsProps, DoctorCardSkeleton(), DoctorCardSkeletonProps, SkeletonProps, migrateClinicsToSupabase(), migrateDoctorsToSupabase(), migratePatientAuthToSupabase(), migrateQueueDataToSupabase() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (3): delay(), StorageService, getSupabase()

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (48): Adding a new feature that touches the backend:, API Security, Authentication, Authentication, 🎉 Backend Integration Complete - Final Summary, Clinic Management, Common Issues (see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)):, 📞 Contact & Support (+40 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (24): c, checkSchema(), createAuthUsers(), DEMO_CLINIC, __dirname, DOCTORS, fail(), __filename (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (24): CATEGORIES, CLINIC_1, CLINIC_2, CLINIC_3, CLINIC_4, CLINIC_5, CLINIC_6, CLINIC_7 (+16 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (15): TODO: Implement queue reordering in Supabase service layer, TODO: Implement system reset in Supabase service layer, TODO: Implement data deletion in Supabase service layer, TODO: Implement patient clear in Supabase service layer, TODO: Implement true realtime with Supabase subscriptions, TODO: Implement patient deletion in patientService, TODO: Implement batch deletion in patientService, TODO: Implement staff creation in Supabase service layer (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (36): Expected Results, If Something Goes Wrong, Next: Full Testing, Problem: "Clinics loaded: 0", Problem: Email verification stuck, Problem: Queue doesn't update, Problem: Signup fails, Questions? (+28 more)

### Community 13 - "Community 13"
Cohesion: 0.27
Nodes (10): c, check(), envPath, fail(), __filename, hr(), ok(), ROOT (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.04
Nodes (45): 🗄️ 1 Database Schema, 🔧 5 Production Service Files, 📖 6 Documentation Files, 🏗️ Architecture at a Glance, Authentication, 📊 By the Numbers, Clinic Operations, 📚 COMPLETE BACKEND INTEGRATION - INDEX & ROADMAP (+37 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (6): root, rootElement, LocationContext, LocationContextType, LocationEnforcerProps, MOCK_LOCATION

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (5): ClinicCard(), formatClinicType(), LandingPage(), LandingPageProps, SPECIALTIES

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (43): 10.1 Console Logs, 10.2 Supabase Analytics, 10. Monitoring & Observability ✓, 11.1 Remove test data, 11.2 Final checklist, 11. Cleanup & Validation, 1.1 Patient Registration & Login, 1.2 Staff/Doctor Registration & Login (+35 more)

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (6): PRODUCTION_CHECKLIST, PRODUCTION_DEPLOYMENT_GUIDE, PRODUCTION_ENV_VARIABLES, PRODUCTION_SUCCESS_CRITERIA, productionConfig, SECURITY_HEADERS

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (5): c, __dirname, envPath, __filename, ROOT

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (42): 1. IMPLEMENTATION_COMPLETE.md, 1. pages/PatientLogin.tsx, 1. services/authService.ts (300 lines), 2. BACKEND_INTEGRATION_COMPLETE.md, 2. pages/DoctorLogin.tsx, 2. services/clinicService.ts (250 lines), 3. BACKEND_INTEGRATION_GUIDE.ts, 3. pages/StaffLogin.tsx (+34 more)

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): ToastContainer(), ToastProps, AppNotification

### Community 28 - "SmartQFlow - World-Class Design System"
Cohesion: 0.06
Nodes (30): **1. Header (Ultra-Minimal)**, **2. Left Sidebar (Desktop Only, 256px)**, **3. Main Content Area**, **4. Clinic/Doctor Cards (New Design)**, **5. Color Palette**, **6. Typography**, **7. Spacing System**, **8. Shadows & Depth** (+22 more)

### Community 29 - "COMPLETION_STATUS.md"
Cohesion: 0.07
Nodes (26): Action 1: Browser Testing (User), Action 2: Run Build Check (Automatic), Action 3: Create staffService.ts (Code), Code Fixes & Patches, ✅ COMPLETED (14/24 items), 📊 COMPLETION BREAKDOWN, 🎯 CRITICAL PATH TO PRODUCTION, Database (2 files created) (+18 more)

### Community 30 - "Backend API Requirements"
Cohesion: 0.08
Nodes (23): 1. Patient User Flow, 2. Receptionist User Flow, 3. Doctor User Flow, 4. Admin (Super Admin) User Flow, 5. Kiosk Display Flow, Additional Requirements, Authentication APIs, Backend API Requirements (+15 more)

### Community 31 - "🚀 QUICK REFERENCE - Backend Integration Setup"
Cohesion: 0.09
Nodes (23): ⚡ 5-Minute Quick Start, Authentication, Clinics, 🚨 Common Errors & Fixes, 📊 Database Tables at a Glance, Doctors, 📋 Files Created, 📚 Full Documentation (+15 more)

### Community 32 - "Backend API Requirements"
Cohesion: 0.13
Nodes (14): Additional Requirements, Authentication APIs, Backend API Requirements, Clinic APIs, Doctor APIs, Key Features, Patient APIs, Patient Self-Service APIs (+6 more)

### Community 33 - "User Flows"
Cohesion: 0.14
Nodes (13): 1. Patient User Flow, 2. Receptionist User Flow, 3. Doctor User Flow, 4. Admin (Super Admin) User Flow, 5. Kiosk Display Flow, Core Entities, Data Models, Key Features (+5 more)

### Community 34 - "Phase 2 Integration - Pending Items Checklist"
Cohesion: 0.17
Nodes (10): Code Changes, ✅ COMPLETED, Database, 🚀 DEPLOYMENT READINESS, Documentation, Phase 2 Integration - Pending Items Checklist, Pre-Production Checklist, Production Deployment Steps (+2 more)

### Community 35 - "Phase 2 Integration Summary"
Cohesion: 0.17
Nodes (12): Database Migrations, Fallback & Offline Support, Files Changed, Known Limitations & Future Work, Next Steps (Phase 3), Node Migration Helper, Overview, Pages & Components (+4 more)

### Community 36 - "Authentication Fix Plan - Login & Register Not Working"
Cohesion: 0.17
Nodes (11): Architecture Flow Diagram, Authentication Fix Plan - Login & Register Not Working, Files to Modify, Problem Details, Root Cause Analysis, Solution, Step 1: Fix Supabase Anon Key, Step 2: Initialize AuthService on App Startup (+3 more)

### Community 37 - "MapPanel.tsx"
Cohesion: 0.24
Nodes (6): calculateDistance(), createCustomIcon(), deg2rad(), MapPanel(), MapPanelProps, userIcon

### Community 38 - "3. ✅ Frontend Integration"
Cohesion: 0.18
Nodes (11): 1. ✅ Core Fixes & Refactoring, 2. ✅ Service Layer Enhancements, 3. ✅ Frontend Integration, `App.tsx` Handlers Migrated, `ClinicAuth.tsx`, `clinicService.ts`, `DoctorListView.tsx`, `doctorService.ts` (+3 more)

### Community 39 - "📦 COMPLETE BACKEND INTEGRATION DELIVERABLES"
Cohesion: 0.25
Nodes (7): 📦 COMPLETE BACKEND INTEGRATION DELIVERABLES, ✨ Final Notes, 🎓 Learning Resources Included, 🏆 Production Readiness, 📊 Project Statistics, 🎯 Success Metrics, 🔄 Version Control

### Community 40 - "📊 Backend Integration - Final Report"
Cohesion: 0.25
Nodes (8): 📊 Backend Integration - Final Report, Business KPIs, Conclusion, Executive Summary, Quick Links, Sign-Off, Success Metrics, Technical KPIs

### Community 41 - "📖 Comprehensive Documentation (6 Files)"
Cohesion: 0.29
Nodes (7): 1. **BACKEND_INTEGRATION_GUIDE.ts**, 2. **DATA_MIGRATION_GUIDE.ts**, 3. **PRODUCTION_DEPLOYMENT_GUIDE.ts**, 4. **.env.example**, 5. **QUICK_REFERENCE.md**, 6. **BACKEND_INTEGRATION_COMPLETE.md**, 📖 Comprehensive Documentation (6 Files)

### Community 42 - "App"
Cohesion: 0.33
Nodes (5): App(), generateId(), getLocalToday(), fetchClinics(), saveSupabaseConfig()

### Community 43 - "🎯 Production-Grade Service Layer (5 Files)"
Cohesion: 0.33
Nodes (6): 1. **authService.ts** - Complete Authentication System, 2. **clinicService.ts** - Clinic Management, 3. **patientService.ts** - Patient Queue & Medical Records, 4. **doctorService.ts** - Doctor Management, 5. **backendManager.ts** - Service Orchestrator, 🎯 Production-Grade Service Layer (5 Files)

### Community 44 - "🔧 Technical Deliverables"
Cohesion: 0.33
Nodes (6): 1. Database Infrastructure, 2. Backend Services (5 files, 1,300+ lines), 3. Frontend Integration (3 files refactored), 4. Documentation (7 files, 2,000+ lines), 🔧 Technical Deliverables, What Was Delivered

### Community 45 - "Key Features Implemented"
Cohesion: 0.33
Nodes (6): Authentication System, Clinic Management, Doctor Management, Key Features Implemented, Patient Queue System, Real-time Features

### Community 46 - "📊 Database Schema (SUPABASE_SCHEMA.sql)"
Cohesion: 0.40
Nodes (5): 📊 Database Schema (SUPABASE_SCHEMA.sql), Features, Statistics, Tables Created (8 Total), ✅ What Has Been Delivered

### Community 47 - "🚀 What You Can Do Now"
Cohesion: 0.40
Nodes (5): Immediate (Today), Production, This Month, This Week, 🚀 What You Can Do Now

### Community 48 - "🚦 Next Steps (In Priority Order)"
Cohesion: 0.40
Nodes (5): 🚦 Next Steps (In Priority Order), Phase 1: Setup (1-2 days), Phase 2: Integration (3-5 days), Phase 3: Testing (2-3 days), Phase 4: Production (2-4 weeks)

### Community 49 - "Cost-Benefit Analysis"
Cohesion: 0.40
Nodes (5): Benefits, Cost-Benefit Analysis, Implementation Cost, Operational Cost (Monthly), ROI

### Community 50 - "Recommendations"
Cohesion: 0.40
Nodes (5): Immediate (Next 1-2 weeks), Long-term (Month 6+), Medium-term (Month 3-6), Recommendations, Short-term (Month 2)

### Community 51 - "Support & Troubleshooting"
Cohesion: 0.40
Nodes (5): Issue: "Cannot read properties of null (reading 'doctors')", Issue: "Clinics loaded from Supabase: 0", Issue: Doctor list shows empty, Issue: PowerShell blocks `npm run dev`, Support & Troubleshooting

### Community 52 - "⏳ PENDING - HIGH PRIORITY"
Cohesion: 0.40
Nodes (5): 1. Run DB Migration, 2. Test Patient View, 3. Test Admin View, 4. Test Realtime Subscription, ⏳ PENDING - HIGH PRIORITY

### Community 53 - "📈 Capabilities Enabled"
Cohesion: 0.50
Nodes (4): 📈 Capabilities Enabled, Features, Quality, Scalability

### Community 54 - "📋 Integration Checklist"
Cohesion: 0.50
Nodes (4): Code Changes Required, Deployment, 📋 Integration Checklist, Testing

### Community 55 - "📞 Support & Maintenance"
Cohesion: 0.50
Nodes (4): Documentation, Scalability, 📞 Support & Maintenance, Updates

### Community 56 - "Security Implementation"
Cohesion: 0.50
Nodes (4): API Security, Authentication, Data Protection, Security Implementation

### Community 57 - "Code Quality"
Cohesion: 0.50
Nodes (4): Best Practices, Code Quality, Error Handling, TypeScript

### Community 58 - "Deployment Readiness"
Cohesion: 0.50
Nodes (4): Deployment Readiness, Deployment Steps, Estimated Launch Time, Pre-Production Checklist

### Community 59 - "Performance Metrics"
Cohesion: 0.50
Nodes (4): Performance Metrics, Reliability, Scalability, Speed

### Community 60 - "Deployment Checklist"
Cohesion: 0.50
Nodes (4): Deployment Checklist, Pre-Deployment, Production Deployment, Testing Steps

### Community 61 - "⏳ PENDING - LOW PRIORITY"
Cohesion: 0.50
Nodes (4): 10. Analytics & Monitoring, 8. Unit & Integration Tests, 9. Performance Optimization, ⏳ PENDING - LOW PRIORITY

### Community 62 - "⏳ PENDING - MEDIUM PRIORITY"
Cohesion: 0.50
Nodes (4): 5. Create `staffService.ts`, 6. Add Error Recovery & Retry Logic, 7. Implement Offline Sync Queue, ⏳ PENDING - MEDIUM PRIORITY

### Community 63 - "💼 Business Value"
Cohesion: 0.67
Nodes (3): After (Supabase Backend), Before (Mock Data), 💼 Business Value

### Community 64 - "What Changed from Old Architecture"
Cohesion: 0.67
Nodes (3): After (Supabase Backend), Before (Mock/localStorage), What Changed from Old Architecture

### Community 65 - "Maintenance & Support"
Cohesion: 0.67
Nodes (3): Documentation for Future Developers, Maintenance & Support, Ongoing Support Included

### Community 66 - "Testing Coverage"
Cohesion: 0.67
Nodes (3): Test Categories, Test Checklist Provided, Testing Coverage

## Knowledge Gaps
- **524 isolated node(s):** `INTEGRATION_GUIDE`, `MIGRATION_CHECKLIST`, `LocationContextType`, `LocationContext`, `LocationEnforcerProps` (+519 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Clinic` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`, `MapPanel.tsx`, `Community 5`, `Community 8`, `Community 10`, `App`, `Community 17`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `📊 Backend Integration - Final Report` connect `📊 Backend Integration - Final Report` to `What Changed from Old Architecture`, `Maintenance & Support`, `Testing Coverage`, `Community 12`, `Key Features Implemented`, `🔧 Technical Deliverables`, `Cost-Benefit Analysis`, `Recommendations`, `Security Implementation`, `Code Quality`, `Deployment Readiness`, `Performance Metrics`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `📦 Complete Deliverables Package` connect `Community 21` to `Community 12`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `INTEGRATION_GUIDE`, `MIGRATION_CHECKLIST`, `LocationContextType` to the rest of the system?**
  _524 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05051480051480051 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0645933014354067 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06313497822931785 - nodes in this community are weakly interconnected._