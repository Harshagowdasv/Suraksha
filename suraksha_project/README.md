# Suraksha Project (MERN)

A minimal MERN starter with one working Users feature (GET and POST).

## Project Structure

```
suraksha_project/
  backend/
    .env.example
    config/
      db.js
    controllers/
      userController.js
    models/
      User.js
    routes/
      userRoutes.js
    package.json
    server.js
  frontend/
    package.json
    public/
      index.html
    src/
      App.css
      App.js
      index.js
      pages/
        Home.jsx
        Users.jsx
  README.md
```

## Backend
- Node.js + Express + Mongoose
- PORT defaults to 5000
- Endpoints
  - GET `/api/users`
  - POST `/api/users` { name, email }

### Setup
1. Copy `.env.example` to `.env` inside `backend/` and set your Mongo URI.

Example `.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pw>@cluster0.mongodb.net/suraksha_db?retryWrites=true&w=majority
```

2. Install dependencies and run the server:
```
cd backend
npm install
npm run server
```

## Frontend
- React (react-scripts), axios, react-router-dom
- Dev server on 3000, proxy to 5000

### Setup
```
cd frontend
npm install
npm start
```

## Seeding Example
Create one user via curl:
```
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"First User","email":"first@example.com"}'
```
Or use the Users page form at http://localhost:3000/users.

## Testing Endpoints
- GET users
```
curl http://localhost:5000/api/users
```
- POST user
```
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com"}'
```

## Troubleshooting
- Ensure MongoDB Atlas network access allows your IP and the database user has correct credentials.
- If CORS issues occur when not using the React proxy, use full URL in axios: `axios.get('http://localhost:5000/api/users')`.
- If port 5000 is busy, change `PORT` in `backend/.env` and update the `proxy` in `frontend/package.json` accordingly.
- Duplicate email returns HTTP 409 with `{ message: "Email already exists" }`.

## License
MIT

## Dashboards v1

This update adds simple dashboards for Teacher, Mentor, and Student with JWT-protected APIs. The Login page issues a JWT based on your email and role (no password, dev-only).

### New Backend Endpoints
- Auth (no auth required)
  - POST `/api/auth/login` { email, role: 'teacher'|'mentor'|'student' } → `{ token }`
- Teachers (JWT required)
  - GET `/api/teachers`
  - POST `/api/teachers`
  - GET `/api/teachers/:email`
  - PUT `/api/teachers/:email`
- Mentors (JWT required)
  - GET `/api/mentors`
  - POST `/api/mentors`
  - GET `/api/mentors/:email`
  - PUT `/api/mentors/:email`
  - POST `/api/mentors/sendResource` { mentorEmail, resource }
  - GET `/api/mentors/resourcesForStudent?studentEmail=...`
- Students (JWT required)
  - GET `/api/students`
  - POST `/api/students`
  - GET `/api/students/:email`
  - PUT `/api/students/:email`
  - POST `/api/students/bulkAdd` { students: [...] }

### Frontend Pages
- `/login` — Select role and email, obtains JWT, stores in localStorage.
- `/teacher` — Upload CSV and bulk add students.
- `/mentor` — Send resource/message to assigned students.
- `/student` — View personal details and mentor resources.

### How to Test (example sequence)
1. Start servers (see Run checklist).
2. Open http://localhost:3000/login and login as:
   - Teacher: `teacher1@example.com`, role `teacher`
3. Go to `/teacher` and upload a CSV with columns: `name,email,usn,cgpa,attendance,mentorEmail,classTeacherEmail`.
4. Create a mentor document (first time only), then send a resource:
   - Mentor: `mentor1@example.com`, role `mentor`
5. Go to `/mentor` and send a resource (text or link). It is stored on the mentor document.
6. Login as student:
   - Student: use one student email from your CSV, role `student`
7. Visit `/student` to see student profile and mentor resources.

### cURL examples
- Get JWT (mentor example):
```
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor1@example.com","role":"mentor"}'
```
Use the `token` from the response below.

- Create a mentor document (authorized):
```
curl -X POST http://localhost:5000/api/mentors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Mentor One","email":"mentor1@example.com"}'
```

- Send Resource (authorized):
```
curl -X POST http://localhost:5000/api/mentors/sendResource \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"mentorEmail":"mentor1@example.com","resource":"https://example.com/guide.pdf"}'
```

- Student detail (authorized):
```
curl http://localhost:5000/api/students/student1@example.com \
  -H "Authorization: Bearer <TOKEN>"
```

### Notes
- APIs are JWT-protected except `/api/auth/login`.
- Default MongoDB URL can be local: `mongodb://127.0.0.1:27017/suraksha`.
- Relationships are by email for simplicity.

### Rerun after update
- Backend: install new dep and restart
```
cd backend
npm install
npm run server
```
- Frontend: install new dep and restart
```
cd frontend
npm install
npm start
