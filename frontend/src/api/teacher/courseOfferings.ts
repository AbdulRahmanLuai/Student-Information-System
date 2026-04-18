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

export const uploadMarks = async (courseOfferingId: number, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await client.post(`/course-offerings/${courseOfferingId}/upload-marks`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // { message, data: [{student_id, final_mark}] }
};

export const enterMarks = async (courseOfferingId: number, updates: { enrollment_id: number; final_mark: number | null }[]): Promise<void> => {
  await client.post(`/course-offerings/${courseOfferingId}/marks`, updates);
};