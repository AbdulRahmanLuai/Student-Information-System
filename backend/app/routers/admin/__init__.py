"""
TODO: Handle graduating/leaving students
TODO: Handle changes in curriculum between years
"""

from fastapi import APIRouter
from . import users, teachers, departments, courses, sections, students, semesters, course_offerings, enrollments

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