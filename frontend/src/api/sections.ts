import client from "./client";
import { Section } from "../types";



export const getSections = async (academicYearStart: number): Promise<Section[]> => {
  const response = await client.get("/admin/sections", {
    params: { academic_year_start: academicYearStart },
  });
  return response.data;
};

export const createSection = async (payload: {
  grade: number;
  name: string;
  academic_year_start: number;
}): Promise<Section> => {
  const response = await client.post("/admin/sections", payload);
  return response.data;
};

export const deleteSection = async (sectionId: number): Promise<void> => {
  await client.delete(`/admin/sections/${sectionId}`);
};

export const getSectionById = async (sectionId: number): Promise<Section> => {
  const response = await client.get(`/admin/sections/${sectionId}`);
  return response.data;
};