"""
TODO: Handle graduating/leaving students
TODO: Handle changes in curriculum between years
TODO: Fix transactionality of semester and academic year transition
TODO: add minimum 1 section for least grade when section promotion happens
"""

from fastapi import APIRouter, Depends
from . import users, teachers, departments, courses, sections, students, semesters, course_offerings, enrollments, academic_year
from .dependencies import require_admin
router = APIRouter(prefix='/admin', dependencies=[Depends(require_admin)])

router.include_router(users.router, tags=["Admin: Users"])
router.include_router(teachers.router, tags=["Admin: Teachers"])
router.include_router(departments.router, tags=["Admin: Departments"])
router.include_router(courses.router, tags=["Admin: Courses"])
router.include_router(sections.router, tags=["Admin: Sections"])
router.include_router(students.router, tags=["Admin: Students"])
router.include_router(semesters.router, tags=["Admin: Semesters"])
router.include_router(course_offerings.router, tags=["Admin: Course Offerings"])
router.include_router(enrollments.router, tags=["Admin: Enrollments"])
router.include_router(academic_year.router, tags=["Admin: Academic Year"])