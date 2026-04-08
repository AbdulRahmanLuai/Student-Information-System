import { Section } from "../../../types";
import SectionsList from "./SectionsList";

interface AdminPortalTabsProps {
  activeTab: "students" | "teachers" | "sections" | "departments";
  onTabChange: (tab: "students" | "teachers" | "sections" | "departments") => void;
  sections: Section[];
  onNavigateStudents: (id: number) => void;
  onNavigateCourseOfferings: (id: number) => void;
  onDeleteClick: (section: Section) => void;
  isLastSectionOfGrade: (section: Section) => boolean;
  onAddSection: () => void;
  currentSemesterExists: boolean;
}

const AdminPortalTabs = ({
  activeTab,
  onTabChange,
  sections,
  onNavigateStudents,
  onNavigateCourseOfferings,
  onDeleteClick,
  isLastSectionOfGrade,
  onAddSection,
  currentSemesterExists,
}: AdminPortalTabsProps) => {
  const tabs = ["students", "teachers", "sections", "departments"] as const;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Admin Portal</h2>

      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 font-medium rounded-t ${
              activeTab === tab
                ? "bg-gray-100 border-b-2 border-blue-600"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "sections" && currentSemesterExists && (
          <SectionsList
            sections={sections}
            onNavigateStudents={onNavigateStudents}
            onNavigateCourseOfferings={onNavigateCourseOfferings}
            onDeleteClick={onDeleteClick}
            isLastSectionOfGrade={isLastSectionOfGrade}
            onAddSection={onAddSection}
          />
        )}
        {activeTab === "students" && (
          <p className="text-gray-500">
            Student actions will be implemented here (search, leave, profile view).
          </p>
        )}
        {activeTab === "teachers" && (
          <p className="text-gray-500">
            Teacher actions will be implemented here (search, course offerings view).
          </p>
        )}
        {activeTab === "departments" && (
          <p className="text-gray-500">
            Departments management will be implemented here (list, add, edit, delete).
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminPortalTabs;