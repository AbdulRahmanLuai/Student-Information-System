import client from "./client";
import { SetupSectionPreview, SetupSectionDetail } from "../types";
import { CourseAssignment } from "../types";

import { EnrollmentStatus } from "../types";

export const getEnrollmentStatus = async (): Promise<EnrollmentStatus> => {
  const response = await client.get("/admin/academic-year/enrollment-status");
  return response.data;
};

export const startAcademicYear = async (): Promise<void> => {
  await client.post("/admin/academic-year/start");
};

export const resetAcademicYear = async (): Promise<void> => {
  await client.delete("/admin/academic-year/reset");
};

export const getSetupSections = async (): Promise<SetupSectionPreview[]> => {
  const response = await client.get("/admin/academic-year/sections");
  return response.data;
};

export const getSectionDetail = async (sectionId: number): Promise<SetupSectionDetail> => {
  const response = await client.get(`/admin/academic-year/sections/${sectionId}`);
  return response.data;
};

export const updateSection = async (
  sectionId: number,
  courses: CourseAssignment[]
): Promise<void> => {
  await client.put(`/admin/academic-year/sections/${sectionId}`, { courses });
};

export const commitAcademicYear = async (): Promise<void> => {
  await client.post("/admin/academic-year/commit");
};

export const enrollAll = async () => {
  const response = await client.post("/admin/academic-year/enroll-all");
  return response.data; 
};