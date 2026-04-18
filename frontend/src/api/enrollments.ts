import client from "./client";
import { Enrollment, StudentBasic } from "../types";

export const getEnrollmentsForCourseOffering = async (courseOfferingId: number): Promise<Enrollment[]> => {
  const response = await client.get(`/admin/course-offerings/${courseOfferingId}/enrollments`);
  return response.data;
};

export const deleteEnrollment = async (enrollmentId: number): Promise<void> => {
  await client.delete(`/admin/enrollments/${enrollmentId}`);
};

export const addEnrollment = async (courseOfferingId: number, studentId: number): Promise<Enrollment> => {
  const response = await client.post(`/admin/course-offerings/${courseOfferingId}/enrollments`, { student_id: studentId });
  return response.data;
};

export const getAvailableStudentsForEnrollment = async (courseOfferingId: number): Promise<StudentBasic[]> => {
  const response = await client.get(`/admin/course-offerings/${courseOfferingId}/available-students`);
  return response.data;
};