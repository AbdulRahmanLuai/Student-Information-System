import client from "./client";

export const changeStudentSection = async (
  studentId: number,
  sectionId: number
) => {
  const res = await client.patch(`/admin/students/${studentId}/section`, {
    section_id: sectionId,
  });
  return res.data;
};