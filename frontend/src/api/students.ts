import client from "./client";
import { Student, Enrollment } from "../types";

export const changeStudentSection = async (studentId: number, sectionId: number) => {
  const res = await client.patch(`/admin/students/${studentId}/section`, {
    section_id: sectionId,
  });
  return res.data;
};

export const searchStudents = async (query: string): Promise<Student[]> => {
  const isNumeric = /^\d+$/.test(query);
  const params = isNumeric ? { id_prefix: query } : { query };
  const res = await client.get("admin/students/search", { params });
  return res.data;
};

export const getStudentById = async (id: number): Promise<Student> => {
  const response = await client.get(`/admin/students/${id}`);
  return response.data;
};

export const createStudent = async (studentData: {
  first_name: string;
  last_name: string;
  email: string;
  enrollment_date?: string | null;
  section_id: number;
}): Promise<Student> => {
  const response = await client.post("/admin/students", studentData);
  return response.data;
};

export const getStudentEnrollments = async (
  studentId: number,
  academicYearStart?: number,
  semesterNumber?: number
): Promise<Enrollment[]> => {
  const params: any = {};
  if (academicYearStart !== undefined) params.academic_year_start = academicYearStart;
  if (semesterNumber !== undefined) params.semester_number = semesterNumber;
  const response = await client.get(`/admin/students/${studentId}/enrollments`, { params });
  return response.data;
};