import client from "./client";
import { CourseOffering, Enrollment } from "../types";


export const getMyCourseOfferings = async (semesterId?: number): Promise<CourseOffering[]> => {
  const response = await client.get("/course-offerings", {
    params: semesterId ? { semester_id: semesterId } : {},
  });
  return response.data;
};

export const getEnrollments = async (courseOfferingId: number): Promise<Enrollment[]> => {
  const response = await client.get(
    `/course-offerings/${courseOfferingId}/enrollments`
  );
  return response.data;
};

export const enterMark = async (enrollmentId: number, mark: number): Promise<Enrollment> => {
  const response = await client.put(
    `/course-offerings/${enrollmentId}`,
    { mark }
  );
  return response.data;
};

export const commitMarks = async (courseOfferingId: number): Promise<Enrollment[]> => {
  const response = await client.post(
    `/course-offerings/${courseOfferingId}/enrollments/commit`
  );
  return response.data;
};

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

export const getCourseOfferingsForTeacher = async (
  teacherId: number
): Promise<CourseOffering[]> => {
  const response = await client.get("/admin/course-offerings", {
    params: { teacher_id: teacherId },
  });
  return response.data;
};


export const getCourseOfferingById = async (id: number): Promise<CourseOffering> => {
  const response = await client.get(`/admin/course-offerings/${id}`);
  return response.data;
};