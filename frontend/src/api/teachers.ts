import client from "./client";
import { Teacher } from "../types";

export const getTeachers = async (departmentId?: number): Promise<Teacher[]> => {
  const response = await client.get("/admin/teachers", {
    params: departmentId ? { department_id: departmentId } : {},
  });
  return response.data;
};


export const searchTeachers = async (query: string): Promise<Teacher[]> => {
  const trimmed = query.trim();
  const isNumeric = /^\d+$/.test(trimmed);
  const params: any = isNumeric
    ? { id_prefix: trimmed }
    : { query: trimmed };
  
  const response = await client.get("/admin/teachers/search", { params });
  return response.data;
};

export const getTeacherById = async (id: number): Promise<Teacher> => {
  const response = await client.get(`/admin/teachers/${id}`);
  return response.data;
};

export const createTeacher = async (teacherData: {
  first_name: string;
  last_name: string;
  email: string;
  hire_date?: string | null;
  department_id: number;
}): Promise<{ plain_password: string }> => {
  const payload = {
    user: {
      ...teacherData,
      role: "teacher",
    },
  };
  const response = await client.post("/admin/users", payload);
  return response.data;
};