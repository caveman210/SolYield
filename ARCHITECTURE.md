# Architecture & Modularity Guide

This document explains the modular architecture of the SolYield application, focusing on separation of concerns and maintainability.

## Core Principles

1. **Separation of Concerns**: UI components are separate from business logic
2. **Single Responsibility**: Each module has one clear purpose
3. **Dependency Direction**: UI depends on business logic, not vice versa
4. **Pure Functions**: Utilities are stateless and testable
5. **Hook Abstraction**: Redux complexity hidden behind custom hooks

---

## Layer Architecture

```
┌─────────────────────────────────────────┐
│          UI Layer (Presentation)        │
│  - Components (React)                   │
│  - Screens (Pages)                      │
│  - Styling (M3 Tokens)                  │
└─────────────────┬───────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────┐
│         Business Logic Layer            │
│  - Custom Hooks (useActivityManager)    │
│  - Utility Functions (activityUtils)    │
│  - Type Definitions                     │
└─────────────────┬───────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────┐
│          Data Layer (State)             │
│  - Redux Store                          │
│  - Redux Slices (activitySlice)         │
│  - Selectors                            │
└─────────────────────────────────────────┘
```

---

## Module Structure

### 1. **Data Layer** (`/store`)

**Purpose**: Manage application state with Redux

**Files**:

- `store/index.ts` - Configure Redux store
- `store/slices/activitySlice.ts` - Activity state management
- `store/slices/maintenanceSlice.ts` - Maintenance forms state

**Example**:

```typescript
// Activity slice exports actions and selectors
export const { addActivity, markActivitySynced } = activitySlice.actions;
export const selectAllActivities = (state: RootState) => state.activity.activities;
```

**Key Points**:

- ✅ Pure Redux logic, no UI code
- ✅ Actions are simple and focused
- ✅ State shape is well-typed
- ✅ Selectors provide computed state

---

### 2. **Business Logic Layer**

#### A. **Utility Functions** (`/lib/utils/activityUtils.ts`)

**Purpose**: Pure, reusable functions with no dependencies

**Exports**:

```typescript
// Time formatting
formatRelativeTime(timestamp: number): string

// Activity metadata
getActivityIcon(type: ActivityType): string
getActivityColorRole(type: ActivityType): string

// Factory functions
createActivity(data): Activity

// Data transformations
filterActivitiesByType(activities, type): Activity[]
filterActivitiesBySite(activities, siteId): Activity[]
sortActivitiesByTimestamp(activities): Activity[]
getMostRecentActivities(activities, limit): Activity[]
getUnsyncedActivities(activities): Activity[]
groupActivitiesByDate(activities): SectionData[]
```

**Characteristics**:

- ✅ **Pure functions** - No side effects
- ✅ **Testable** - Easy to unit test
- ✅ **Reusable** - Used by hooks and components
- ✅ **No React/Redux dependencies**

---

#### B. **Custom Hooks** (`/lib/hooks/useActivityManager.ts`)

**Purpose**: Encapsulate Redux interactions and business rules

**Exports**:

```typescript
// Read operations
useActivities() → { activities, isLoading }
useRecentActivities(limit) → { activities, isLoading }
useActivitiesByType(type) → { activities, isLoading }
useActivitiesBySite(siteId) → { activities, isLoading }

// Write operations
useActivityActions() → { createActivity, syncActivity, deleteActivity, clearAll }

// Computed state
useUnsyncedActivities() → { unsyncedActivities, count, hasUnsynced }

// Combined hook
useActivityManager() → All of the above
```

**Characteristics**:

- ✅ **Encapsulation** - Hides Redux complexity from UI
- ✅ **Memoization** - Uses useCallback for actions
- ✅ **Composition** - Small hooks compose into larger ones
- ✅ **Single Source of Truth** - All components use same hooks

**Example Usage in Component**:

```typescript
function MyScreen() {
  const { activities } = useRecentActivities(5);
  const { createActivity } = useActivityActions();

  // Component only deals with data, not Redux
}
```

---

### 3. **UI Layer**

#### A. **Reusable Components** (`/app/components`)

**ActivityCard.tsx** - Pure presentation component

**Props**:

```typescript
interface ActivityCardProps {
  activity: Activity; // Data to display
  onPress?: (Activity) => void; // Callback for interaction
}
```

**Characteristics**:

- ✅ **Presentation-only** - No business logic
- ✅ **Reusable** - Used in Dashboard and Activities screen
- ✅ **Prop-driven** - All data passed via props
- ✅ **Callback pattern** - Parent handles navigation
- ✅ **Theme-aware** - Uses Material You colors

**Example**:

```typescript
<ActivityCard
  activity={activity}
  onPress={(act) => router.push(`/site/${act.siteId}`)}
/>
```

---

#### B. **Screen Components** (`/app`)

**Dashboard (`/app/(tabs)/index.tsx`)**

