tinymce.init({
  selector: "#wysiwyg-editor",
  menubar: false,
  plugins: "lists link image preview",
  toolbar:
    "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image preview",
  height: 500,
  
  // 단축키 설정 수정
  setup: function(editor) {
    editor.on('keydown', function(e) {
      // Ctrl + Enter 감지
      if (e.ctrlKey && e.keyCode === 13) {
        e.preventDefault(); // 기본 동작 방지
        
        const selection = editor.selection;
        const content = selection.getContent();
        const range = selection.getRng();
        
        if (content) {
          // 선택된 텍스트가 있는 경우
          selection.setContent(`"${content}"`);
        } else {
          // 선택된 텍스트가 없는 경우
          const quotedText = '""';
          selection.setContent(quotedText);
          
          // 커서를 따옴표 사이로 이동
          const node = range.startContainer;
          const offset = range.startOffset;
          range.setStart(node, offset + 1);
          range.setEnd(node, offset + 1);
          selection.setRng(range);
        }
      }
    });
  }
});

// 토글 기능 수정
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
