# Tiny Experiments v2 — Critical Upgrade Roadmap

## Goal

Transform Tiny Experiments from an MVP into a production-ready self-experimentation platform by implementing:

1. Database Constraints & Data Integrity
2. Offline Sync & Conflict Resolution
3. Experiment Lifecycle State Machine
4. Notifications & Reminders
5. Data Export & Backup
6. Automated Testing
7. Analytics & Insights Engine

---

# PHASE 1 — DATABASE CONSTRAINTS & DATA INTEGRITY ✅

## Objective

Prevent invalid, duplicate, and inconsistent data at the database level.

---

### Completed

- [x] **1.1** — Added all missing columns to experiments (start_date, end_date, completed_at, archived_at, current_streak, best_streak, visibility), experiment_logs (updated_at), reflections (updated_at), profiles (notification_preferences)
- [x] **1.2** — Added `UNIQUE(experiment_id, date)` constraint on experiment_logs
- [x] **1.3** — Added `UNIQUE(experiment_id)` constraint on reflections
- [x] **1.4** — Added CHECK constraints for char_length (title ≤200, hypothesis ≤2000, note ≤5000)
- [x] **1.5** — Replaced `is_public BOOLEAN` with `visibility TEXT` (private/unlisted/public), migrated existing data
- [x] **1.6** — Audited RLS: added missing INSERT/DELETE policies on profiles, updated all `is_public` references to `visibility`, added notifications table RLS
- [x] **Frontend** — Updated `experimentService.toFrontend` to map new columns, `createExperiment` to set start/end dates, `restoreExperiment` to preserve new fields, `helpers.js` to use end_date for calculations

### Files Changed

- `supabase-schema.sql` — Full rewritten with new schema, migrations, constraints, and RLS
- `src/lib/experimentService.js` — Updated toFrontend, createExperiment, restoreExperiment
- `src/utils/helpers.js` — Updated calculateProgress, currentDay, isExperimentExpired to use endDate

### Note

Run `supabase-schema.sql` in the Supabase SQL Editor to apply all DB changes. The file includes both CREATE TABLE (fresh installs) and ALTER TABLE migrations (existing databases). All operations are idempotent.

---

# PHASE 2 — OFFLINE SYNC & CONFLICT RESOLUTION

## Objective

Ensure data is never lost when users work offline.

---

## Task 2.1 — Create Sync Queue

Create local queue:

```javascript
pendingOperations = [
  {
    id,
    action,
    payload,
    timestamp,
  },
];
```

Stored in:

```javascript
localStorage;
```

---

## Task 2.2 — Detect Connectivity

Implement:

```javascript
window.addEventListener("online");
window.addEventListener("offline");
```

Create:

```javascript
isOnline;
```

global state.

---

## Task 2.3 — Sync Service

Create:

```text
src/services/syncService.js
```

Responsibilities:

- replay queued actions
- retry failures
- remove successful operations
- update local cache

---

## Task 2.4 — Conflict Resolution

Adopt:

```text
Last Write Wins
```

Version 1.

Comparison:

```text
updated_at timestamps
```

Most recent change wins.

---

## Task 2.5 — Sync Status UI

Show status:

```text
✓ Synced

↻ Syncing

⚠ Offline
```

Location:

Top navigation bar.

---

## Task 2.6 — Offline Testing

Verify:

- create experiment offline
- log offline
- edit offline
- reconnect
- successful sync

---

# PHASE 3 — EXPERIMENT LIFECYCLE STATE MACHINE

## Objective

Formalize experiment progression.

---

## Task 3.1 — Introduce States

Replace current status logic.

Allowed states:

```text
draft
active
completed
paused
abandoned
archived
```

---

## Task 3.2 — Define Transitions

```text
draft → active

active → paused

paused → active

active → completed

active → abandoned

completed → archived
```

Disallow invalid transitions.

---

## Task 3.3 — Auto Completion

When:

```text
today >= end_date
```

System should:

```text
Mark experiment completed
Prompt reflection
```

---

## Task 3.4 — Extend Experiment

Add:

```text
Extend Duration
```

Action.

Updates:

```text
end_date
```

without losing history.

---

## Task 3.5 — Restart Experiment

Feature:

```text
Restart PACT
```

Creates:

New experiment instance

Retains historical archive.

---

## Task 3.6 — Lifecycle Dashboard Widgets

Display:

```text
Active

Paused

Completed

Abandoned
```

