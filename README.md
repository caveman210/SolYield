# SolYield Mobile - Solar Farm Management App

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-Expo%2054-blue?style=flat-square&logo=react" alt="React Native Expo">
  <img src="https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Redux%20Toolkit-Latest-red?style=flat-square&logo=redux" alt="Redux Toolkit">
  <img src="https://img.shields.io/badge/Material%20You-Design-green?style=flat-square" alt="Material You">
</p>

## Project Overview

SolYield Mobile is a production-ready React Native (Expo) application designed for solar field technicians to manage site visits, perform inspections, and generate performance reports. Built with a focus on offline-first architecture and modern UI/UX principles using Material You design language.

### Architecture Note

> **Deviation from Standard Branching:** This implementation combines both Level 1 and Level 2 features in a single unified codebase rather than using separate `level-1` and `level-2` branches. All features are integrated into the `main` branch for a seamless, production-ready application.

---

## Technical Stack

| Category             | Technology                                                         |
| -------------------- | ------------------------------------------------------------------ |
| **Framework**        | React Native with Expo SDK 54                                      |
| **Language**         | TypeScript (Strict Mode)                                           |
| **State Management** | Redux Toolkit with Redux Persist                                   |
| **Navigation**       | Expo Router (File-based routing)                                   |
| **UI Framework**     | NativeWind (Tailwind CSS) + Material You                           |
| **Offline Database** | WatermelonDB                                                       |
| **Maps**             | react-native-maps (uses Expo's native maps implementation for now) |
| **Charts**           | react-native-gifted-charts                                         |
| **PDF Generation**   | expo-print                                                         |
| **Calendar**         | expo-calendar                                                      |
| **Location**         | expo-location                                                      |

---

## Features Implemented

### Level 1: The Connected Technician

#### 1. My Visits (Schedule & Calendar) : **Finishing touches remaining**

- Display scheduled maintenance visits with date, time, and site information
- Calendar sync functionality using `expo-calendar`
- Visit cards with quick actions (Inspection, Navigate)
- Pull-to-refresh and empty state handling
- Floating action button for adding new visits

#### 2. "I'm Here!" (Geofencing & Check-in) : **Work in Progress**

- Real-time GPS tracking with `expo-location`
- Distance calculation from current location to site coordinates
- 500-meter radius geofencing validation
- Success/failure messages based on proximity
- Live distance and ETA updates

#### 3. Site Maps : **Implementation almost done**

- Interactive map view using `react-native-maps`
- Custom solar panel markers for each site
- Route visualization from user to destination
- Deep-link integration with Google Maps/Apple Maps
- Real-time location tracking with heading indicator

#### 4. The Report Card (PDF & Charts) : **Supports only static data for now, plan to fix later**

- **Bar Chart:** Daily energy generation with month navigation
- **Pie Chart:** Performance distribution (Over/Normal/Under/Zero)
- Stats cards showing Average, Peak, and Total generation
- PDF export functionality using `expo-print`
- Share/save PDF reports

### Level 2: The Offline Warrior

#### 1. The Black Box (Persistence) : **Halfway done**

- Redux Persist with AsyncStorage for offline data storage
- Inspection forms persist across app restarts
- Automatic state rehydration on app launch

#### 2. Dynamic Form Engine : **Almost done**

- Schema-driven form rendering from `form_schema.js`
- Support for multiple field types:
  - Text inputs
  - Number inputs
  - Dropdown selects
  - Radio buttons
  - Checkboxes
  - File uploads (camera/gallery)
- Form validation with error messages

#### 3. Visual Evidence : **Almost done, DB integration remaining**

- Camera integration using `expo-camera`
- Image picker for gallery uploads
- Image preview and removal functionality
- Images stored as local URIs in the database

#### 4. Sync-on-Reconnect : **Done**

- Network status detection using `@react-native-community/netinfo`
- Online/Offline status banner in inspection form
- Automatic sync indicator (cloud-check/cloud-upload)
- Manual refresh capability in history view

---

## Project Structure

```
SolYield/
├── app/                        # Expo Router pages
│   ├── (tabs)/                 # Tab-based navigation
│   │   ├── index.tsx          # Dashboard/Home
│   │   ├── schedule.tsx       # My Visits
│   │   ├── sites.tsx          # Solar Sites list
│   │   ├── inspection.tsx     # Offline inspection form
│   │   └── history.tsx        # Inspection history
│   ├── site/[id].tsx          # Site details
│   ├── inspection/[id].tsx    # Inspection detail view
│   ├── performance.tsx        # Charts & PDF export
│   ├── map-navigation.tsx     # GPS navigation
│   └── components/            # Reusable UI components
├── store/                      # Redux Toolkit store
│   ├── slices/                # Feature slices
│   └── index.ts              # Store configuration
├── lib/                       # Business logic & utilities
│   ├── hooks/                # Custom React hooks
│   ├── data/                 # Static data files
│   ├── utils/                # Utility functions
│   └── design/               # M3 design tokens
└── assets/                   # Images & icons
```

---

## Design System

### Material You Integration

- Full dynamic color extraction using `react-native-material-you-colors`
- Pastel-leaning color palette for accessibility
- Light and Dark mode support
- M3 elevation and surface tinting
- Expressive animations using `react-native-reanimated`

### Key UI Components

- Custom TabBar with M3 styling
- Animated StatCards with shadow effects
- Bottom sheet modals
- Floating action buttons (FAB)
- Pull-to-refresh lists
- Form field components (text, select, radio, checkbox, file)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android builds)
- Xcode (for iOS builds)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SolYield

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Test run on Android devices
npx expo run:android

