import React, { useState } from "react";
import { Card } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { theme } from "@/styles/design-system";

export default function AdminSettings() {
  const [academyInfo, setAcademyInfo] = useState({
    name: "ET영어전문학원",
    address: "광주 광산구 첨단중앙로 110 303호",
    addressDetail: "광주 광산구 월계동 888-10",
    zipCode: "62276",
    phone: "062-972-2708",
    email: "info@etacademy.com",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempInfo, setTempInfo] = useState(() => academyInfo);

  const handleEdit = () => {
    setIsEditing(true);
    setTempInfo(academyInfo);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    setAcademyInfo(tempInfo);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setTempInfo({ ...tempInfo, [field]: value });
  };

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: theme.colors.background.primary }}>
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>
          학원 정보 설정
        </h1>
        <p style={{ color: theme.colors.text.secondary }}>
          학원의 기본 정보를 관리합니다.
        </p>
      </div>

      {/* 학원 정보 카드 */}
      <Card
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary,
        }}
        className="p-6 border"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
            📚 기본 정보
          </h2>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={handleEdit}
              className="text-sm"
            >
              수정
            </Button>
          )}
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  학원명
                </label>
                <p className="mt-1 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                  {academyInfo.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  우편번호
                </label>
                <p className="mt-1 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                  {academyInfo.zipCode}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                도로명 주소
              </label>
              <p className="mt-1 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                {academyInfo.address}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                지번 주소
              </label>
              <p className="mt-1 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                {academyInfo.addressDetail}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  전화번호
                </label>
                <p className="mt-1 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                  {academyInfo.phone}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  이메일
                </label>
                <p className="mt-1 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                  {academyInfo.email}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  학원명
                </label>
                <input
                  type="text"
                  value={tempInfo.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  우편번호
                </label>
                <input
                  type="text"
                  value={tempInfo.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                도로명 주소
              </label>
              <input
                type="text"
                value={tempInfo.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                지번 주소
              </label>
              <input
                type="text"
                value={tempInfo.addressDetail}
                onChange={(e) => handleChange("addressDetail", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  전화번호
                </label>
                <input
                  type="text"
                  value={tempInfo.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                  이메일
                </label>
                <input
                  type="email"
                  value={tempInfo.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={handleCancel}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
              >
                저장
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 학원 소개 */}
      <Card
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary,
        }}
        className="p-6 border"
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
          🎨 학원 소개
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
              슬로건
            </label>
            <p className="mt-1 text-base" style={{ color: theme.colors.text.primary }}>
              📚 매일 학습으로 실력 UP!
            </p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
              설립
            </label>
            <p className="mt-1 text-base" style={{ color: theme.colors.text.primary }}>
              2008년 설립 이후 첫단, 첨단, 양산동 지역 대표 명품 입시 영어전문학원
            </p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
              교습 대상
            </label>
            <p className="mt-1 text-base" style={{ color: theme.colors.text.primary }}>
              초등학생부터 고등학생까지 모든 학년
            </p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
              교습 과정
            </label>
            <p className="mt-1 text-base" style={{ color: theme.colors.text.primary }}>
              파닉스, 정독, 수능 등 다양한 과정
            </p>
          </div>
        </div>
      </Card>

      {/* 연락 및 링크 */}
      <Card
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary,
        }}
        className="p-6 border"
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
          📧 연락 및 링크
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span style={{ color: theme.colors.text.secondary }}>📞 전화</span>
            <span style={{ color: theme.colors.text.primary }}>062-972-2708</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: theme.colors.text.secondary }}>📷 인스타그램</span>
            <a
              href="https://www.instagram.com/et_englishacademy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.colors.accent.primary }}
              className="hover:opacity-80"
            >
              @et_englishacademy
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: theme.colors.text.secondary }}>📝 블로그</span>
            <a
              href="https://blog.naver.com/eteng365"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.colors.accent.primary }}
              className="hover:opacity-80"
            >
              https://blog.naver.com/eteng365
            </a>
          </div>
        </div>
      </Card>

      {/* 등록 정보 */}
      <Card
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary,
        }}
        className="p-6 border"
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
          📋 등록 정보
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span style={{ color: theme.colors.text.secondary }}>등록(신고)번호</span>
            <span style={{ color: theme.colors.text.primary }}>제 4179호</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: theme.colors.text.secondary }}>학원명칭</span>
            <span style={{ color: theme.colors.text.primary }}>E.T영어전문어학원</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: theme.colors.text.secondary }}>교습과목</span>
            <span style={{ color: theme.colors.text.primary }}>외국어(영어)</span>
          </div>
        </div>
      </Card>

      {/* 로고 정보 */}
      <Card
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary,
        }}
        className="p-6 border"
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
          🎨 로고
        </h2>
        <div className="flex items-center gap-6">
          <img
                      src="/logo.png"
            alt="학원 로고"
            className="h-24 w-24 rounded-lg"
            style={{
              backgroundColor: theme.colors.background.primary,
              padding: "8px",
            }}
          />
          <div>
            <p style={{ color: theme.colors.text.secondary }}>
              현재 학원 로고입니다.
            </p>
            <p className="text-sm mt-2" style={{ color: theme.colors.text.secondary }}>
              로고 변경은 관리자에게 문의하세요.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
