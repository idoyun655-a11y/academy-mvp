import schools from "./data/gwangju-schools.json";

export type SchoolDirectoryLevel = "elementary" | "middle" | "high";

export type SchoolDirectoryEntry = {
  schoolLevel: SchoolDirectoryLevel;
  schoolName: string;
  homepage?: string | null;
  schoolType?: string | null;
  zipCode?: string | null;
  address?: string | null;
  academicOfficePhone?: string | null;
  adminOfficePhone?: string | null;
  faxNumber?: string | null;
};

const SCHOOL_DIRECTORY = (schools as SchoolDirectoryEntry[]).map((entry) => ({
  ...entry,
  homepage: entry.homepage ?? null,
  schoolType: entry.schoolType ?? null,
  zipCode: entry.zipCode ?? null,
  address: entry.address ?? null,
  academicOfficePhone: entry.academicOfficePhone ?? null,
  adminOfficePhone: entry.adminOfficePhone ?? null,
  faxNumber: entry.faxNumber ?? null,
}));

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

export function searchSchoolDirectory(query: string, schoolLevel?: SchoolDirectoryLevel | null) {
  const keyword = normalizeKeyword(query);
  const filtered = SCHOOL_DIRECTORY.filter((entry) => {
    if (schoolLevel && entry.schoolLevel !== schoolLevel) return false;
    if (!keyword) return true;

    const haystacks = [
      entry.schoolName,
      entry.address,
      entry.schoolType,
      entry.homepage,
      entry.academicOfficePhone,
      entry.adminOfficePhone,
    ];

    return haystacks
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .some((value) => value.toLowerCase().includes(keyword));
  });

  return filtered
    .sort((left, right) => left.schoolName.localeCompare(right.schoolName, "ko"))
    .slice(0, 60)
    .map((entry) => ({
      schoolLevel: entry.schoolLevel,
      schoolName: entry.schoolName,
      address: entry.address,
      schoolType: entry.schoolType,
      academicOfficePhone: entry.academicOfficePhone,
    }));
}

export function getSchoolDirectoryByName(
  schoolName: string,
  schoolLevel?: SchoolDirectoryLevel | null,
) {
  const target = normalizeKeyword(schoolName);
  if (!target) return null;

  return (
    SCHOOL_DIRECTORY.find((entry) => {
      if (schoolLevel && entry.schoolLevel !== schoolLevel) return false;
      return normalizeKeyword(entry.schoolName) === target;
    }) ?? null
  );
}

export function listSchoolDirectoryStats() {
  return SCHOOL_DIRECTORY.reduce(
    (acc, entry) => {
      acc.total += 1;
      acc[entry.schoolLevel] += 1;
      return acc;
    },
    {
      total: 0,
      elementary: 0,
      middle: 0,
      high: 0,
    },
  );
}