Counts.

---

# PHASE 4 — NOTIFICATIONS & REMINDERS

## Objective

Improve consistency and retention.

---

## Task 4.1 — Notification Preferences

Profiles table:

```sql
ALTER TABLE profiles
ADD COLUMN notification_preferences JSONB;
```

---

## Task 4.2 — Daily Reminder Logic

Condition:

```text
No log submitted today
```

Trigger reminder.

---

## Task 4.3 — Email Notifications

Use:

Supabase Edge Functions.

Events:

- daily reminder
- experiment completed
- reflection due

---

## Task 4.4 — In-App Notifications

Create table:

```sql
notifications
```

Fields:

```text
id
user_id
title
message
read
created_at
```

---

## Task 4.5 — Notification Center

Add bell icon.

Features:

- unread count
- mark as read
- clear all

---

## Task 4.6 — Reminder Scheduling

Run daily cron.

Check:

```text
active experiments
missing logs
```

Generate notifications.

---

# PHASE 5 — DATA EXPORT & BACKUP

## Objective

Give users ownership of their data.

---

## Task 5.1 — Export Experiment

Formats:

```text
JSON
CSV
Markdown
```

---

## Task 5.2 — Export Entire Account

Include:

- experiments
- logs
- reflections
- analytics

Single ZIP file.

---

## Task 5.3 — Markdown Report Generator

Generate:

```text
Experiment Summary

PACT

Logs

Reflection

Outcome
```

For sharing externally.

---

## Task 5.4 — Backup Restore

Import:

```text
JSON exports
```

into account.

---

## Task 5.5 — Export UI

Add:

```text
Settings → Export Data
```

screen.

---

# PHASE 6 — TESTING INFRASTRUCTURE

## Objective

Prevent regressions.

---

## Task 6.1 — Install Testing Stack

Dependencies:

```bash
npm install -D vitest
npm install -D @testing-library/react
npm install -D playwright
```

---

## Task 6.2 — Unit Tests

Coverage:

### Reducers

- ADD_EXPERIMENT
- UPDATE_EXPERIMENT
- ADD_LOG
- DELETE
- UNDO

### Helpers

- streak calculation
- mood averages
- timeline sorting

Target:

```text
80% coverage
```

---

## Task 6.3 — Integration Tests

Test:

- Supabase CRUD
- Auth flows
- Sync queue

---

## Task 6.4 — End-to-End Tests

Scenarios:

### User Journey

```text
Register
Create PACT
Add Log
Reflect
Export
Delete
```

### OAuth Journey

```text
Google Login
```

### Offline Journey

```text
Disconnect
Create Log
Reconnect
Sync
```

---

## Task 6.5 — CI Pipeline

On every PR:

```bash
npm run test
npm run build
```

Must pass before merge.

---

# PHASE 7 — ANALYTICS & INSIGHTS ENGINE

## Objective

Turn raw logs into actionable insights.

---

## Task 7.1 — Analytics Service

Create:

```text
src/services/analyticsService.js
```

---

## Task 7.2 — Core Metrics

Calculate:

### User Metrics

```text
Total Experiments

Completion Rate

Average Mood

Best Streak

Total Logs
```

---

### Experiment Metrics

```text
Mood Change

Days Logged

Completion %

Duration

Decision Outcome
```

---

## Task 7.3 — Insight Generation

Examples:

```text
Your fitness experiments improve mood by +1.2

You are most consistent on weekdays

Experiments longer than 30 days have lower completion rates
```

---

## Task 7.4 — Analytics Dashboard

Add cards:

```text
Completion Rate

Mood Trend

Consistency Trend

Decision Distribution
```

---

## Task 7.5 — Charts

Implement:

```text
Mood Over Time

Logs Per Week

Experiment Outcomes

Category Performance
```

---

## Task 7.6 — Analytics Database Views

Create PostgreSQL views:

```sql
user_statistics

experiment_statistics

mood_trends
```

For efficient queries.

---

# DEFINITION OF DONE

Version 2 is complete when:

✅ No duplicate logs

✅ No duplicate reflections

✅ Offline work syncs correctly

✅ Lifecycle states are enforced

✅ Notifications function automatically

✅ Users can export all data

✅ Test coverage exceeds 80%

✅ Analytics dashboard generates insights

✅ RLS policies audited and verified

✅ CI pipeline passes consistently

✅ Application remains responsive on mobile and desktop