**Responsibilities**:

- Render UI structure
- Connect to business logic via hooks
- Handle user interactions
- Pass data to child components

**What it does NOT do**:

- ❌ Direct Redux dispatch/selectors
- ❌ Data transformation logic
- ❌ Time formatting
- ❌ Color selection logic

**Example Structure**:

```typescript
export default function Dashboard() {
  // 1. Get data via hooks
  const { activities } = useRecentActivities(3);
  const { createActivity } = useActivityActions();

  // 2. Define handlers
  const handleActivityPress = (activity) => {
    router.push(`/site/${activity.siteId}`);
  };

  // 3. Render UI
  return (
    <View>
      {activities.map(activity => (
        <ActivityCard
          activity={activity}
          onPress={handleActivityPress}
        />
      ))}
    </View>
  );
}
```

---

**Activities Screen (`/app/activities.tsx`)**

**Responsibilities**:

- Full-screen activity list with filtering
- Uses `useActivitiesByType` hook for filtered data
- Delegates rendering to ActivityCard component

**Modularity Benefits**:

```typescript
// Before: Inline filtering logic
const filtered = activities.filter((a) => a.type === filterType);

// After: Hook handles the logic
const { activities: filtered } = useActivitiesByType(filterType);
```

---

## Data Flow Example

**User clicks "See All" on Dashboard**

```
1. User Action
   ↓
2. Dashboard → router.push('/activities')
   ↓
3. Activities Screen renders
   ↓
4. useActivitiesByType('all') hook called
   ↓
5. Hook calls useActivities()
   ↓
6. useActivities reads from Redux: useSelector(state => state.activity.activities)
   ↓
7. Hook applies filterActivitiesByType(activities, 'all') utility
   ↓
8. Returns { activities, isLoading }
   ↓
9. Activities Screen maps activities → ActivityCard
   ↓
10. ActivityCard renders with formatRelativeTime() utility
```

**Notice**: Each layer only talks to the layer below it.

---

## Benefits of This Architecture

### 1. **Testability**

```typescript
// Utils are pure functions - easy to test
expect(formatRelativeTime(Date.now() - 3600000)).toBe('1 hour ago');

// Hooks can be tested with @testing-library/react-hooks
const { result } = renderHook(() => useRecentActivities(5));
expect(result.current.activities).toHaveLength(5);

// Components can be tested with mock hooks
jest.mock('../lib/hooks/useActivityManager');
```

### 2. **Maintainability**

- Change formatting logic? Edit `activityUtils.ts` only
- Add new activity type? Update utility functions, hooks auto-update
- Change Redux structure? Update hooks, components untouched

### 3. **Reusability**

```typescript
// Same component, different data sources
<ActivityCard activity={fromDashboard} />
<ActivityCard activity={fromActivitiesScreen} />
<ActivityCard activity={fromSiteDetails} />

// Same hook, different screens
useRecentActivities(3)  // Dashboard
useRecentActivities(10) // Widget
useRecentActivities(50) // Full list
```

### 4. **Type Safety**

```typescript
// Types flow through all layers
Activity → Redux State → Hook Return → Component Props → UI
```

Every layer is fully typed with TypeScript strict mode.

---

## Adding a New Feature

**Example: Add "Mark as Read" to Activities**

### Step 1: Update Data Layer

```typescript
// store/slices/activitySlice.ts
export interface Activity {
  // ... existing fields
  isRead: boolean; // Add new field
}

// Add new action
markAsRead: (state, action: PayloadAction<string>) => {
  const activity = state.activities.find((a) => a.id === action.payload);
  if (activity) activity.isRead = true;
};
```

### Step 2: Update Business Logic

```typescript
// lib/utils/activityUtils.ts
export function getUnreadActivities(activities: Activity[]): Activity[] {
  return activities.filter((a) => !a.isRead);
}

// lib/hooks/useActivityManager.ts
export function useUnreadActivities() {
  const { activities } = useActivities();
  return getUnreadActivities(activities);
}

export function useActivityActions() {
  // ... existing
  const markRead = useCallback(
    (id: string) => {
      dispatch(markAsRead(id));
    },
    [dispatch]
  );

  return { markRead /* ... */ };
}
```

### Step 3: Update UI Layer

```typescript
// app/components/ActivityCard.tsx
// Add visual indicator if unread
{!activity.isRead && <Badge />}

// app/(tabs)/index.tsx
const { markRead } = useActivityActions();

<ActivityCard
  activity={activity}
  onPress={(act) => {
    markRead(act.id);  // Mark as read on click
    handleNavigation(act);
  }}
/>
```

**Notice**: Each layer updates independently. No breaking changes.

---

## Module Dependency Rules

### ✅ Allowed Dependencies

```
UI Components → Business Hooks → Utilities → Types
UI Components → Utilities → Types
UI Components → Types
Business Hooks → Redux Store
Business Hooks → Utilities
Utilities → Types
Redux Store → Types
```

