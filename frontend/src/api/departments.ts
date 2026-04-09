import client from "./client";
import { Department, Teacher, CourseOffering } from "../types";

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

export const getCourseOfferingsByDepartment = async (departmentId: number): Promise<CourseOffering[]> => {
  const response = await client.get("/admin/course-offerings", {
    params: { department_id: departmentId },
  });
  return response.data;
};

export const getDepartmentById = async (id: number): Promise<Department> => {
  const response = await client.get(`/admin/departments/${id}`);
  return response.data;
};