```

### Build Commands

```bash
# Development build
npm start

# Android APK build
npm run android:build

# iOS build
npm run ios

# Lint code
npm run lint

# Format code
npm run format
```

---

## Screenshots

### Dashboard

![Dashboard](media/screenshots/Dashboard.jpeg)

- Material You themed home screen (ever so slightly buggy with coloring)
- Quick stats overview
- Recent activity feed
- Offline/Online status indicator

### My Visits (Schedule)

![Calendar](media/screenshots/Calendar.jpeg)

- Scheduled maintenance visits list
- Date badges (Today/Tomorrow/Date)
- Quick action buttons (Inspection, Navigate)
- Calendar sync button

### Solar Sites Map

![Sites](media/screenshots/Sites.jpeg)

- Interactive map with solar site markers
- Site list view with capacity info
- Navigation to individual sites

### GPS Navigation

- Real-time location tracking
- Distance and ETA display
- External navigation deep-links
- Site details bottom sheet

### Performance Analytics

![Performance](media/screenshots/Performance.jpeg)

- Bar chart: Daily energy generation
- Pie chart: Performance breakdown
- Stats: Average, Peak, Total kWh
- PDF export functionality

### Offline Inspection Form

![Inspection](media/screenshots/Inspection.jpeg)

- Dynamic form rendering from schema
- Site selection
- Multiple field types support
- Camera capture for site photos
- Offline status banner
- Sync status tracking

### Inspection History

- List of submitted inspections
- Sync status badges (Synced/Pending)
- Form detail view
- Image gallery support

---

## Key Technical Highlights

### Performance Optimizations

- `useMemo` and `useCallback` for expensive computations
- FlatList virtualization for large data sets
- Memoized Redux selectors
- Efficient chart rendering with gifted-charts

### Offline-First Architecture

- Redux Persist with AsyncStorage
- WatermelonDB for structured data
- Network state detection
- Automatic sync on reconnection

### TypeScript Strict Mode

- Full type coverage
- No `any` types
- Strict null checks
- Interface-based contracts

### Accessibility

- Pastel color palette for reduced eye strain
- High contrast text
- Touch target sizes (48dp minimum)
- Screen reader compatible labels
