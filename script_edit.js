import { db, doc, getDoc, updateDoc } from "./firebase.js";

window.currentEpisodeId = null;

document.addEventListener('DOMContentLoaded', async function() {
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
});

document.getElementById('resultButton').addEventListener('click', function() {
    if (window.currentEpisodeId) {
        location.href = `result.html?episode-id=${window.currentEpisodeId}`;
    }
});

// 에피소드 데이터 로드 함수
async function loadEpisodeContent() {
    try {
        const docRef = doc(db, "episode", currentEpisodeId);
        const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                const displayNumber = episodeNumber || data.episode_number || '?';
                document.querySelector('.main-title').textContent = 
                    `${displayNumber}화. ${data.title}`;
                
                if (data.content) {
                    tinymce.get('wysiwyg-editor').setContent(data.content);
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

    document.getElementById('resultButton').addEventListener('click', function() {
        if (currentEpisodeId) {
            location.href = `result.html?episode-id=${currentEpisodeId}`;
        }
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