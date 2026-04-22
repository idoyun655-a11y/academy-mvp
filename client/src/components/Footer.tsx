import React from "react";
import { uiThemeVars } from "@/styles/runtime-theme";

export default function Footer() {
  return (
    <footer
      className="border-t py-6 sm:py-8"
      style={{
        backgroundColor: uiThemeVars.bgPrimary,
        borderColor: uiThemeVars.borderPrimary,
      }}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="mb-6 grid grid-cols-1 gap-6 md:mb-8 md:grid-cols-2 md:gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="ET" className="h-6 w-6 rounded-lg object-cover" />
              <h3 className="font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                ET영어전문학원
              </h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm" style={{ color: uiThemeVars.textTertiary }}>
                📴 매일 학습으로 실력 UP!
              </p>
              <p className="text-sm" style={{ color: uiThemeVars.textTertiary }}>
                📍 광주 광산구 첨단중앙로 110 303호
              </p>
              <p className="text-sm" style={{ color: uiThemeVars.textTertiary }}>
                📞 062-972-2708
              </p>
              <p className="text-sm" style={{ color: uiThemeVars.textTertiary }}>
                ✉ info@etacademy.com
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4" style={{ color: uiThemeVars.textPrimary }}>
              연락처 및 링크
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.instagram.com/et_englishacademy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words text-sm leading-6 transition-opacity hover:opacity-80"
                  style={{ color: uiThemeVars.textTertiary }}
                >
                  📷 인스타그램: @et_englishacademy
                </a>
              </li>
              <li>
                <a
                  href="https://blog.naver.com/eteng365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm leading-6 transition-opacity hover:opacity-80"
                  style={{ color: uiThemeVars.textTertiary }}
                >
                  📝 블로그: https://blog.naver.com/eteng365
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@etacademy.com"
                  className="break-all text-sm leading-6 transition-opacity hover:opacity-80"
                  style={{ color: uiThemeVars.textTertiary }}
                >
                  ✉ 이메일: info@etacademy.com
                </a>
              </li>
              <li>
                <p className="text-sm" style={{ color: uiThemeVars.textTertiary }}>
                  📥 등록번호: 제4179호
                </p>
              </li>
              <li>
                <p className="text-sm" style={{ color: uiThemeVars.textTertiary }}>
                  📴 교습과목: 보습(중등부 영어)
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 text-center sm:pt-8" style={{ borderColor: uiThemeVars.borderPrimary }}>
          <p className="text-sm" style={{ color: uiThemeVars.textTertiary }}>
            ⓒ 2026 ET영어전문학원. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
