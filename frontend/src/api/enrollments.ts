import client from "./client";
import { Enrollment } from "../types";

export const getEnrollmentsForCourseOffering = async (courseOfferingId: number): Promise<Enrollment[]> => {
  const response = await client.get(`/admin/course-offerings/${courseOfferingId}/enrollments`);
  return response.data;
};