# 🎨 디자인 시스템 - Apple-Inspired Premium Dark Mode

학원 관리 시스템의 통일된 디자인 언어를 정의합니다.

## 📐 색상 시스템

### 기본 팔레트 (Dark Mode)

```css
/* 배경 */
--bg-primary: #0a0a0a      /* 메인 배경 */
--bg-secondary: #1a1a1a    /* 카드, 패널 배경 */
--bg-tertiary: #2a2a2a     /* 호버, 활성 배경 */

/* 텍스트 */
--text-primary: #ffffff    /* 주요 텍스트 */
--text-secondary: #a0a0a0  /* 보조 텍스트 */
--text-tertiary: #707070   /* 약한 텍스트 */

/* 테두리 */
--border-primary: #333333  /* 주요 테두리 */
--border-secondary: #2a2a2a /* 약한 테두리 */

/* 상태 색상 */
--success: #34c759         /* 완납, 출석 */
--warning: #ff9500         /* 지각, 대기 */
--danger: #ff3b30          /* 미납, 결석 */
--info: #00b4d8            /* 정보 */

/* 강조 색상 */
--accent-primary: #0084ff  /* 주요 액션 */
--accent-secondary: #5ac8fa /* 보조 액션 */
```

### 색상 사용 규칙

| 용도 | 색상 | 예시 |
|------|------|------|
| 완납/출석 | `--success` | 초록 배지 |
| 미납/결석 | `--danger` | 빨강 배지 |
| 지각/대기 | `--warning` | 주황 배지 |
| 정보/안내 | `--info` | 파랑 배지 |
| 주요 버튼 | `--accent-primary` | 로그인, 저장 |
| 보조 버튼 | `--accent-secondary` | 취소, 삭제 |

## 🔤 타이포그래피

### 폰트 스택

```css
/* 기본 폰트 */
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
               'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
               sans-serif;

/* 모노스페이스 (코드) */
--font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
```

### 타이포그래피 스케일

| 용도 | 크기 | 굵기 | 라인높이 | 예시 |
|------|------|------|---------|------|
| Display | 32px | 700 | 1.2 | 페이지 제목 |
| Heading 1 | 28px | 600 | 1.3 | 섹션 제목 |
| Heading 2 | 24px | 600 | 1.3 | 서브 섹션 |
| Heading 3 | 20px | 600 | 1.4 | 카드 제목 |
| Body Large | 16px | 500 | 1.5 | 주요 텍스트 |
| Body | 14px | 400 | 1.5 | 일반 텍스트 |
| Body Small | 12px | 400 | 1.5 | 보조 텍스트 |
| Caption | 11px | 400 | 1.4 | 매우 작은 텍스트 |

## 🎯 간격 시스템

```css
/* 기본 간격 (8px 배수) */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px

/* 사용 규칙 */
- 패딩: md(16px) 이상
- 마진: md(16px) 이상
- 컴포넌트 간격: lg(24px)
- 섹션 간격: xl(32px) 이상
```

## 🔘 컴포넌트 스타일

### Button

```css
/* Primary Button */
.btn-primary {
  background: var(--accent-primary);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #0066cc;
  box-shadow: 0 4px 12px rgba(0, 132, 255, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid var(--border-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}

/* Danger Button */
.btn-danger {
  background: var(--danger);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #e63028;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}
```

### Card

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.card-elevated {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
```

### Input

```css
.input {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  font-family: var(--font-family);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(0, 132, 255, 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

### Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-success {
  background: rgba(52, 199, 89, 0.15);
  color: var(--success);
}

.badge-danger {
  background: rgba(255, 59, 48, 0.15);
  color: var(--danger);
}

.badge-warning {
  background: rgba(255, 149, 0, 0.15);
  color: var(--warning);
}

.badge-info {
  background: rgba(0, 180, 216, 0.15);
  color: var(--info);
}
```

### Table

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table thead {
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-secondary);
  color: var(--text-primary);
}

.table tbody tr:hover {
  background: var(--bg-tertiary);
}
```

### Modal

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Sidebar

```css
.sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
  padding: 24px 0;
  height: 100vh;
  overflow-y: auto;
  position: fixed;
  left: 0;
  top: 0;
}

.sidebar-item {
  padding: 12px 24px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: rgba(0, 132, 255, 0.15);
  color: var(--accent-primary);
  border-right: 3px solid var(--accent-primary);
}
```

### Topbar

```css
.topbar {
  height: 64px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: fixed;
  top: 0;
  right: 0;
  left: 280px;
  z-index: 100;
}

.topbar-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
```

## 🎬 인터랙션

### 호버 효과

```css
/* 카드 호버 */
.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

/* 버튼 호버 */
.btn:hover {
  background: /* 더 밝은 색 */;
  box-shadow: 0 4px 12px rgba(/* 색상 */, 0.3);
}

/* 행 호버 */
.table tbody tr:hover {
  background: var(--bg-tertiary);
}
```

### 전환 효과

```css
/* 기본 전환 */
transition: all 0.2s ease;

/* 배경 전환 */
transition: background 0.2s ease;

/* 변환 전환 */
transition: transform 0.2s ease;
```

### 애니메이션

```css
/* 페이드인 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 슬라이드업 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 펄스 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 📱 반응형 디자인

### 브레이크포인트

```css
/* 모바일 */
@media (max-width: 640px) {
  /* 사이드바 숨김 */
  .sidebar { display: none; }
  .topbar { left: 0; }
  
  /* 패딩 감소 */
  .card { padding: 12px; }
  
  /* 폰트 크기 감소 */
  body { font-size: 14px; }
}

/* 태블릿 */
@media (max-width: 1024px) {
  /* 사이드바 축소 */
  .sidebar { width: 200px; }
  
  /* 그리드 조정 */
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* 데스크톱 */
@media (min-width: 1025px) {
  /* 기본 스타일 */
}
```

## 🌙 다크모드 (기본)

현재 시스템은 다크모드를 기본으로 설계되었습니다.

### 라이트모드 확장 (향후)

```css
/* 라이트모드 변수 */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #eeeeee;
  --text-primary: #000000;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --border-primary: #e0e0e0;
  --border-secondary: #f0f0f0;
}
```

## 📏 레이아웃 그리드

### 12 컬럼 그리드

```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

.col-1 { grid-column: span 1; }
.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
.col-4 { grid-column: span 4; }
.col-6 { grid-column: span 6; }
.col-12 { grid-column: span 12; }
```

## 🎨 사용 예시

### 대시보드 카드

```html
<div class="card">
  <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">
    오늘 수업
  </h3>
  <p style="font-size: 32px; font-weight: 700; color: var(--accent-primary);">
    5
  </p>
  <p style="font-size: 14px; color: var(--text-secondary);">
    예정된 수업
  </p>
</div>
```

### 상태 배지

```html
<span class="badge badge-success">완납</span>
<span class="badge badge-danger">미납</span>
<span class="badge badge-warning">지각</span>
```

### 버튼 그룹

```html
<div style="display: flex; gap: 12px;">
  <button class="btn-primary">저장</button>
  <button class="btn-secondary">취소</button>
  <button class="btn-danger">삭제</button>
</div>
```

---

**마지막 업데이트**: 2024년 2월 12일

**버전**: 1.0.0
