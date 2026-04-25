# Student Information System (SIS)

A full-stack web application for managing students, courses, sections,
enrollments, and academic years.\
Built with **FastAPI** (backend) and **React + TypeScript** (frontend),
designed for administrators and teachers.

------------------------------------------------------------------------

# Screenshots

### Admin Dashboard
![Admin Dashboard](./screenshots/AdminDashboard.png)

### Teacher Dashboard
![Teacher Dashboard](./screenshots/TeacherDashboard.png)

### Academic Year Migration - Section Setup

![alt text](./screenshots/AcademicYearMigrationSetup.png)
### Admin Portal

-   Dashboard -- view current semester, enrollment status, and actions
-   Sections -- create, delete (with safeguards), and view details
-   Students -- search, register, and move between sections
-   Teachers -- add/search teachers (auto-generated passwords), view
    offerings
-   Departments -- view teachers and courses (with semester filter)
-   Course Offerings -- filter by year, semester, section, department,
    teacher
-   Academic Year Migration -- promote students and create next-year
    structure
-   Bulk Enrollment -- enroll all students for the current semester

### Teacher Portal

-   View assigned course offerings
-   Enter marks per student
-   Upload Excel marks (with preview)
-   Commit marks after final review

------------------------------------------------------------------------

## Tech Stack

  -----------------------------------------------------------------------
  Layer                          Technologies
  ------------------------------ ----------------------------------------
  Backend                        Python 3.12, FastAPI, SQLAlchemy,
                                 SQLModel, Pydantic, Pandas, python-jose,
                                 passlib

  Database                       PostgreSQL 

  Frontend                       React 18, TypeScript, Vite, React
                                 Router, Tailwind CSS, Axios

  Tooling                        Git, Postman
  
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Project Structure

### Backend
```text
backend/
├── app/
│   ├── routers/        # API endpoints (admin, teacher, auth)
│   ├── models.py       # SQLModel models
│   ├── schemas.py      # Pydantic schemas
│   ├── oauth2.py       # JWT handling
│   └── main.py
├── seed_*.py           # Database seeding scripts
└── requirements.txt
```

### Frontend
```text
frontend/
├── src/
│   ├── api/            # Axios client and endpoint functions
│   ├── components/     # Reusable UI components
│   ├── features/       # Feature-based modules (AdminDashboard)
│   ├── pages/          # Page components (admin, teacher, login)
│   ├── types/          # TypeScript interfaces
│   └── hooks/          # Custom hooks (auth, dashboard)
└── package.json
```

------------------------------------------------------------------------

## Setup

### Prerequisites

-   Python 3.12+
-   Node.js 18+
-   PostgreSQL (optional)

------------------------------------------------------------------------

### Backend

``` bash
git clone https://github.com/AbdulRahmanLuai/Student-Information-System
cd Student-Information-System/backend

python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:

``` ini
DATABASE_URL=postgresql://user:pass@localhost/sis_db
# or sqlite:///./test.db
SECRET_KEY=your-secret-key
ADMIN_TOKEN=your-seed-token (optional)
```

Run:

``` bash
uvicorn app.main:app --reload
```

Docs: http://localhost:8000/docs

------------------------------------------------------------------------

### Frontend

``` bash
cd ../frontend
npm install
npm run dev
```

Runs at: http://localhost:5173

------------------------------------------------------------------------

## Dev Utilities (⚠️ Development Only)

Scripts for resetting data and simulating full academic flows.

### Key Scripts

-   `drop_all.py` -- drop all tables
-   `seed_academic_state.py` -- simulate academic year completion
-   `seed_commit_academic_state.py` -- simulate academic year completion + teacher assignment to course offerings
-   `seed_commit_marks.py` -- assign random marks and complete
    enrollments

### Notes

-   Deletes and overrides data
-   Uses SQL + API calls
-   Requires:

``` ini
DATABASE_URL=...
ADMIN_TOKEN=...
```

-   Assumes backend at `http://localhost:8000`

------------------------------------------------------------------------

## Usage

### Admin

-   Manage sections, students, teachers, departments
-   Filter and manage course offerings
-   Run academic year migration
-   Enroll students and manage semesters

### Teacher

-   View assigned courses
-   Enter or upload marks
-   Review and commit results

------------------------------------------------------------------------

## Excel Format

-   `student_id` (integer)
-   `final_mark` (0--100)

Template available in UI.

------------------------------------------------------------------------

## API Overview

Admin routes are prefixed with `/admin`

-   `/admin/sections`
-   `/admin/course-offerings`
-   `/admin/students`
-   `/admin/teachers`
-   `/admin/academic-year`
-   `/teacher/course-offerings/{id}/marks`

Docs: http://localhost:8000/docs

------------------------------------------------------------------------

## Future Plans

-   Data visualization dashboards

------------------------------------------------------------------------

## Contact

Abdul Rahman Abu Nabhan
AbdulRahman.Luai1@gmail.com
[LinkedIn](https://www.linkedin.com/in/abdul-rahman-abu-nabhan-95794924a/)
