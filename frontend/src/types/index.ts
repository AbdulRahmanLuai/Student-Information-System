export type Role = "admin" | "teacher";
export type CourseStatus = "active" | "inactive";
export type SemesterStatus = "upcoming" | "current" | "completed";
export type StudentStatus = "active" | "inactive" | "graduated";

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  grade: number;
  status: CourseStatus;
  department_id: number;
  department: Department;
}

export interface Section {
  id: number;
  grade: number;
  name: string;
  academic_year_start: number;
}

export interface Semester {
  id: number;
  academic_year_start: number;
  academic_year_end: number;
  number: number;
  status: SemesterStatus;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface Teacher {
  id: number;
  hire_date: string | null;
  department_id: number | null;
  user: User;
}

export interface StudentBasic {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  enrollment_date: string | null;
  section_id: number;
  status: StudentStatus;
}

export interface CourseOffering {
  id: number;
  course: Course;
  section: Section;
  semester: Semester;
  teacher: Teacher;
}

export interface Enrollment {
  id: number;
  final_mark: string | null;
  status: string;
  student: StudentBasic;
  course_offering: CourseOffering;
}

// Academic year setup
export interface SetupSectionPreview {
  id: number;
  section: string;
  student_count: number;
  is_configured: boolean;
}

export interface TeacherOption {
  id: number;
  name: string;
}

export interface SetupCourseItem {
  setup_course_id: number;
  course_id: number;
  course_name: string;
  teacher_id: number | null;
  teachers: TeacherOption[];
}

export interface SetupSectionDetail {
  id: number;
  section: string;
  courses: SetupCourseItem[];
}

export interface CourseAssignment {
    setup_course_id: number;
    teacher_id: number | null;
  }

export interface EnrollmentStatus {
  should_enroll: boolean;
}