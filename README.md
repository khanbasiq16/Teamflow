# ProjectFlow — Full Stack Project Management System

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (JSON Web Tokens)
- **Email**: Nodemailer (invite emails)

---

## Folder Structure

```
projectflow/
├── backend/                  # Express + Node.js API
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── invite.js
│   ├── middleware/
│   │   └── auth.js
│   ├── .env
│   └── server.js
│
└── frontend/                 # Next.js App
    ├── app/
    │   ├── layout.js
    │   ├── page.js           # Landing / Login
    │   ├── dashboard/
    │   │   └── page.js
    │   ├── projects/
    │   │   ├── page.js
    │   │   └── [id]/
    │   │       └── page.js
    │   └── invite/
    │       └── [token]/
    │           └── page.js
    ├── components/
    │   ├── Sidebar.js
    │   ├── TaskCard.js
    │   ├── ProjectCard.js
    │   └── InviteModal.js
    └── lib/
        └── api.js
```

---

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm init -y
npm install express mongoose jsonwebtoken bcryptjs nodemailer cors dotenv
node server.js
```

### 2. Frontend Setup
```bash
cd frontend
npx create-next-app@latest . --tailwind --app
npm install axios
npm run dev
```

### 3. MongoDB
- Use MongoDB Atlas (free tier) or local MongoDB
- Add connection string to backend `.env`

---

## .env (Backend)
```
PORT=5000
MONGO_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/projectflow
JWT_SECRET=your_super_secret_key
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```
