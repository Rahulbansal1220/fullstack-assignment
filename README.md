Fullstack Employee Dashboard – GraphQL + Node.js + React (Vite)

A full-stack application built with Node.js (Express + Apollo GraphQL), React (Vite), and JWT authentication.
The app includes secure login, employee listing, filtering, sorting, grid/tile UI views, and a modern dashboard.

Live Demo:

Frontend: https://fullstack-assignment-frontend-c90g.onrender.com

Backend: https://fullstack-assignment-7555.onrender.com/graphql

📌 Features
🔐 Authentication

JWT-based secure login

Admin + Employee role support

Protected GraphQL queries

👨‍🏫 Employee Module

Fetch employees with pagination

Sort by Attendance, Age, Name, Created Date

Filter by name, class, attendance %

Grid View and Tile View

Detailed Employee Modal

Subjects, Primary Subject, Attendance Band, etc.

⚙️ Backend (Node.js + Express + Apollo)

GraphQL Schema & Resolvers

Login Mutation

Employees Query

Add / Update Employee Mutations

In-memory database for assignment usage

JWT authentication middleware

🎨 Frontend (React + Vite)

Login page

Dashboard with tabs

Employee table view (Grid)

Tile card view

Modal details view

Dark UI theme

Fully responsive

📁 Project Structure
fullstack-assignment/
│
├── server/
│   ├── index.js
│   ├── package.json
│   └── (GraphQL schema + resolvers)
│
└── client/
    ├── src/
    │   ├── App.jsx
    │   ├── styles.css
    │   └── graphQL utils
    ├── vite.config.js
    ├── package.json
    └── index.html

🛠️ Backend Setup
Install dependencies
cd server
npm install

Run server
node index.js


Backend runs at:

http://localhost:4000/graphql

🧩 Frontend Setup
Install dependencies
cd client
npm install

Run development server
npm run dev


Frontend runs at:

http://localhost:5173

🌍 Deployment (Render)
🟢 Backend Deployment Settings
Setting	Value
Environment	Web Service
Build Command	npm install
Start Command	node index.js
Port	Auto-detect
🟣 Frontend Deployment Settings
Setting	Value
Root Directory	client
Build Command	npm install && npm run build
Publish Directory	dist
Environment Variables	VITE_API_URL = https://fullstack-assignment-7555.onrender.com/graphql
🔑 Environment Variables
Backend
JWT_SECRET = supersecret-key
PORT = 4000

Frontend
VITE_API_URL = https://fullstack-assignment-7555.onrender.com/graphql

📜 GraphQL API
Login Mutation
mutation {
  login(username: "admin", password: "admin123") {
    token
    user {
      id
      username
      role
    }
  }
}

Employees Query
query {
  employees(page: 1, pageSize: 10) {
    items {
      id
      name
      age
      className
      attendance
    }
  }
}

🧪 Test Credentials
Username	Password	Role
admin	admin123	ADMIN
john	john123	EMPLOYEE
