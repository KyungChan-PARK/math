<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 이에대해 더 자세히 조사해라. 인간독자를 위한 포맷팅이나 설명 필요없다. 나의 ai agent가 읽고 작업할 것이다.

@page {
size: A4 portrait;
margin: 10mm 15mm;
}

@media print {
html, body {
width: 210mm;
height: 297mm;
margin: 0;
padding: 0;
box-sizing: border-box;
}
.page {
width: 100%;
height: 100%;
overflow: hidden;
page-break-after: always;
position: relative;
}
.no-break {
page-break-inside: avoid;
}
}

/* units: cm, mm, in, pt 모두 지원 */
/* 가로(A4 landscape) 설정: size: A4 landscape; */

JavaScript:

function splitIntoPages(containerSelector, pageClass = 'page') {
const container = document.querySelector(containerSelector);
const pageHeight = 297 * 96 / 25.4; // px: 96dpi 기준, 1in=25.4mm
let currentPage = createPage();
let yOffset = 0;
Array.from(container.children).forEach(el => {
currentPage.appendChild(el);
if (currentPage.scrollHeight > pageHeight) {
currentPage.removeChild(el);
currentPage.parentNode.insertBefore(currentPage, container);
currentPage = createPage();
currentPage.appendChild(el);
yOffset = currentPage.scrollHeight;
}
});
container.appendChild(currentPage);

function createPage() {
const p = document.createElement('div');
p.className = pageClass;
return p;
}
}

/* 호출 예시 */
document.addEventListener('DOMContentLoaded', () => {
splitIntoPages('\#content');
});

고급 제어:

- CSS 속성: page-break-before, page-break-after, page-break-inside
- 브라우저 호환성: Chrome, Firefox, Edge는 @page size 지원. IE는 제한적.
- JS로 동적 페이지 분할 시, DPI(픽셀밀도)와 margin 고려.
- 페이징 라이브러리: paged.js (https://www.pagedjs.org/), print.css.io

라이브러리 예: paged.js 사용

<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>

<style>
  @page {
    size: A4;
    margin: 20mm;
  }
  .chapter {
    break-after: page;
  }
</style>
HTML 구조:

<div class="pagedjs_pages">
  <section class="chapter">...</section>
  <section class="chapter">...</section>
</div>
출력 절차:

1. CSS @page, @media print로 기본 용지 설정
2. print preview 에서 margin, scale 확인
3. JS로 콘텐츠 자동 분할 or paged.js로 고급 인쇄 레이아웃 생성
4. window.print() 호출 to trigger print dialog
