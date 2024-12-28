import { db, doc, getDoc, updateDoc } from "./firebase.js";
import { modalUtils } from "./utils.js";

window.currentEpisodeId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeId = urlParams.get('episode-id');
    const episodeNumber = urlParams.get('episode-number');
    
    if (episodeId) {
        window.currentEpisodeId = episodeId;
        try {
            const docRef = doc(db, "episode", episodeId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                const displayNumber = episodeNumber || data.episode_number || '?';
                document.querySelector('.main-title').textContent = 
                    `${displayNumber}화. ${data.title}`;
                
                // TinyMCE가 준비될 때까지 기다림
                if (data.content) {
                    const waitForTinyMCE = setInterval(() => {
                        const editor = tinymce.get('wysiwyg-editor');
                        if (editor) {
                            editor.setContent(data.content);
                            clearInterval(waitForTinyMCE);
                        }
                    }, 100);
                }
            } else {
                console.log("에피소드를 찾을 수 없습니다!");
                alert("에피소드 데이터를 불러올 수 없습니다.");
            }
        } catch (error) {
            console.error("에피소드 데이터 로드 중 오류:", error);
            alert("에피소드 데이터를 불러오는 중 문제가 발생했습니다.");
        }
    }

    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            if (!window.currentEpisodeId) {
                alert("에피소드 ID가 없습니다.");
                return;
            }

            try {
                const content = tinymce.get('wysiwyg-editor').getContent();
                
                // episode 컬렉션에 내용 저장
                const docRef = doc(db, "episode", window.currentEpisodeId);
                await updateDoc(docRef, {
                    content: content,
                    updatedAt: new Date()
                });

                alert("저장되었습니다.");
            } catch (error) {
                console.error("저장 중 오류:", error);
                alert("저장에 실패했습니다.");
            }
        });
    }

    const resultButton = document.getElementById('resultButton');
    if (resultButton) {
        resultButton.addEventListener('click', function() {
            if (window.currentEpisodeId) {
                window.location.href = `result.html?episode-id=${window.currentEpisodeId}`;
            }
        });
    }

    // TinyMCE 에디터가 초기화될 때까지 기다린 후 글자 수 기능 추가
    const waitForEditor = setInterval(() => {
        const editor = tinymce.get('wysiwyg-editor');
        if (editor) {
            clearInterval(waitForEditor);
            
            const counterDiv = document.querySelector('.word-counter');
            if (counterDiv) {
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
                
                // 초기 글자 수 표시
                updateWordCount();
            }
        }
    }, 100);
});
