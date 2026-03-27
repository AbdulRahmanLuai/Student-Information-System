from datetime import date
from sqlmodel import SQLModel, Session, select
from app.database import engine
from app.models import (
    Department, Teacher, Course, Section,
    Semester, Student, CourseOffering, Enrollment, User, Role
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
        math_dept = Department(name="Mathematics", code="MATH")
        physics_dept = Department(name="Physics", code="PHYS")
        session.add_all([cs_dept, math_dept, physics_dept])
        session.commit()
        for d in [cs_dept, math_dept, physics_dept]:
            session.refresh(d)

        # --- Admin user ---
        admin_user_data = {
            "first_name": "Root",
            "last_name": "Admin",
            "email": "root_admin@example.com",
            "password": "password123",
            "role": Role.admin
        }
        existing_admin = session.exec(
            select(User).where(User.email == admin_user_data["email"])
        ).first()
        if not existing_admin:
            admin = User(
                first_name=admin_user_data["first_name"],
                last_name=admin_user_data["last_name"],
                email=admin_user_data["email"],
                hashed_password=hash_password(admin_user_data["password"]),
                role=admin_user_data["role"]
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
            print(f"Admin created: {admin.email}")

        # --- Teacher users + profiles ---
        teachers_to_create = [
            {"first_name": "John", "last_name": "Doe", "email": "john@school.edu", "password": "password123", "role": Role.teacher, "hire_date": date(2020,8,1), "department": cs_dept},
            {"first_name": "Jane", "last_name": "Smith", "email": "jane@school.edu", "password": "password123", "role": Role.teacher, "hire_date": date(2019,9,1), "department": math_dept},
            {"first_name": "Alice", "last_name": "Brown", "email": "alice@school.edu", "password": "password123", "role": Role.teacher, "hire_date": date(2021,1,15), "department": physics_dept},
        ]

        teacher_profiles = []
        for t in teachers_to_create:
            existing = session.exec(select(User).where(User.email == t["email"])).first()
            if existing:
                print(f"User {t['email']} already exists")
                continue

            # Create User
            user = User(
                first_name=t["first_name"],
                last_name=t["last_name"],
                email=t["email"],
                hashed_password=hash_password(t["password"]),
                role=t["role"]
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            # Create Teacher profile
            teacher_profile = Teacher(
                user_id=user.id,
                hire_date=t["hire_date"],
                department_id=t["department"].id
            )
            session.add(teacher_profile)
            session.commit()
            session.refresh(teacher_profile)
            teacher_profiles.append(teacher_profile)

            print(f"Teacher {user.email} created with profile")

        # --- Courses ---
        courses = [
            Course(name="Intro to Programming", code="CS101", department_id=cs_dept.id),
            Course(name="Data Structures", code="CS102", department_id=cs_dept.id),
            Course(name="Calculus I", code="MATH101", department_id=math_dept.id),
            Course(name="Linear Algebra", code="MATH102", department_id=math_dept.id),
            Course(name="Physics I", code="PHYS101", department_id=physics_dept.id),
        ]
        session.add_all(courses)
        session.commit()
        for c in courses:
            session.refresh(c)

        # --- Sections ---
        sections = [
            Section(grade=9, name="A", academic_year_start=2025),
            Section(grade = 9, name="B", academic_year_start=2025),
            Section(grade = 10, name="A", academic_year_start=2025),
        ]
        session.add_all(sections)
        session.commit()
        for s in sections:
            session.refresh(s)

        # --- Semesters ---
        semesters = [
            Semester(number=1, academic_year_start=2025, academic_year_end=2026),
            Semester(number=2, academic_year_start=2025, academic_year_end=2026),
        ]
        session.add_all(semesters)
        session.commit()
        for sem in semesters:
            session.refresh(sem)

        # --- Students ---
        students = [
            Student(first_name="Alice", last_name="Johnson", email="alice.j@student.edu", enrollment_date=date(2024,9,1), section_id=sections[0].id),
            Student(first_name="Bob", last_name="Williams", email="bob.w@student.edu", enrollment_date=date(2024,9,1), section_id=sections[0].id),
            Student(first_name="Charlie", last_name="Davis", email="charlie.d@student.edu", enrollment_date=date(2024,9,1), section_id=sections[1].id),
        ]
        session.add_all(students)
        session.commit()
        for st in students:
            session.refresh(st)

        # --- Course Offerings ---
        course_offerings = [
            CourseOffering(course_id=courses[0].id, section_id=sections[0].id, semester_id=semesters[0].id, teacher_id=teacher_profiles[0].id),
            CourseOffering(course_id=courses[2].id, section_id=sections[0].id, semester_id=semesters[0].id, teacher_id=teacher_profiles[1].id),
            CourseOffering(course_id=courses[4].id, section_id=sections[1].id, semester_id=semesters[0].id, teacher_id=teacher_profiles[2].id),
        ]
        session.add_all(course_offerings)
        session.commit()
        for co in course_offerings:
            session.refresh(co)

        # --- Enrollments ---
        enrollments = [
            Enrollment(student_id=students[0].id, course_offering_id=course_offerings[0].id, enrollment_date=date(2025,1,10), status="active"),
            Enrollment(student_id=students[0].id, course_offering_id=course_offerings[1].id, enrollment_date=date(2025,1,10), status="active"),
            Enrollment(student_id=students[1].id, course_offering_id=course_offerings[0].id, enrollment_date=date(2025,1,10), status="active"),
            Enrollment(student_id=students[2].id, course_offering_id=course_offerings[2].id, enrollment_date=date(2025,1,10), status="active"),
        ]
        session.add_all(enrollments)
        session.commit()

        print("Sample data populated successfully!")


if __name__ == "__main__":
    create_db_and_tables()
    populate_sample_data()
