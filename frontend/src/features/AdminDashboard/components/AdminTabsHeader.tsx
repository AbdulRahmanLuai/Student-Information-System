interface AdminTabsHeaderProps {
  activeTab: "students" | "teachers" | "sections" | "departments" | "course-offerings";
  onTabChange: (tab: "students" | "teachers" | "sections" | "departments" | "course-offerings") => void;
}

const AdminTabsHeader = ({ activeTab, onTabChange }: AdminTabsHeaderProps) => {
  const tabs = ["students", "teachers", "sections", "departments", "course-offerings"] as const;
  return (
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
  );
};

export default AdminTabsHeader;