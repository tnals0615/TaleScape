tinymce.init({
  selector: "#wysiwyg-editor",
  menubar: false,
  plugins: "lists link image preview",
  toolbar:
    "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image preview",
  height: 500,
  
  setup: function(editor) {
    const counterDiv = document.querySelector('.word-counter');
    const saveBtn = document.querySelector('.save-btn');
    const contentPreview = document.querySelector('.content-preview');
    
    // 문자 수 업데이트 함수
    function updateWordCount() {
      const content = editor.getContent({format: 'text'});
      const charCount = content.length;
      counterDiv.textContent = `글자 수: ${charCount.toLocaleString()}`;
      
      // 3초 동안 진하게 표시 후 원래대로
      counterDiv.style.opacity = '1';
      setTimeout(() => {
        counterDiv.style.opacity = '0.7';
      }, 3000);
    }

    // 내용 변경 시 카운트 업데이트
    editor.on('keyup', updateWordCount);
    editor.on('change', updateWordCount);

    // Ctrl + Enter : 큰따옴표 추가
    editor.on('keydown', function(e) {
      if (e.ctrlKey && !e.shiftKey && e.keyCode === 13) {
        e.preventDefault();
        const selection = editor.selection;
        const content = selection.getContent();
        
        if (content) {
          // 선택된 텍스트가 있는 경우
          editor.insertContent('<br>"' + content + '"');
        } else {
          // 빈 따옴표 추가하고 커서를 안쪽에 위치
          editor.insertContent('<br>""');
          const range = selection.getRng();
          const node = range.startContainer;
          const offset = range.startOffset;
          range.setStart(node, offset - 1);
          range.setEnd(node, offset - 1);
          selection.setRng(range);
        }
      }

      // Ctrl + Shift + Enter : 작은따옴표 추가
      if (e.ctrlKey && e.shiftKey && e.keyCode === 13) {
        e.preventDefault();
        const selection = editor.selection;
        const content = selection.getContent();
        
        if (content) {
          // 선택된 텍스트가 있는 경우
          editor.insertContent('<br>\'' + content + '\'');
        } else {
          // 빈 따옴표 추가하고 커서를 안쪽에 위치
          editor.insertContent('<br>\'\'');
          const range = selection.getRng();
          const node = range.startContainer;
          const offset = range.startOffset;
          range.setStart(node, offset - 1);
          range.setEnd(node, offset - 1);
          selection.setRng(range);
        }
      }
    });

    // 내용 변경 시 저장 버튼 표시
    editor.on('change', function() {
      saveBtn.style.display = 'block';
    });

    // 저장 버튼 클릭 이벤트
    saveBtn.addEventListener('click', function() {
      const content = editor.getContent({format: 'text'});
      contentPreview.textContent = content;
      contentPreview.style.display = 'block';
      saveBtn.style.display = 'none';
      // TODO: 데이터베이스 저장 로직 추가
    });
  }
});

// 모든 토글 기능 통합
document.addEventListener('DOMContentLoaded', function() {
  const toggleTitles = document.querySelectorAll('.toggle-title');
  
  toggleTitles.forEach(title => {
    title.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const isExpanded = content.style.display === 'block';
      
      // 토글 동작
      content.style.display = isExpanded ? 'none' : 'block';
      
      // 화살표 방향 변경
      const arrow = this.textContent.trim().charAt(0);
      this.textContent = this.textContent.replace(
        arrow,
        isExpanded ? '▼' : '▶'
      );
    });
  });
});
