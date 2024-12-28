import { db, doc, getDoc, updateDoc } from "./firebase.js";

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
    
    content_css: ['tinymce.css', 'styles_edit.css'],
    
    setup: function(editor) {
        const saveBtn = document.querySelector('.save-btn');
        const effectToggleBtn = document.getElementById('effectToggleBtn');
        let stylesEnabled = true;
        
        // 스타일 토글 기능
        effectToggleBtn.addEventListener('click', function() {
            stylesEnabled = !stylesEnabled;
            
            if (stylesEnabled) {
                // 저장된 원본 스타일 복원
                const styledElements = editor.dom.select('*[data-original-style]');
                styledElements.forEach(element => {
                    const originalStyle = element.getAttribute('data-original-style');
                    const originalColor = element.getAttribute('data-original-color');
                    const originalClass = element.getAttribute('data-original-class');
                    
                    if (originalStyle) element.style.cssText = originalStyle;
                    if (originalColor) element.style.color = originalColor;
                    if (originalClass) element.className = originalClass;
                    
                    // 데이터 속성 제거
                    element.removeAttribute('data-original-style');
                    element.removeAttribute('data-original-color');
                    element.removeAttribute('data-original-class');
                });
                effectToggleBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i>';
                effectToggleBtn.title = '스타일 끄기';
                effectToggleBtn.classList.remove('effects-disabled');
            } else {
                // 현재 스타일 저장하고 제거
                const styledElements = editor.dom.select('*[style], *[class]');
                styledElements.forEach(element => {
                    // 현재 스타일 저장
                    if (element.style.cssText) {
                        element.setAttribute('data-original-style', element.style.cssText);
                    }
                    if (element.style.color) {
                        element.setAttribute('data-original-color', element.style.color);
                    }
                    if (element.className) {
                        element.setAttribute('data-original-class', element.className);
                    }
                    
                    // 모든 스타일 및 클래스 제거
                    element.style.cssText = '';
                    element.style.color = 'inherit';
                    element.className = '';
                });
                effectToggleBtn.innerHTML = '<i class="fas fa-wand-magic"></i>';
                effectToggleBtn.title = '스타일 켜기';
                effectToggleBtn.classList.add('effects-disabled');
            }
        });

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

        const effectToggleBtn = document.getElementById('effectToggleBtn');
        let stylesEnabled = true;
        
        // 스타일 토글 기능
        effectToggleBtn.addEventListener('click', function() {
            stylesEnabled = !stylesEnabled;
            
            if (stylesEnabled) {
                // 저장된 원본 스타일 복원
                const styledElements = editor.dom.select('*[data-original-style]');
                styledElements.forEach(element => {
                    const originalStyle = element.getAttribute('data-original-style');
                    const originalColor = element.getAttribute('data-original-color');
                    const originalClass = element.getAttribute('data-original-class');
                    
                    if (originalStyle) element.style.cssText = originalStyle;
                    if (originalColor) element.style.color = originalColor;
                    if (originalClass) element.className = originalClass;
                    
                    // 데이터 속성 제거
                    element.removeAttribute('data-original-style');
                    element.removeAttribute('data-original-color');
                    element.removeAttribute('data-original-class');
                });
                effectToggleBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i>';
                effectToggleBtn.title = '스타일 끄기';
                effectToggleBtn.classList.remove('effects-disabled');
            } else {
                // 현재 스타일 저장하고 제거
                const styledElements = editor.dom.select('*[style], *[class]');
                styledElements.forEach(element => {
                    // 현재 스타일 저장
                    if (element.style.cssText) {
                        element.setAttribute('data-original-style', element.style.cssText);
                    }
                    if (element.style.color) {
                        element.setAttribute('data-original-color', element.style.color);
                    }
                    if (element.className) {
                        element.setAttribute('data-original-class', element.className);
                    }
                    
                    // 모든 스타일 및 클래스 제거
                    element.style.cssText = '';
                    element.style.color = 'inherit';
                    element.className = '';
                });
                effectToggleBtn.innerHTML = '<i class="fas fa-wand-magic"></i>';
                effectToggleBtn.title = '스타일 켜기';
                effectToggleBtn.classList.add('effects-disabled');
            }
        });

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
            if (!currentEpisodeId) {
                alert("에피소드 ID를 찾을 수 없습니다.");
                return;
            }

            try {
                const content = editor.getContent();
                const docRef = doc(db, "episode", currentEpisodeId);
                
                await updateDoc(docRef, {
                    content: content,
                    lastModified: new Date()
                });

                console.log("내용이 저장되었습니다.");
                saveBtn.style.display = 'none';
            } catch (error) {
                console.error("내용 저장 중 오류:", error);
                alert("내용을 저장하는 중 문제가 발생했습니다.");
            }
        });

        editor.ui.registry.addButton('spellcheck', {
            text: '맞춤법 검사',
            onAction: function() {
                const content = editor.getContent({format: 'text'});
                checkSpelling(content, editor);
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