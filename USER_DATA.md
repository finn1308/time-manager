# USER DATA OWNERSHIP & BACKUP PROTOCOL

## 1. Data Sovereignty
LUYENTU & ChronoMind respects user ownership of all educational records, notes, flashcards, and mistake banks. Users are never locked into the platform.

## 2. Export & Import Center (`/settings/backup`)
- **Full Workspace Export (JSON)**:
  - Exports Notes, Flashcard Decks & Cards, Subjects & Study Goals, Tasks & Deadlines, Mistakes Bank, Assignments, Exams, Knowledge Graph, Cognitive Learning Memory, Calendar Events, Study Sessions, Habits, and Career Portfolio into a single timestamped JSON file.
- **CSV Tabular Export**:
  - Available for quick spreadsheet import (Excel / Google Sheets) for Tasks, Subjects, and Mistakes.
- **Backup Restoration (JSON)**:
  - Validates JSON schema integrity and imports missing records without overwriting newer client data.
  - Transactions ensure atomicity: if an import failure occurs, state rolls back cleanly.

## 3. PWA & Offline Support
- Progressive Web App manifest registered at [`public/manifest.json`](file:///Users/huy/Downloads/Time%20manager/public/manifest.json) enabling mobile installation to iOS / Android home screens.
- Web app features responsive standalone display mode with pastel theme color `#2d6a4f`.
