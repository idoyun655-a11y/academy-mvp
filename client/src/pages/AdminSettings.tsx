import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Button from "@/components/common/Button";
import { Badge, Card, EmptyState } from "@/components/common/CommonComponents";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";

type SchoolLevel = "elementary" | "middle" | "high";

type AcademyInfo = {
  name: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  phone: string;
  email: string;
};

type SchoolDirectoryEntry = {
  schoolLevel: SchoolLevel;
  schoolName: string;
  homepage?: string | null;
  schoolType?: string | null;
  zipCode?: string | null;
  address?: string | null;
  academicOfficePhone?: string | null;
  adminOfficePhone?: string | null;
  faxNumber?: string | null;
  details?: Record<string, string>;
};

const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  elementary: "초등",
  middle: "중등",
  high: "고등",
};

const INITIAL_ACADEMY_INFO: AcademyInfo = {
  name: "ET영어전문학원",
  zipCode: "62276",
  address: "광주광역시 광산구 첨단중앙로 110",
  addressDetail: "303호",
  phone: "062-972-2708",
  email: "info@etacademy.com",
};

export default function AdminSettings() {
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo>(INITIAL_ACADEMY_INFO);
  const [draftInfo, setDraftInfo] = useState<AcademyInfo>(INITIAL_ACADEMY_INFO);
  const [isEditing, setIsEditing] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolLevelFilter, setSchoolLevelFilter] = useState<"" | SchoolLevel>("");
  const [selectedSchool, setSelectedSchool] = useState<{
    schoolName: string;
    schoolLevel?: SchoolLevel;
  } | null>(null);

  const schoolSearchQuery = trpc.schoolDirectory.search.useQuery(
    {
      query: schoolQuery,
      schoolLevel: schoolLevelFilter || undefined,
    },
    {
      staleTime: 20_000,
    },
  );

  const selectedSchoolQuery = trpc.schoolDirectory.getByName.useQuery(
    {
      schoolName: selectedSchool?.schoolName ?? "",
      schoolLevel: selectedSchool?.schoolLevel,
    },
    {
      enabled: Boolean(selectedSchool?.schoolName),
      staleTime: 20_000,
    },
  );

  const searchItems = useMemo(
    () => (schoolSearchQuery.data?.items ?? []) as SchoolDirectoryEntry[],
    [schoolSearchQuery.data],
  );
  const stats = schoolSearchQuery.data?.stats;
  const schoolDetail = (selectedSchoolQuery.data ?? null) as SchoolDirectoryEntry | null;

  const handleStartEdit = () => {
    setDraftInfo(academyInfo);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftInfo(academyInfo);
    setIsEditing(false);
  };

  const handleSave = () => {
    setAcademyInfo(draftInfo);
    setIsEditing(false);
  };

  const handleDraftChange = (field: keyof AcademyInfo, value: string) => {
    setDraftInfo((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="space-y-2">
          <Badge variant="info" size="sm">
            관리자 설정
          </Badge>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
              학원 정보와 학교 디렉터리
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.text.secondary }}>
              학원 기본 정보를 정리하고, 광주광역시 초중고 학교 정보를 검색해서 확인할 수
              있습니다.
            </p>
          </div>
        </section>

        <Card
          variant="elevated"
          padding="lg"
          className="border rounded-[28px]"
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border.primary,
          }}
        >
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                학원 기본 정보
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: theme.colors.text.secondary }}>
                관리자 페이지와 로그인 전 화면에 노출되는 기본 정보를 정리합니다.
              </p>
            </div>
            {!isEditing ? (
              <Button variant="secondary" onClick={handleStartEdit}>
                수정
              </Button>
            ) : null}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem label="학원명" value={academyInfo.name} />
              <InfoItem label="우편번호" value={academyInfo.zipCode} />
              <InfoItem label="도로명 주소" value={academyInfo.address} className="md:col-span-2" />
              <InfoItem
                label="상세 주소"
                value={academyInfo.addressDetail}
                className="md:col-span-2"
              />
              <InfoItem label="전화번호" value={academyInfo.phone} />
              <InfoItem label="이메일" value={academyInfo.email} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="학원명"
                value={draftInfo.name}
                onChange={(value) => handleDraftChange("name", value)}
              />
              <Field
                label="우편번호"
                value={draftInfo.zipCode}
                onChange={(value) => handleDraftChange("zipCode", value)}
              />
              <Field
                label="도로명 주소"
                value={draftInfo.address}
                onChange={(value) => handleDraftChange("address", value)}
                className="md:col-span-2"
              />
              <Field
                label="상세 주소"
                value={draftInfo.addressDetail}
                onChange={(value) => handleDraftChange("addressDetail", value)}
                className="md:col-span-2"
              />
              <Field
                label="전화번호"
                value={draftInfo.phone}
                onChange={(value) => handleDraftChange("phone", value)}
              />
              <Field
                label="이메일"
                value={draftInfo.email}
                onChange={(value) => handleDraftChange("email", value)}
              />

              <div className="flex flex-wrap gap-3 md:col-span-2 md:justify-end">
                <Button variant="secondary" onClick={handleCancelEdit}>
                  취소
                </Button>
                <Button onClick={handleSave}>저장</Button>
              </div>
            </div>
          )}
        </Card>

        <Card
          variant="elevated"
          padding="lg"
          className="border rounded-[28px]"
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border.primary,
          }}
        >
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                학교 정보 검색
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: theme.colors.text.secondary }}>
                광주광역시 초등학교, 중학교, 고등학교 목록에서 학교를 검색하고 세부 정보를
                확인할 수 있습니다.
              </p>
            </div>

            {stats ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="info" size="sm">
                  전체 {stats.total}개
                </Badge>
                <Badge variant="default" size="sm">
                  초등 {stats.elementary}
                </Badge>
                <Badge variant="default" size="sm">
                  중등 {stats.middle}
                </Badge>
                <Badge variant="default" size="sm">
                  고등 {stats.high}
                </Badge>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <input
              value={schoolQuery}
              onChange={(event) => setSchoolQuery(event.target.value)}
              placeholder="학교 이름 검색"
              className="rounded-2xl border px-4 py-3"
              style={{
                backgroundColor: theme.colors.background.primary,
                borderColor: theme.colors.border.primary,
                color: theme.colors.text.primary,
              }}
            />

            <select
              value={schoolLevelFilter}
              onChange={(event) =>
                setSchoolLevelFilter(event.target.value as "" | SchoolLevel)
              }
              className="rounded-2xl border px-4 py-3"
              style={{
                backgroundColor: theme.colors.background.primary,
                borderColor: theme.colors.border.primary,
                color: theme.colors.text.primary,
              }}
            >
              <option value="">전체 학교급</option>
              <option value="elementary">초등</option>
              <option value="middle">중등</option>
              <option value="high">고등</option>
            </select>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-3">
              {searchItems.length === 0 ? (
                <EmptyState
                  title="검색 결과가 없습니다."
                  description="학교 이름이나 학교급 조건을 바꿔서 다시 검색해 보세요."
                />
              ) : (
                searchItems.map((item) => {
                  const isSelected =
                    selectedSchool?.schoolName === item.schoolName &&
                    selectedSchool?.schoolLevel === item.schoolLevel;

                  return (
                    <button
                      key={`${item.schoolLevel}-${item.schoolName}`}
                      type="button"
                      onClick={() =>
                        setSelectedSchool({
                          schoolName: item.schoolName,
                          schoolLevel: item.schoolLevel,
                        })
                      }
                      className="w-full rounded-[24px] border px-4 py-4 text-left transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? `${theme.colors.accent.primary}12`
                          : theme.colors.background.primary,
                        borderColor: isSelected
                          ? theme.colors.accent.primary
                          : theme.colors.border.primary,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="truncate text-base font-semibold"
                            style={{ color: theme.colors.text.primary }}
                          >
                            {item.schoolName}
                          </p>
                          <p
                            className="mt-1 truncate text-sm"
                            style={{ color: theme.colors.text.secondary }}
                          >
                            {item.address || "주소 정보 없음"}
                          </p>
                        </div>
                        <Badge variant="default" size="sm">
                          {SCHOOL_LEVEL_LABELS[item.schoolLevel]}
                        </Badge>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <Card
              variant="default"
              padding="lg"
              className="min-h-[320px] rounded-[24px] border"
              style={{
                backgroundColor: theme.colors.background.primary,
                borderColor: theme.colors.border.primary,
              }}
            >
              {!selectedSchool ? (
                <EmptyState
                  title="학교를 선택해 주세요."
                  description="왼쪽 검색 결과에서 학교를 선택하면 상세 정보를 볼 수 있습니다."
                />
              ) : selectedSchoolQuery.isLoading ? (
                <div
                  className="flex h-full min-h-[240px] items-center justify-center text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  학교 정보를 불러오는 중입니다.
                </div>
              ) : !schoolDetail ? (
                <EmptyState
                  title="학교 상세 정보를 찾지 못했습니다."
                  description="다른 학교를 선택하거나 검색어를 다시 확인해 주세요."
                />
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3
                        className="text-xl font-semibold"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {schoolDetail.schoolName}
                      </h3>
                      <p
                        className="mt-1 text-sm"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {schoolDetail.schoolType || "학교 유형 정보 없음"}
                      </p>
                    </div>
                    <Badge variant="info" size="sm">
                      {SCHOOL_LEVEL_LABELS[schoolDetail.schoolLevel]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoItem label="주소" value={schoolDetail.address || "-"} className="md:col-span-2" />
                    <InfoItem label="학교 홈페이지" value={schoolDetail.homepage || "-"} />
                    <InfoItem label="우편번호" value={schoolDetail.zipCode || "-"} />
                    <InfoItem label="교무실 연락처" value={schoolDetail.academicOfficePhone || "-"} />
                    <InfoItem label="행정실 연락처" value={schoolDetail.adminOfficePhone || "-"} />
                    <InfoItem label="팩스" value={schoolDetail.faxNumber || "-"} />
                  </div>

                  {schoolDetail.details && Object.keys(schoolDetail.details).length > 0 ? (
                    <div className="space-y-3">
                      <h4
                        className="text-sm font-semibold"
                        style={{ color: theme.colors.text.primary }}
                      >
                        원본 데이터
                      </h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {Object.entries(schoolDetail.details).map(([key, value]) => (
                          <InfoItem key={key} label={key} value={value || "-"} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border px-4 py-4 ${className}`}
      style={{
        backgroundColor: theme.colors.background.primary,
        borderColor: theme.colors.border.primary,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.colors.text.tertiary }}>
        {label}
      </p>
      <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.text.primary }}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border px-4 py-3"
        style={{
          backgroundColor: theme.colors.background.primary,
          borderColor: theme.colors.border.primary,
          color: theme.colors.text.primary,
        }}
      />
    </label>
  );
}
