import client from "./client";
import { Department, Teacher, Course } from "../types";

export const getDepartments = async (): Promise<Department[]> => {
  const response = await client.get("/admin/departments");
  return response.data;
};

export const getTeachersByDepartment = async (departmentId: number): Promise<Teacher[]> => {
  const response = await client.get("/admin/teachers", {
    params: { department_id: departmentId },
  });
  return response.data;
};


export const getDepartmentById = async (id: number): Promise<Department> => {
  const response = await client.get(`/admin/departments/${id}`);
  return response.data;
};

export const getDepartmentCourses = async (departmentId: number): Promise<Course[]> => {
  const response = await client.get(`/admin/departments/${departmentId}/courses`);
  return response.data;
};