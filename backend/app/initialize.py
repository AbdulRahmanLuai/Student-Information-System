from datetime import date
from sqlmodel import SQLModel, Session, select
from app.database import engine
from app.models import (
    Department, Teacher, Course, Section,
    Semester, Student, CourseOffering, Enrollment, User, Role, SemesterStatus
)
from app.utils.security import hash_password


def create_db_and_tables():
    """Create all tables"""
    SQLModel.metadata.create_all(engine)
    print("Tables created successfully!")


def populate_sample_data():
    """Populate the database with test data"""
    with Session(engine) as session:

        # --- Skip if departments exist ---
        if session.exec(select(Department)).first():
            print("Sample data already populated")
            return

        # --- Departments ---
        cs_dept = Department(name="Computer Science", code="CS")
        sci_dept = Department(name="Science", code="SCI")
        lang_dept = Department(name="Languages", code="LANG")
        session.add_all([cs_dept, sci_dept, lang_dept])
        session.commit()
        for d in [cs_dept, sci_dept, lang_dept]:
            session.refresh(d)

        # --- Admin user ---
        admin = User(
            first_name="Root",
            last_name="Admin",
            email="root_admin@example.com",
            hashed_password=hash_password("password123"),
            role=Role.admin
        )
        session.add(admin)
        session.commit()

        # --- Teachers (one per department) ---
        teachers_data = [
            ("John",  "Doe",   "john@school.edu",  cs_dept),
            ("Jane",  "Smith", "jane@school.edu",  sci_dept),
            ("Alice", "Brown", "alice@school.edu", lang_dept),
        ]

        teacher_profiles = []
        for fn, ln, email, dept in teachers_data:
            user = User(
                first_name=fn,
                last_name=ln,
                email=email,
                hashed_password=hash_password("password123"),
                role=Role.teacher
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            teacher = Teacher(
                user_id=user.id,
                hire_date=date(2020, 1, 1),
                department_id=dept.id
            )
            session.add(teacher)
            session.commit()
            session.refresh(teacher)
            teacher_profiles.append((teacher, dept))

        # --- Courses ---
        cs_courses   = [
            Course(name="Math",    code="MATH101", grade=10, department_id=cs_dept.id),
            Course(name="Math",    code="MATH102", grade=11, department_id=cs_dept.id),
        ]
        sci_courses  = [
            Course(name="Physics", code="PHY101", grade=10, department_id=sci_dept.id),
            Course(name="Biology", code="BIO101", grade=11, department_id=sci_dept.id),
        ]
        lang_courses = [
            Course(name="English", code="ENG101", grade=10, department_id=lang_dept.id),
            Course(name="English", code="ENG102", grade=11, department_id=lang_dept.id),
        ]

        all_courses = cs_courses + sci_courses + lang_courses
        session.add_all(all_courses)
        session.commit()
        for c in all_courses:
            session.refresh(c)

        # Department → courses mapping
        dept_courses = {
            cs_dept.id:   cs_courses,
            sci_dept.id:  sci_courses,
            lang_dept.id: lang_courses,
        }

        # --- Sections (grades 10–11, A and B) ---
        sections = []
        for grade in [10, 11]:
            for sec_name in ["A", "B"]:
                sec = Section(grade=grade, name=sec_name, academic_year_start=2025)
                session.add(sec)
                session.commit()
                session.refresh(sec)
                sections.append(sec)

        # --- One Semester ---
        semester = Semester(
            number=1,
            academic_year_start=2025,
            academic_year_end=2026,
            status=SemesterStatus.current
        )
        session.add(semester)
        session.commit()
        session.refresh(semester)

        # --- Students (3 per section) ---
        students = []
        student_counter = 1
        for sec in sections:
            for _ in range(3):
                st = Student(
                    first_name=f"Student{student_counter}",
                    last_name="Test",
                    email=f"student{student_counter}@school.edu",
                    enrollment_date=date(2024, 9, 1),
                    section_id=sec.id
                )
                session.add(st)
                session.commit()
                session.refresh(st)
                students.append(st)
                student_counter += 1

        # --- Course Offerings (only match section grade to course grade) ---
        course_offerings = []
        for teacher, dept in teacher_profiles:
            for course in dept_courses.get(dept.id, []):
                for sec in sections:
                    if sec.grade == course.grade:
                        co = CourseOffering(
                            course_id=course.id,
                            section_id=sec.id,
                            semester_id=semester.id,
                            teacher_id=teacher.id
                        )
                        session.add(co)
                        session.commit()
                        session.refresh(co)
                        course_offerings.append(co)

        # --- Enrollments ---
        for st in students:
            for co in course_offerings:
                if co.section_id == st.section_id:
                    enrollment = Enrollment(
                        student_id=st.id,
                        course_offering_id=co.id,
                        enrollment_date=date(2025, 1, 10),
                        status="active"
                    )
                    session.add(enrollment)

        session.commit()
        print("Sample data populated successfully!")

if __name__ == "__main__":
    create_db_and_tables()
    populate_sample_data()
