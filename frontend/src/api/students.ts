import client from "./client";
import { Student } from "../types";

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