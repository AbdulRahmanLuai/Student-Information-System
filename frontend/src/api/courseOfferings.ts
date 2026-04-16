import client from "./client";
import { CourseOffering } from "../types";


export const getAdminCourseOfferings = async (params: {
  semester_id?: number;
  teacher_id?: number;
  section_id?: number;
}): Promise<CourseOffering[]> => {
  const response = await client.get("/admin/course-offerings", { params });
  return response.data;
};

export const updateCourseOfferingTeacher = async (
  courseOfferingId: number,
  teacherId: number
): Promise<CourseOffering> => {
  const response = await client.put(`/admin/course-offerings/${courseOfferingId}`, {
    teacher_id: teacherId,
  });
  return response.data;
};


export const getCourseOfferingById = async (id: number): Promise<CourseOffering> => {
  const response = await client.get(`/admin/course-offerings/${id}`);
  return response.data;
};

export const getCourseOfferings = async (params: {
  semester_id?: number;
  teacher_id?: number;
  section_id?: number;
  department_id?: number;
  academic_year_start?: number;
  semester_number?: number;
  course_id?: number;
}): Promise<CourseOffering[]> => {
  const response = await client.get("/admin/course-offerings", { params });
  return response.data;
};