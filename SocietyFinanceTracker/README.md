# 🛡️ Society Finance Tracker

A premium, state-of-the-art financial management dashboard built for housing societies. This application provides real-time tracking of receipts, expenses, reimbursements, and bank ledgers with a focus on high-end aesthetics and user experience.

Created by **Nishant Modi**.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- [npm](https://www.npmjs.com/) (v8.0.0 or higher)
- A [Supabase](https://supabase.com/) account and project

### 🛠️ Installation

1. **Clone the repository** (or download the source):
   ```bash
   git clone <repository-url>
   cd SocietyFinanceTracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *(Note: You can find these in your Supabase project settings under API.)*

### 🗄️ Database Setup

The application uses Supabase as its backend. To set up the database:
1. Go to your Supabase project's **SQL Editor**.
2. Copy the contents of the `supabase_schema.sql` file provided in this project.
3. Run the script to create the necessary tables (`flats`, `vendors`, `billing`, `receipts`, `expenses`, `reimbursements`, `petty_cash`, `bank_ledger`).

---

## 💻 Running Locally

### Development Mode
Start the development server with hot-reload enabled:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Production Build
To create a production-ready bundle:
```bash
npm run build
```
The output will be generated in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## ✨ Key Features

- **Dashboard**: High-level financial overview with maintenance metrics and recent bank activity.
- **Sidebar Navigation**: Collapsible sidebar for a cleaner focused workspace.
- **Theme Support**: Seamless switching between Dark and Light modes with persistent state.
- **Notes System**: Concealed notes icon (📝) in tables to keep layouts tidy.
- **Action Grids**: Compact 2x2 layout for data management actions.
- **Responsive Tables**: Optimized view for all financial modules (Bank Ledger, Petty Cash, etc.).
- **Cloud Sync**: Real-time synchronization with Supabase backend.

---

## 🎨 Technology Stack

- **Frontend**: React 19 + Vite
- **Backend/DB**: Supabase (PostgreSQL)
- **Styling**: Vanilla CSS (Premium Design System)
- **Iconography**: SVG & Emoji

---

## 📄 License
This project is for private use within the society. Created by **Nishant Modi**.
