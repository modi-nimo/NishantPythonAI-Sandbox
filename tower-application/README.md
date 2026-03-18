# Tower Communication & Complaint Management System MVP

This is a production-ready Next.js 14 Web Application designed iteratively for residential society communication and complaint management. 

## Tech Stack
- **Frontend**: Next.js 14 App Router, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Notifications**: Telegram Bot API 

---

## 🚀 Setup & Deployment Guide

### 1. Supabase Initialization
1. Create a project on [Supabase.com](https://supabase.com/).
2. Navigate to the SQL Editor in your Supabase dashboard.
3. Run the complete SQL script found in `supabase_setup.sql` in the root of this repository. This sets up all tables and Row Level Security policies.
4. Copy your `Project URL` and `anon public` keys from Project Settings -> API.

### 2. Telegram Bot Setup
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`, choose a name and username to receive your **Bot Token**.
3. Create a Group/Channel for committee members and add your bot as an admin, OR just start a chat with the bot yourself.
4. Retrieve your target Chat ID. (You can send a message to the bot and visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` to find the `chat.id`).
5. Set these variables in your deployment environment.

### 3. Environment Variables
Create a `.env.local` for local execution, or set these on your Vercel Dashboard:
```
NEXT_PUBLIC_SUPABASE_URL="your-proj-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

### 4. Admin Management (Security 🔒)
To ensure security, the admin dashboard uses BCrypt password hashing. **Do not store plain-text passwords in the `admins` table.**

#### How to Add/Update an Admin:
1. Generate a secure hash for the password using Node.js (Run this from the repository root):
   ```bash
   cd tower-application/tower-app && node -e "console.log(require('bcryptjs').hashSync('your_password_here', 10))"
   ```
2. Open your Supabase **Table Editor** for the `admins` table.
3. Insert or update a row with the email and the generated hash (e.g., `$2a$10$...`) in the `password` column.

### 5. Local Execution
```bash
cd tower-application/tower-app
npm install
npm run dev
```

### 6. Deployment on Vercel
1. Push this repository to GitHub.
2. Visit [Vercel](https://vercel.com/) and Import the project.
3. Select `tower-application/tower-app` as your Root Directory.
4. Add the Environment Variables collected in Steps 1, 2 & 3.
5. Hit **Deploy**.

---

## Modifying Logic
- **Complaint Submission**: Logic for form submission is in `/src/app/actions/complaints.ts`.
- **Public Dashboard**: The complaints view is in `/src/app/complaints/page.tsx`.
- **Admin Dashboard**: Manage complaints, notices, and updates in `/src/app/admin/page.tsx` and its actions.
- **Security Logic**: Login and hashing logic can be found in `/src/app/admin/login/actions.ts`.
