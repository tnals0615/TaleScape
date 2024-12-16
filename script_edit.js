import { db, doc, getDoc, updateDoc } from "./firebase.js";

let currentEpisodeId = null;

// HTML 태그와 엔티티를 일반 텍스트로 변환하는 함수
function htmlToPlainText(html) {
    // 임시 div 엘리먼트 생성
    const temp = document.createElement('div');
    // HTML 문자열을 div에 설정
    temp.innerHTML = html;
    // HTML 엔티티를 디코드하고 텍스트만 추출
    return temp.textContent || temp.innerText;
}

// 에피소드 데이터 로드 함수
async function loadEpisodeContent() {
    try {
        const docRef = doc(db, "episode", currentEpisodeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 제목 설정
            document.querySelector('.main-title').textContent = 
                `${data.episode_number}화. ${data.title}`;
            
            // 에디터와 본문 미리보기에 내용 설정
            if (data.content) {
                const editor = tinymce.get('wysiwyg-editor');
                if (editor) {
                    editor.setContent(data.content);
                    
                    // 본문 미리보기 설정
                    const contentPreview = document.querySelector('.content-preview');
                    contentPreview.textContent = htmlToPlainText(data.content);
                    contentPreview.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error("에피소드 데이터 로드 중 오류:", error);
    }
}

tinymce.init({
    selector: "#wysiwyg-editor",
    menubar: false,
    plugins: "lists",
    toolbar: "formatselect fontsize fontfamily lineheight | " +
            "bold italic underline strikethrough | forecolor backcolor | " +
            "alignleft aligncenter alignright | bullist numlist | hr | " +
            "specialeffects | removeformat | spellcheck",
    
    fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt',
    
    font_family_formats: '굴림=gulim; 돋움=dotum; 바탕=batang; 궁서=gungsuh; ' + 
                        '나눔고딕=NanumGothic; 나눔명조=NanumMyeongjo',
    
    lineheight_formats: '1 1.2 1.4 1.6 1.8 2.0',
    
    browser_spellcheck: true,
    
    content_langs: [
        { title: '한국어', code: 'ko' }
    ],
    language: 'ko_KR',
    language_url: 'https://cdn.jsdelivr.net/npm/tinymce-i18n@23.1.23/langs/ko_KR.js',
    
    height: 500,
    placeholder: '내용을 입력하세요...',
    
    content_css: 'styles_edit.css',
    
    init_instance_callback: function(editor) {
        const editorIframe = editor.iframeElement;
        const editorBody = editorIframe.contentDocument.body;
        
        // contentEditable 요소에 직접 속성 설정
        editorBody.setAttribute('spellcheck', 'true');
        editorBody.setAttribute('lang', 'ko');
        
        // contentEditable 내부의 모든 요소에도 속성 설정
        const allElements = editorBody.getElementsByTagName('*');
        for (let element of allElements) {
            element.setAttribute('spellcheck', 'true');
            element.setAttribute('lang', 'ko');
        }
    },
    
    setup: function(editor) {
        editor.on('init', async function() {
            // 에디터 초기화 완료 후 데이터 로드
            const urlParams = new URLSearchParams(window.location.search);
            currentEpisodeId = urlParams.get('episode-id');
            
            if (currentEpisodeId) {
                await loadEpisodeContent();
            }
        });

        const counterDiv = document.querySelector('.word-counter');
        const saveBtn = document.querySelector('.save-btn');
        const contentPreview = document.querySelector('.content-preview');
        
        function updateWordCount() {
            const content = editor.getContent({format: 'text'});
            const charCount = content.length;
            counterDiv.textContent = `글자 수: ${charCount.toLocaleString()}`;
            
            counterDiv.style.opacity = '1';
            setTimeout(() => {
                counterDiv.style.opacity = '0.7';
            }, 3000);
        }

        editor.on('keyup', updateWordCount);
        editor.on('change', updateWordCount);

        editor.on('keydown', function(e) {
            if (e.ctrlKey && !e.shiftKey && e.keyCode === 13) {
                e.preventDefault();
                const selection = editor.selection;
                const content = selection.getContent();
                
                if (content) {
                    editor.insertContent('<br>"' + content + '"');
                } else {
                    editor.insertContent('<br>""');
                    const range = selection.getRng();
                    const node = range.startContainer;
                    const offset = range.startOffset;
                    range.setStart(node, offset - 1);
                    range.setEnd(node, offset - 1);
                    selection.setRng(range);
                }
            }

            if (e.ctrlKey && e.shiftKey && e.keyCode === 13) {
                e.preventDefault();
                const selection = editor.selection;
                const content = selection.getContent();
                
                if (content) {
                    editor.insertContent('<br>\'' + content + '\'');
                } else {
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

        editor.on('change', function() {
            saveBtn.style.display = 'block';
        });

        saveBtn.addEventListener('click', async function() {
            try {
                const content = editor.getContent();
                const docRef = doc(db, "episode", currentEpisodeId);
                
                await updateDoc(docRef, {
                    content: content,
                    lastModified: new Date()
                });

                // 저장 후 본문 미리보기 업데이트
                const contentPreview = document.querySelector('.content-preview');
                contentPreview.textContent = htmlToPlainText(content);
                contentPreview.style.display = 'block';

                console.log("내용이 저장되었습니다.");
                saveBtn.style.display = 'none';
            } catch (error) {
                console.error("저장 중 오류:", error);
                alert("저장하는 중 문제가 발생했습니다.");
            }
        });

        editor.ui.registry.addButton('spellcheck', {
            text: '맞춤법 검사',
            onAction: function() {
                const content = editor.getContent({format: 'text'});
                
                // 다음 맞춤법 검사기 열기
                const spellCheckWindow = window.open(
                    'https://alldic.daum.net/grammar_checker.do',
                    'spell_check',
                    'width=800,height=600'
                );

                // 사용자에게 안내
                editor.notificationManager.open({
                    text: '다음 맞춤법 검사기가 새 창에서 열립니다.\n텍스트를 복사하여 검사해주세요. (최대 10,000자)',
                    type: 'info',
                    timeout: 5000
                });

                // 클립보드에 텍스트 복사
                try {
                    navigator.clipboard.writeText(content).then(() => {
                        editor.notificationManager.open({
                            text: '텍스트가 클립보드에 복사되었습니다.',
                            type: 'success',
                            timeout: 3000
                        });
                    });
                } catch (error) {
                    console.error('클립보드 복사 실패:', error);
                }
            }
        });

        function applyEffect(editor, effectClass, effectStyle) {
            const content = editor.selection.getContent({format: 'html'});
            if (content) {
                const wrappedContent = `<span class="${effectClass}" 
                    style="display: inline-block; ${effectStyle}; 
                    font-weight: inherit; 
                    font-style: inherit; 
                    text-decoration: inherit; 
                    color: inherit; 
                    background-color: inherit;">${content}</span>`;
                editor.selection.setContent(wrappedContent);
            }
        }

        editor.ui.registry.addMenuButton('specialeffects', {
            text: '특수 효과',
            fetch: function(callback) {
                const items = [
                    {
                        type: 'menuitem',
                        text: '흔들림 효과',
                        onAction: function() {
                            applyEffect(editor, 'shake-effect', 'animation: shake 0.1s infinite');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '글리치 효과',
                        onAction: function() {
                            applyEffect(editor, 'glitch-effect', 'animation: glitch 2s infinite');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '무지개 효과',
                        onAction: function() {
                            applyEffect(editor, 'rainbow-effect', 'animation: rainbow 2s linear infinite');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '페이드인',
                        onAction: function() {
                            applyEffect(editor, 'fadein-effect', 'animation: fadeIn 2s');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '페이드아웃',
                        onAction: function() {
                            applyEffect(editor, 'fadeout-effect', 'animation: fadeOut 2s forwards');
                        }
                    },
                    {
                        type: 'menuitem',
                        text: '타이핑 효과',
                        onAction: function() {
                            const content = editor.selection.getContent({format: 'html'});
                            if (content) {
                                applyEffect(editor, 'typing-effect', 
                                    `width: fit-content; animation: typing 2s steps(${content.length}), blink .5s step-end infinite alternate`);
                            }
                        }
                    }
                ];
                callback(items);
            }
        });
    }
});

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
});
