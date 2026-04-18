import React from "react";
import { theme } from "@/styles/design-system";

export default function Footer() {
  return (
    <footer
      className="border-t py-8"
      style={{
        backgroundColor: theme.colors.background.primary,
        borderColor: theme.colors.border.primary,
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* 학원 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="ET" className="h-6 w-6" />
              <h3
                className="font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                ET영어전문학원
              </h3>
            </div>
            <div className="space-y-2">
              <p
                className="text-sm"
                style={{ color: theme.colors.text.tertiary }}
              >
                📚 매일 학습으로 실력 UP!
              </p>
              <p
                className="text-sm"
                style={{ color: theme.colors.text.tertiary }}
              >
                📍 광주 광산구 첨단중앙로 110 303호
              </p>
              <p
                className="text-sm"
                style={{ color: theme.colors.text.tertiary }}
              >
                📞 062-972-2708
              </p>
              <p
                className="text-sm"
                style={{ color: theme.colors.text.tertiary }}
              >
                📧 info@etacademy.com
              </p>
            </div>
          </div>

          {/* 링크 */}
          <div>
            <h3
              className="font-semibold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              연락처 및 링크
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.instagram.com/et_englishacademy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  📷 인스타그램: @et_englishacademy
                </a>
              </li>
              <li>
                <a
                  href="https://blog.naver.com/eteng365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  📝 블로그: https://blog.naver.com/eteng365
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@etacademy.com"
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  📧 이메일: info@etacademy.com
                </a>
              </li>
              <li>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  📋 등록번호: 제 4179호
                </p>
              </li>
              <li>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  📚 교습과목: 외국어(영어)
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* 저작권 */}
        <div
          className="border-t pt-8 text-center"
          style={{ borderColor: theme.colors.border.primary }}
        >
          <p
            className="text-sm"
            style={{ color: theme.colors.text.tertiary }}
          >
            © 2026 ET영어전문학원. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
