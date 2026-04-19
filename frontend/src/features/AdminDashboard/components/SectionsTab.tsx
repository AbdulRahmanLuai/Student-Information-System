import { Section } from "../../../types";
import SectionsList from "./SectionsList";
import { getSectionsByYear } from "../../../api/sections";
import { useState, useEffect } from "react";

interface SectionsTabProps {
  academicYears: number[];
  currentAcademicYear: number | null;
  onAddSection: () => void;
  onDeleteSection: (section: Section) => void;
}

const SectionsTab = ({
  academicYears,
  currentAcademicYear,
  onAddSection,
  onDeleteSection,
}: SectionsTabProps) => {
  const [sectionYear, setSectionYear] = useState<number>(currentAcademicYear || new Date().getFullYear());
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [sectionEditMode, setSectionEditMode] = useState(false);

  useEffect(() => {
    setLoadingSections(true);
    getSectionsByYear(sectionYear)
      .then(setFilteredSections)
      .catch(console.error)
      .finally(() => setLoadingSections(false));
  }, [sectionYear]);

  useEffect(() => {
    if (academicYears.length && !sectionYear) {
      setSectionYear(Math.max(...academicYears));
    }
  }, [academicYears]);

  // Determine if a section is the last of its grade within the current filtered list
  const isLastSectionOfGradeInYear = (section: Section) => {
    const sectionsInSameGrade = filteredSections.filter(s => s.grade === section.grade);
    const isLast = sectionsInSameGrade.length <= 1;
    console.log(`Section ${section.grade}${section.name}: sectionsInSameGrade = ${sectionsInSameGrade.length}, isLast = ${isLast}`);
    return isLast;
    };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Academic Year:</label>
          <select
            value={sectionYear}
            onChange={(e) => setSectionYear(Number(e.target.value))}
            className="border rounded px-3 py-1"
          >
            {academicYears.map((y) => (
              <option key={y} value={y}>{y} - {y + 1}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {currentAcademicYear !== null && sectionYear === currentAcademicYear && (
            <button
              onClick={onAddSection}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Section
            </button>
          )}
          {currentAcademicYear !== null && sectionYear === currentAcademicYear && (
            !sectionEditMode ? (
              <button
                onClick={() => setSectionEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={() => setSectionEditMode(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )
          )}
        </div>
      </div>
      {loadingSections ? (
        <p>Loading sections...</p>
      ) : (
        <SectionsList
          sections={filteredSections}
          onDeleteSection={onDeleteSection}
          isLastSectionOfGrade={isLastSectionOfGradeInYear}
          currentAcademicYear={currentAcademicYear}
          editMode={sectionEditMode}
        />
      )}
    </div>
  );
};

export default SectionsTab;