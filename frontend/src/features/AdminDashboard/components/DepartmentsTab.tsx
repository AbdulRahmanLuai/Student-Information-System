import { Department } from "../../../types";
import DepartmentsList from "./DepartmentsList";

interface DepartmentsTabProps {
  departments: Department[];
}

const DepartmentsTab = ({ departments }: DepartmentsTabProps) => {
  return <DepartmentsList departments={departments} />;
};

export default DepartmentsTab;