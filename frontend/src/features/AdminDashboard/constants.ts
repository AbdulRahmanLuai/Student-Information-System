export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const getNextLetter = (
  sections: { grade: number; name: string }[],
  grade: number
): string | null => {
  const existing = sections
    .filter((s) => s.grade === grade)
    .map((s) => s.name.toUpperCase());
  for (const letter of LETTERS) {
    if (!existing.includes(letter)) return letter;
  }
  return null;
};