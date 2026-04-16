import client from "../client";
import { CourseOffering, Enrollment } from "../../types";


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

export const getCourseOfferingById = async (id: number): Promise<CourseOffering> => {
  const res = await client.get(`/course-offerings/${id}`);
  return res.data;
};