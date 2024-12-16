document.addEventListener("DOMContentLoaded", () => {
  // 토글 메뉴 클릭 이벤트
  document.querySelectorAll('.toggle-title').forEach(title => {
    title.addEventListener('click', () => {
      const content = title.nextElementSibling;
      if (content && content.classList.contains('toggle-content')) {
        // 현재 표시 상태 확인
        const isHidden = content.style.display === 'none';
        
        // 토글 상태 변경
        content.style.display = isHidden ? 'block' : 'none';
        
        // 화살표 방향 변경
        title.textContent = title.textContent.replace(
          isHidden ? '▶' : '▼',
          isHidden ? '▼' : '▶'
        );
      }
    });
  });

  // 공유하기 버튼 클릭 이벤트
  document.getElementById('generateShareLink')?.addEventListener('click', () => {
    // ... 기존 공유하기 코드 ...
  });
});