### ❌ Forbidden Dependencies

```
Redux Store → Business Hooks (store shouldn't know about hooks)
Utilities → Business Hooks (utils should be pure)
Utilities → Redux Store (utils shouldn't have side effects)
Business Hooks → UI Components (hooks shouldn't import React components)
```

---

## File Organization

```
lib/
├── hooks/
│   ├── useActivityManager.ts      # Business logic hooks
│   ├── useMaterialYou.ts          # Theme hook
│   └── MaterialYouProvider.tsx    # Theme context
├── utils/
│   └── activityUtils.ts           # Pure utility functions
├── types/
│   └── index.ts                   # TypeScript definitions
└── design/
    ├── tokens.ts                  # M3 design tokens
    └── colorRoles.ts              # M3 color system

store/
├── index.ts                       # Redux store config
└── slices/
    ├── activitySlice.ts           # Activity state
    └── maintenanceSlice.ts        # Maintenance state

app/
├── components/
│   ├── ActivityCard.tsx           # Reusable UI component
│   ├── StyledText.tsx             # Text wrapper
│   └── Card.tsx                   # Card wrapper
├── (tabs)/
│   ├── index.tsx                  # Dashboard screen
│   ├── sites.tsx                  # Sites screen
│   └── schedule.tsx               # Schedule screen
└── activities.tsx                 # Activities screen
```

---

## Best Practices

### 1. **Keep Components Dumb**

```typescript
// ❌ Bad: Component has business logic
function ActivityCard({ activity }) {
  const now = Date.now();
  const diff = now - activity.timestamp;
  const timeStr = diff < 60000 ? 'Just now' : `${Math.floor(diff / 60000)} min ago`;
  // ...
}

// ✅ Good: Component delegates to utility
function ActivityCard({ activity }) {
  const timeStr = formatRelativeTime(activity.timestamp);
  // ...
}
```

### 2. **Use Hooks for State Access**

```typescript
// ❌ Bad: Direct Redux access in component
function Dashboard() {
  const activities = useSelector((state) => state.activity.activities);
  const recent = activities.slice(0, 3);
  // ...
}

// ✅ Good: Hook encapsulates logic
function Dashboard() {
  const { activities } = useRecentActivities(3);
  // ...
}
```

### 3. **Pure Utilities**

```typescript
// ❌ Bad: Utility with side effects
export function createAndSaveActivity(data) {
  const activity = { ...data, id: genId() };
  store.dispatch(addActivity(activity)); // Side effect!
  return activity;
}

// ✅ Good: Pure factory function
export function createActivity(data) {
  return { ...data, id: genId(), timestamp: Date.now() };
}

// Side effects in hooks, not utilities
export function useActivityActions() {
  const dispatch = useDispatch();
  const create = (data) => dispatch(addActivity(createActivity(data)));
  return { create };
}
```

### 4. **Callback Props for Interactions**

```typescript
// ❌ Bad: Component handles navigation
function ActivityCard({ activity }) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(`/site/${activity.siteId}`)}>
      {/* ... */}
    </TouchableOpacity>
  );
}

// ✅ Good: Parent controls behavior
function ActivityCard({ activity, onPress }) {
  return (
    <TouchableOpacity onPress={() => onPress?.(activity)}>
      {/* ... */}
    </TouchableOpacity>
  );
}

// Usage
<ActivityCard
  activity={activity}
  onPress={(act) => router.push(`/site/${act.siteId}`)}
/>
```

---

## Testing Strategy

### Utility Functions

```typescript
describe('activityUtils', () => {
  it('formats time correctly', () => {
    expect(formatRelativeTime(Date.now() - 60000)).toBe('1 minute ago');
  });
});
```

### Custom Hooks

```typescript
import { renderHook } from '@testing-library/react-hooks';

describe('useRecentActivities', () => {
  it('returns limited activities', () => {
    const { result } = renderHook(() => useRecentActivities(3));
    expect(result.current.activities).toHaveLength(3);
  });
});
```

### Components

```typescript
import { render } from '@testing-library/react-native';

describe('ActivityCard', () => {
  it('displays activity title', () => {
    const { getByText } = render(
      <ActivityCard activity={mockActivity} />
    );
    expect(getByText('Test Activity')).toBeTruthy();
  });
});
```

---

## Summary

This modular architecture ensures:

✅ **Separation of Concerns** - UI, logic, and data are isolated  
✅ **Maintainability** - Changes in one layer don't break others  
✅ **Testability** - Each layer can be tested independently  
✅ **Reusability** - Components and utilities are composable  
✅ **Type Safety** - TypeScript strict mode throughout  
✅ **Scalability** - Easy to add new features following patterns

When adding new features, always ask:

1. Does this logic belong in a utility function?
2. Should this state access be in a hook?
3. Is this component purely presentational?
4. Can this be reused in other screens?
