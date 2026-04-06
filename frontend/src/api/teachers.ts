import client from "./client";
import { Teacher } from "../types";

export const getTeachers = async (departmentId?: number): Promise<Teacher[]> => {
  const response = await client.get("/admin/teachers", {
    params: departmentId ? { department_id: departmentId } : {},
  });
  return response.data;
};