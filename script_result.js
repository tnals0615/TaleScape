import { db, doc, getDoc } from "./firebase.js";

// 기본 유틸리티 함수들
const handleError = (error, message) => {
    console.error(error);
    alert(message || "작업 중 문제가 발생했습니다.");
};

// 페이지 관련 함수들
const setupPageDisplay = (leftPage, rightPage, currentPageNumber, totalContent, data) => {
    const displayPageSet = (pageNumber) => {
        const startIndex = (pageNumber - 1) * 2;

        if (pageNumber === 1 && leftPage.hasEventListener) {
            alert("첫 페이지입니다.");
            return;
        }

        leftPage.innerHTML = '';
        rightPage.innerHTML = '';

        displayPageContent(pageNumber, startIndex);
        applyPageTransitionEffect();
    };

    const displayPageContent = (pageNumber, startIndex) => {
        if (totalContent[startIndex]) {
            if (pageNumber === 1) {
                leftPage.innerHTML += totalContent[startIndex];
            } else {
                leftPage.innerHTML = totalContent[startIndex];
            }
        }

        if (totalContent[startIndex + 1]) {
            rightPage.innerHTML = totalContent[startIndex + 1];
        }
    };

    const applyPageTransitionEffect = () => {
        leftPage.classList.add('page-appear');
        rightPage.classList.add('page-appear');

        setTimeout(() => {
            leftPage.classList.remove('page-appear');
            rightPage.classList.remove('page-appear');
        }, 800);
    };

    return { displayPageSet };
};

// 콘텐츠 처리 함수
const processContent = (data, leftPage, rightPage, currentPageNumber) => {
    const totalContent = [];
    
    if (data.content) {
        const tempDiv = document.createElement('div');
        
        // 제목을 본문 앞에 추가
        if(currentPageNumber == 1){
            const titleHTML = `<p class="main-title" style="text-align: center; font-size: 25px; margin: 10px 0;">${data.episode_number || '?'}화. ${data.title}</p> <br>`;
            tempDiv.innerHTML = titleHTML + data.content;
        } else {
            tempDiv.innerHTML = data.content;
        }

        let currentPage = leftPage;

        const processNode = (node) => {
            if (node.nodeType === 3) { // 텍스트 노드
                appendContentToPage(createSpan(node.textContent));
            } else if (node.nodeType === 1) { // 요소 노드
                processElement(node);
            }
        };

        const processElement = (element) => {
            appendContentToPage(element.cloneNode(true));
        };

        const createSpan = (text) => {
            const span = document.createElement('span');
            span.textContent = text;
            return span;
        };

        const appendContentToPage = (element) => {
            currentPage.appendChild(element);
            if (currentPage.scrollHeight > currentPage.clientHeight) {
                element.remove();
                totalContent.push(currentPage.innerHTML);
                currentPage = switchPage(currentPage);
                currentPage.appendChild(element);
            }
        };

        const switchPage = (currentPage) => {
            if (currentPage === leftPage) {
                return rightPage;
            } else {
                leftPage.innerHTML = '';
                rightPage.innerHTML = '';
                return leftPage;
            }
        };

        Array.from(tempDiv.childNodes).forEach(processNode);

        // 마지막 페이지 저장
        if (leftPage.innerHTML) totalContent.push(leftPage.innerHTML);
        if (rightPage.innerHTML) totalContent.push(rightPage.innerHTML);
    }

    return totalContent;
};

// 이벤트 리스너 설정
const setupEventListeners = (leftPage, rightPage, currentPageNumber, totalContent, displayPageSet) => {
    rightPage.addEventListener('click', () => {
        const nextPageStart = currentPageNumber * 2;
        if (!totalContent[nextPageStart]) {
            alert("마지막 페이지입니다.");
            return;
        }

        rightPage.classList.add('flip-page');
        setTimeout(() => {
            rightPage.classList.remove('flip-page');
            currentPageNumber++;
            displayPageSet(currentPageNumber);
        }, 800);
    });

    leftPage.addEventListener('click', () => {
        if (currentPageNumber > 1) {
            currentPageNumber--;
            displayPageSet(currentPageNumber);
        } else {
            alert("첫 페이지입니다.");
        }
    });
};

// 메인 실행 코드
document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeId = urlParams.get('episode-id');
    
    if (episodeId) {
        try {
            const docRef = doc(db, "episode", episodeId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.project_id) {
                    localStorage.setItem('currentProjectId', data.project_id);
                }

                const leftPage = document.querySelector('.left-page');
                const rightPage = document.querySelector('.right-page');
                let currentPageNumber = 1;

                const totalContent = processContent(data, leftPage, rightPage, currentPageNumber);
                const { displayPageSet } = setupPageDisplay(leftPage, rightPage, currentPageNumber, totalContent, data);
                setupEventListeners(leftPage, rightPage, currentPageNumber, totalContent, displayPageSet);
                
                displayPageSet(1);
            } else {
                alert("에피소드 데이터를 불러올 수 없습니다.");
            }
        } catch (error) {
            handleError(error, "에피소드 데이터 로드 중 오류");
        }
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const editButton = document.getElementById('resultButton');
    if (editButton) {
        editButton.addEventListener('click', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const episodeId = urlParams.get('episode-id');
            
            if (episodeId) {
                window.location.href = `edit.html?episode-id=${episodeId}`;
            }
        });
    }
});
// 공유하기 기능 추가
document.getElementById('generateShareLink').addEventListener('click', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeId = urlParams.get('episode-id');
    
    if (episodeId) {
        try {
            // Firebase 호스팅 URL을 사용한 공유 링크 생성
            const shareUrl = `https://talescape-d61b8.web.app/share.html?episode-id=${episodeId}`;
            
            // 공유 모달 표시
            const shareModal = document.getElementById('shareModal');
            const shareUrlInput = document.getElementById('shareUrlInput');
            
            shareUrlInput.value = shareUrl;
            shareModal.classList.remove('hidden');
            
            // URL 자동 선택
            shareUrlInput.select();
            
            // 클립보드에 복사
            try {
                await navigator.clipboard.writeText(shareUrl);
            } catch (err) {
                console.error('클립보드 복사 실패:', err);
                alert('클립보드 복사에 실패했습니다.');
            }
        } catch (error) {
            handleError(error, "공유 링크 생성 중 오류");
        }
    } else {
        alert('공유할 에피소드를 찾을 수 없습니다.');
    }
});

// 공유 모달 닫기 버튼 이벤트
document.querySelector('#shareModal .btn-secondary').addEventListener('click', function() {
    document.getElementById('shareModal').classList.add('hidden');
});
