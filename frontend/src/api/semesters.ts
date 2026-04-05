import client from "./client";
import { Semester } from "../types";

export const getSemesters = async (): Promise<Semester[]> => {
  const response = await client.get("/admin/semesters");
  return response.data;
};

export const endSemester = async (): Promise<Semester> => {
  const response = await client.post("/admin/semesters/end");
  return response.data;
};

export const advanceSemester = async (): Promise<Semester> => {
  const response = await client.post("/admin/semesters/advance");
  return response.data;
};