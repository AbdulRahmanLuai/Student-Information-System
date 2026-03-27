import client from "./client";

export const getMyCourseOfferings = async (semesterId?: number) => {
  const response = await client.get("/course-offerings", {
    params: semesterId ? { semester_id: semesterId } : {},
  });

  return response.data;
};

export const getEnrollments = async (courseOfferingId: number) => {
  const response = await client.get(
    `/course-offerings/${courseOfferingId}/enrollments`
  );

  return response.data;
};

export const enterMark = async (enrollmentId: number, mark: number) => {
  const response = await client.put(
    `/course-offerings/${enrollmentId}`,
    { mark }
  );

  return response.data;
};

export const commitMarks = async (courseOfferingId: number) => {
  const response = await client.post(
    `/course-offerings/${courseOfferingId}/enrollments/commit`
  );

  return response.data;
};