import { db, doc, getDoc, updateDoc } from "./firebase.js";

// 전역 변수 선언
let currentProjectId = null;
let currentEpisodeId = null;

// HTML 태그와 엔티티를 일반 텍스트로 변환하는 함수
function htmlToPlainText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText;
}

// 에피소드 데이터 로드 함수
async function loadEpisodeContent() {
    try {
        const docRef = doc(db, "episode", currentEpisodeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 프로젝트 ID 확인
            if (data.project_id !== currentProjectId) {
                console.error('프로젝트 ID가 일치하지 않습니다.');
                window.location.href = 'main.html';
                return;
            }

            // 제목 업데이트
            const displayNumber = data.episode_number || '?';
            document.querySelector('.main-title').textContent = 
                `${displayNumber}화. ${data.title}`;
            
            // 에디터 내용 설정
            if (data.content) {
                const editor = tinymce.get('wysiwyg-editor');
                if (editor) {
                    editor.setContent(data.content);
                    
                    // 미리보기 업데이트
                    const contentPreview = document.querySelector('.content-preview');
                    if (contentPreview) {
                        contentPreview.textContent = htmlToPlainText(data.content);
                        contentPreview.style.display = 'block';
                    }

                    // 글자 수 카운터 업데이트
                    const counterDiv = document.querySelector('.word-counter');
                    if (counterDiv) {
                        const charCount = htmlToPlainText(data.content).length;
                        counterDiv.textContent = `글자 수: ${charCount.toLocaleString()}`;
                    }
                }
            }
        } else {
            console.log("에피소드를 찾을 수 없습니다!");
            alert("에피소드 데이터를 불러올 수 없습니다.");
            window.location.href = 'main.html';
        }
    } catch (error) {
        console.error("에피소드 데이터 로드 중 오류:", error);
        alert("에피소�� 데이터를 불러오는 중 문제가 발생했습니다.");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // localStorage에서 프로젝트 ID 복원
    currentProjectId = localStorage.getItem('currentProjectId');
    
    // URL에서 에피소드 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    currentEpisodeId = urlParams.get('episode-id');
    
    // 프로젝트나 에피소드 ID가 없으면 메인 페이지로 리다이렉트
    if (!currentProjectId || !currentEpisodeId) {
        console.error('프로젝트 ID 또는 에피소드 ID가 없습니다.');
        window.location.href = 'main.html';
        return;
    }

    // 결과 보기 버튼 이벤트 리스너
    document.getElementById('resultButton')?.addEventListener('click', function() {
        if (currentEpisodeId) {
            location.href = `result.html?episode-id=${currentEpisodeId}`;
        }
    });

    // 토글 버튼 이벤트 리스너
    const toggleTitles = document.querySelectorAll('.toggle-title');
    toggleTitles.forEach(title => {
        title.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const isExpanded = content.style.display === 'block';
            content.style.display = isExpanded ? 'none' : 'block';
            
            const arrow = this.textContent.trim().charAt(0);
            this.textContent = this.textContent.replace(
                arrow,
                isExpanded ? '▼' : '▶'
            );
        });
    });

    // TinyMCE 초기화 전에 이전 인스턴스 제거
    tinymce.remove('#wysiwyg-editor');
    
    // TinyMCE 초기화
    tinymce.init({
        selector: "#wysiwyg-editor",
        menubar: false,
        plugins: "lists",
        toolbar: "formatselect fontsize fontfamily lineheight | " +
                "bold italic underline strikethrough | forecolor backcolor | " +
                "alignleft aligncenter alignright | bullist numlist | hr | " +
                "specialeffects | removeformat | spellcheck",
        
        fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt',
        font_family_formats: '굴림=gulim; 돋움=dotum; 바탕=batang; 궁서=gungsuh; 나눔고딕=NanumGothic; 나눔명조=NanumMyeongjo',
        lineheight_formats: '1 1.2 1.4 1.6 1.8 2.0',
        browser_spellcheck: true,
        content_langs: [{ title: '한국어', code: 'ko' }],
        language: 'ko_KR',
        language_url: 'https://cdn.jsdelivr.net/npm/tinymce-i18n@23.1.23/langs/ko_KR.js',
        height: 500,
        placeholder: '내용을 입력하세요...',
        content_css: 'tinymce.css',

        setup: function(editor) {
            console.log('TinyMCE 에디터 설정 중...'); // 디버깅용
            
            editor.on('init', async function() {
                console.log('TinyMCE 에디터 초기화 완료'); // 디버깅용
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
                        project_id: currentProjectId, // 프로젝트 ID도 함께 저장
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

            // 맞춤법 검사 버튼 추가
            editor.ui.registry.addButton('spellcheck', {
                text: '맞춤법 검사',
                onAction: function() {
                    const content = editor.getContent({format: 'text'});
                    checkSpelling(content, editor);
                }
            });
        }
    }).then(function(editors) {
        console.log('TinyMCE 초기화 성공'); // 디버깅용
    }).catch(function(error) {
        console.error('TinyMCE 초기화 실패:', error); // 디버깅용
    });
});

async function checkSpelling(text, editor) {
    try {
        const response = await fetch('https://speller.cs.pusan.ac.kr/results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `text1=${encodeURIComponent(text)}`
        });

        if (!response.ok) throw new Error('맞춤법 검사 실패');
        
        const data = await response.json();
        
        if (data.errInfo) {
            data.errInfo.forEach(error => {
                const originalText = error.orgStr;
                const suggestion = error.candWord;
                const errorType = error.help;
                
                const content = editor.getContent();
                const markedContent = content.replace(
                    originalText,
                    `<span class="spelling-error" title="${errorType}\n추천: ${suggestion}" style="border-bottom: 2px wavy red;">${originalText}</span>`
                );
                editor.setContent(markedContent);
            });

            editor.notificationManager.open({
                text: `맞춤법 검사 완료: ${data.errInfo.length}개의 오류 발견`,
                type: 'info'
            });
        } else {
            editor.notificationManager.open({
                text: '맞춤법 오류가 없습니다.',
                type: 'success'
            });
        }
    } catch (error) {
        console.error('맞춤법 검사 오류:', error);
        editor.notificationManager.open({
            text: '맞춤법 검사 중 오류가 발생했습니다.',
            type: 'error'
        });
    }
}