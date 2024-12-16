import { db, doc, getDoc } from "./firebase.js";

let currentPageSet = 1;
let totalContent = [];

// Firebase에서 데이터 로드
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeId = urlParams.get('episode-id');
    
    if (episodeId) {
        try {
            const docRef = doc(db, "episode", episodeId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // 제목 설정
                document.querySelector('.title').textContent = 
                    `${data.episode_number || '?'}화. ${data.title}`;
                
                // 내용 설정
                if (data.content) {
                    document.querySelector('.content').innerHTML = data.content;
                }
            } else {
                console.error("에피소드를 찾을 수 없습니다!");
                document.querySelector('.content').textContent = 
                    "에피소드를 찾을 수 없습니다.";
            }
        } catch (error) {
            console.error("데이터 로드 중 오류:", error);
            document.querySelector('.content').textContent = 
                "데이터를 불러오는 중 문제가 발생했습니다.";
        }
    } else {
        document.querySelector('.content').textContent = 
            "올바른 에피소드 ID가 제공되지 않았습니다.";
    }
});

// 페이지 나누기 함수
function splitContentIntoPages() {
    const leftPage = document.querySelector('.left-page');
    const rightPage = document.querySelector('.right-page');
    const content = document.querySelector('.content').innerHTML;
    
    totalContent = [];  // 배열 초기화를 여기서 해야 함
    leftPage.innerHTML = '';
    rightPage.innerHTML = '';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const contentNodes = Array.from(tempDiv.childNodes);
    let currentPage = leftPage;
    
    // 첫 페이지에만 제목 추가
    const titleElement = document.querySelector('.title').cloneNode(true);
    leftPage.appendChild(titleElement);
    
    // 첫 페이지 세트 시작
    let currentSet = {
        left: leftPage.innerHTML,
        right: ''
    };

    contentNodes.forEach(node => {
        if (node.nodeType === 3) { // 텍스트 노드
            const sentences = node.textContent.split(/([.!?])\s+/);
            sentences.forEach(sentence => {
                if (sentence.trim()) {
                    const tempSpan = document.createElement('span');
                    tempSpan.textContent = sentence + ' ';
                    currentPage.appendChild(tempSpan);
                    
                    if (contentHeight > currentPage.clientHeight - 60) {
                        tempSpan.remove();
                        
                        if (currentPage === leftPage) {
                            currentPage = rightPage;
                            currentSet.right = '';  // 오른쪽 페이지 초기화
                            rightPage.appendChild(tempSpan);
                        } else {
                            // 현재 세트 저장하고 새로운 세트 시작
                            totalContent.push(currentSet.left, currentSet.right);
                            currentSet = {
                                left: '',
                                right: ''
                            };
                            
                            leftPage.innerHTML = '';
                            rightPage.innerHTML = '';
                            currentPage = leftPage;
                            currentPage.appendChild(tempSpan);
                            currentSet.left = leftPage.innerHTML;
                        }
                    }
                    // 현재 페이지 내용 업데이트
                    if (currentPage === leftPage) {
                        currentSet.left = leftPage.innerHTML;
                    } else {
                        currentSet.right = rightPage.innerHTML;
                    }
                }
            });
        } else if (node.nodeType === 1) { // 요소 노드
            const clone = node.cloneNode(true);
            currentPage.appendChild(clone);
            
            if (currentPage.scrollHeight > currentPage.clientHeight) {
                clone.remove();
                
                if (currentPage === leftPage) {
                    currentPage = rightPage;
                    rightPage.appendChild(clone);
                } else {
                    totalContent.push(leftPage.innerHTML, rightPage.innerHTML);
                    
                    leftPage.innerHTML = '';
                    rightPage.innerHTML = '';
                    currentPage = leftPage;
                    currentPage.appendChild(clone);
                }
            }
        }
    });

    // 마지막 페이지 세트 저장
    if (leftPage.innerHTML || rightPage.innerHTML) {
        totalContent.push(currentSet.left, currentSet.right);
    }

    displayPageSet(1);
}

// 페이지 이동 함수
function displayPageSet(pageNumber) {
    const leftPage = document.querySelector('.left-page');
    const rightPage = document.querySelector('.right-page');
    
    // 페이지 번호가 유효한 위를 벗어나면 처리하지 않음
    if (pageNumber < 1 || pageNumber * 2 > totalContent.length) {
        return;
    }
    
    const startIndex = (pageNumber - 1) * 2;
    
    leftPage.innerHTML = totalContent[startIndex] || '';
    rightPage.innerHTML = totalContent[startIndex + 1] || '';
}

// 페이지 클릭 이벤트 수정
function setupPageNavigation() {
    const bookView = document.querySelector('.book-view');
    
    function handlePageClick(e) {
        const bookRect = bookView.getBoundingClientRect();
        const clickX = e.clientX - bookRect.left;
        const centerX = bookRect.width / 2;
        
        if (clickX < centerX) {
            // 왼쪽 클릭
            if (currentPageSet <= 1) {
                alert('첫 페이지입니다.');
                return;
            }
            currentPageSet--;
        } else {
            // 오른쪽 클릭
            if (currentPageSet * 2 >= totalContent.length) {
                alert('마지막 페이지입니다.');
                return;
            }
            currentPageSet++;
        }
        displayPageSet(currentPageSet);
    }
    
    bookView.addEventListener('click', handlePageClick);
}

window.splitContentIntoPages = splitContentIntoPages;

// DOMContentLoaded 이벤트에서 setupPageNavigation 호출
document.addEventListener('DOMContentLoaded', () => {
    setupPageNavigation();
});

window.toggleViewMode = function(mode) {
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.view-mode-toggle .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.btn[onclick*="${mode}"]`).classList.add('active');
    
    // 스크롤 위치 초기화
    window.scrollTo(0, 0);
    
    // 뷰 모드 변경
    document.querySelector('.scroll-view').classList.toggle('active', mode === 'scroll');
    document.querySelector('.book-view').classList.toggle('active', mode === 'book');
    document.body.classList.toggle('book-mode', mode === 'book');
    
    if (mode === 'book') {
        // 페이지 세트 초기화
        totalContent = [];  // totalContent 배열 초기화
        currentPageSet = 1;
        splitContentIntoPages();
    } else {
        // 스크롤 모드로 전환 시 컨테이너도 맨 위로
        document.querySelector('.container').scrollTo(0, 0);
    }
} 

// 확대/축소 ��지
window.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
        e.preventDefault();
    }
}, { passive: false });

// 키보드 단축키로 인한 확대/축소 방지
window.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
    }
});