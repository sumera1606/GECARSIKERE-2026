# GEC Arsikere — Student Management Portal

## Firebase Backend Setup

This project uses Firebase (Firestore + Authentication + Storage) for real-time data sync across all devices.

### 1. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Storage Rules

Create `storage.rules` in your Firebase project:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /media/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == "admin@gecarsikere.edu";
    }
  }
}
```

```bash
firebase deploy --only storage
```

### 3. Enable Authentication Providers

In Firebase Console → Authentication → Sign-in method:
- Enable **Email/Password**

### 4. Create Admin Account

The admin account is created automatically on first login with:
- Email: `admin@gecarsikere.edu`
- Password: `GECARSIKERE2026`

### 5. Deploy to GitHub Pages

1. Push these files to a GitHub repository:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `firestore.rules`
2. Go to repo Settings → Pages → Source → Deploy from branch → `main`
3. Your portal will be live at `https://<username>.github.io/<repo>/`

### 6. Firebase Console Config

In Firebase Console → Authentication → Settings → Authorized domains:
- Add your GitHub Pages domain (e.g., `<username>.github.io`)

## Features

- **Student Registration** → stored in `pendingStudents` collection
- **Admin Approval** → moves student to `students` collection + enables Firebase Auth login
- **Faculty Registration** → creates Auth account + `faculty` collection entry (immediate login)
- **Attendance** → real-time sync; faculty marks → student sees instantly
- **Announcements** → real-time broadcast to all students & faculty
- **Assignments** → real-time; students see new assignments immediately
- **Messages** → real-time student-faculty chat with AI-powered faculty replies
- **Event Gallery** → photos/videos uploaded to Firebase Storage, URLs stored in Firestore
- **Dashboard** → all statistics from Firestore, live-updating

## Collections

| Collection | Purpose |
|---|---|
| `students` | Approved students |
| `pendingStudents` | Awaiting admin approval |
| `faculty` | Faculty members |
| `announcements` | Notices/announcements |
| `assignments` | Course assignments |
| `attendance` | Attendance records |
| `messages` | Student-faculty chat |
| `media` | Event photos/videos |

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no framework, no build step)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Real-time**: Firestore `onSnapshot` listeners
- **AI Chat**: Anthropic API (claude-sonnet-4-6)
