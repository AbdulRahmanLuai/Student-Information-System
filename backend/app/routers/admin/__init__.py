"""
TODO: Handle graduating/leaving students
TODO: Handle changes in curriculum between years
TODO: Fix transactionality of semester and academic year transition
TODO: add minimum 1 section for least grade when section promotion happens
"""

from fastapi import APIRouter
from . import users, teachers, departments, courses, sections, students, semesters, course_offerings, enrollments, academic_year

router = APIRouter(prefix='/admin', tags=["admin"])

router.include_router(users.router)
router.include_router(teachers.router)
router.include_router(departments.router)
router.include_router(courses.router)
router.include_router(sections.router)
router.include_router(students.router)
router.include_router(semesters.router)
router.include_router(course_offerings.router)
router.include_router(enrollments.router)
router.include_router(academic_year.router)