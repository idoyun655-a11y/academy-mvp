/**
 * Apple-inspired Premium Dark Mode Design System
 * 
 * 이 파일은 전체 애플리케이션의 디자인 토큰을 정의합니다.
 * 모든 UI 컴포넌트는 이 토큰을 기준으로 구성됩니다.
 */

// ============================================================================
// 색상 시스템 (Color Tokens)
// ============================================================================

export const colors = {
  // 배경 색상
  background: {
    primary: '#000000',      // 가장 어두운 검정
    secondary: '#0a0a0a',    // 약간 밝은 검정
    tertiary: '#1a1a1a',     // 카드/섹션 배경
    overlay: 'rgba(0, 0, 0, 0.8)',
  },

  // 텍스트 색상
  text: {
    primary: '#ffffff',      // 기본 텍스트
    secondary: '#e5e5ea',    // 보조 텍스트
    tertiary: '#8e8e93',     // 약한 텍스트
    disabled: '#545458',     // 비활성 텍스트
  },

  // 테두리 색상
  border: {
    primary: '#424245',      // 주요 테두리
    secondary: '#2c2c30',    // 보조 테두리
    light: '#1a1a1e',        // 약한 테두리
  },

  // 상태 색상
  status: {
    success: '#34c759',      // 출석, 완납
    warning: '#ff9500',      // 지각, 대기
    error: '#ff3b30',        // 결석, 미납
    info: '#00b4d8',         // 정보
  },

  // 강조 색상
  accent: {
    primary: '#0084ff',      // 주요 강조색 (파란색)
    secondary: '#5ac8fa',    // 보조 강조색 (밝은 파란색)
    tertiary: '#30b0c0',     // 3차 강조색 (청록색)
  },

  // 그레이스케일
  gray: {
    50: '#f9f9f9',
    100: '#f3f3f3',
    200: '#e8e8e8',
    300: '#d3d3d3',
    400: '#a8a8a8',
    500: '#8e8e93',
    600: '#636366',
    700: '#48484a',
    800: '#2c2c30',
    900: '#1a1a1e',
    950: '#0a0a0a',
  },
};

// ============================================================================
// 타이포그래피 시스템 (Typography Scale)
// ============================================================================

export const typography = {
  // 제목
  heading: {
    h1: {
      fontSize: '32px',
      fontWeight: 700,
      lineHeight: '40px',
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: '28px',
      fontWeight: 700,
      lineHeight: '36px',
      letterSpacing: '-0.3px',
    },
    h3: {
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: '32px',
      letterSpacing: '-0.2px',
    },
    h4: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: '28px',
      letterSpacing: '0px',
    },
    h5: {
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: '26px',
      letterSpacing: '0px',
    },
  },

  // 본문
  body: {
    lg: {
      fontSize: '17px',
      fontWeight: 400,
      lineHeight: '26px',
      letterSpacing: '-0.2px',
    },
    md: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
      letterSpacing: '-0.2px',
    },
    sm: {
      fontSize: '15px',
      fontWeight: 400,
      lineHeight: '22px',
      letterSpacing: '-0.1px',
    },
    xs: {
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: '20px',
      letterSpacing: '0px',
    },
  },

  // 캡션
  caption: {
    lg: {
      fontSize: '15px',
      fontWeight: 500,
      lineHeight: '22px',
      letterSpacing: '-0.1px',
    },
    md: {
      fontSize: '13px',
      fontWeight: 500,
      lineHeight: '20px',
      letterSpacing: '0px',
    },
    sm: {
      fontSize: '12px',
      fontWeight: 500,
      lineHeight: '18px',
      letterSpacing: '0.3px',
    },
  },

  // 모노스페이스 (코드)
  mono: {
    md: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '22px',
      fontFamily: 'Menlo, Monaco, Courier New, monospace',
    },
  },
};

// ============================================================================
// 간격 시스템 (Spacing Scale)
// ============================================================================

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
  '6xl': '56px',
  '7xl': '64px',
};

// ============================================================================
// 테두리 반경 시스템 (Border Radius)
// ============================================================================

export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
};

// ============================================================================
// 그림자 시스템 (Shadow System)
// ============================================================================

export const shadows = {
  // 미니멀 그림자
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
  md: '0 4px 8px 0 rgba(0, 0, 0, 0.5)',
  lg: '0 8px 16px 0 rgba(0, 0, 0, 0.6)',
  xl: '0 12px 24px 0 rgba(0, 0, 0, 0.7)',
  '2xl': '0 16px 32px 0 rgba(0, 0, 0, 0.8)',

  // 엘리베이션 그림자 (카드, 모달 등)
  elevation: {
    sm: '0 2px 8px 0 rgba(0, 0, 0, 0.4)',
    md: '0 4px 12px 0 rgba(0, 0, 0, 0.5)',
    lg: '0 8px 24px 0 rgba(0, 0, 0, 0.6)',
  },

  // 인터랙티브 그림자
  interactive: {
    hover: '0 4px 12px 0 rgba(0, 0, 0, 0.5)',
    active: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
    focus: '0 0 0 3px rgba(0, 132, 255, 0.2)',
  },
};

// ============================================================================
// 트랜지션 시스템 (Transitions)
// ============================================================================

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slowest: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================================================
// 컴포넌트 크기 (Component Sizes)
// ============================================================================

export const sizes = {
  // 버튼 크기
  button: {
    xs: {
      height: '28px',
      padding: '0 12px',
      fontSize: '13px',
    },
    sm: {
      height: '32px',
      padding: '0 16px',
      fontSize: '14px',
    },
    md: {
      height: '40px',
      padding: '0 20px',
      fontSize: '15px',
    },
    lg: {
      height: '48px',
      padding: '0 24px',
      fontSize: '16px',
    },
  },

  // 입력 필드 크기
  input: {
    sm: {
      height: '32px',
      padding: '0 12px',
      fontSize: '14px',
    },
    md: {
      height: '40px',
      padding: '0 16px',
      fontSize: '15px',
    },
    lg: {
      height: '48px',
      padding: '0 20px',
      fontSize: '16px',
    },
  },

  // 아이콘 크기
  icon: {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '32px',
    xl: '40px',
  },
};

// ============================================================================
// 반응형 중단점 (Breakpoints)
// ============================================================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// 글래스모피즘 (Glassmorphism)
// ============================================================================

export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  strong: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
  },
};

// ============================================================================
// 상태 스타일 (State Styles)
// ============================================================================

export const states = {
  hover: {
    opacity: 0.8,
    transform: 'translateY(-2px)',
    transition: transitions.fast,
  },
  active: {
    opacity: 0.9,
    transform: 'translateY(0px)',
    transition: transitions.fast,
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  focus: {
    outline: 'none',
    boxShadow: `0 0 0 3px ${colors.accent.primary}33`,
  },
};

// ============================================================================
// 테마 설정 (Theme Configuration)
// ============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  sizes,
  breakpoints,
  glassmorphism,
  states,
};

export default theme;
