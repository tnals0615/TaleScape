import { db, doc, getDoc } from "./firebase.js";

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeId = urlParams.get('episode-id');
    
    if (episodeId) {
        try {
            const docRef = doc(db, "episode", episodeId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const episodeData = docSnap.data();
                
                // 제목 설정
                document.querySelector('.title').textContent = 
                    `${episodeData.episode_number || '?'}화. ${episodeData.title}`;
                
                // 내용 설정
                if (episodeData.content) {
                    document.querySelector('.content').innerHTML = episodeData.content;
                }
                
                // 페이지 클릭 이벤트 설정
                setupPageNavigation();
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
    }
});

// 페이지 분할 함수
function splitContentIntoPages() {
    const content = document.querySelector('.content');
    const title = document.querySelector('.title');
    if (!content || !title) return;
    
    const titleText = title.textContent;
    const contentHTML = content.innerHTML;
    
    // 페이지 배열 초기화
    const pages = [];
    
    // 첫 페이지는 제목만
    pages.push(`
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px;">
            <h2 style="text-align: center; font-family: '나눔명조', serif; font-size: 24px; margin: 0;">
                ${titleText}
            </h2>
        </div>
    `);
    
    // 내용을 문단 단위로 분할
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = contentHTML;
    const paragraphs = Array.from(contentDiv.children);
    
    // 임시 div 생성 및 스타일 설정
    const pageDiv = document.createElement('div');
    pageDiv.style.position = 'absolute';
    pageDiv.style.visibility = 'hidden';
    pageDiv.style.width = '45%';
    pageDiv.style.padding = '20px';
    pageDiv.style.boxSizing = 'border-box';
    pageDiv.style.height = '100%';
    pageDiv.style.overflow = 'hidden';
    document.body.appendChild(pageDiv);
    
    let currentPage = '';
    
    // 각 문단을 페이지에 추가
    paragraphs.forEach((para, index) => {
        const paraHTML = para.outerHTML;
        const testPage = currentPage + paraHTML;
        pageDiv.innerHTML = `<div style="padding: 20px;">${testPage}</div>`;
        
        // 페이지 높이가 기준을 넘으면 새 페이지 시작
        if (pageDiv.scrollHeight > pageDiv.clientHeight) {
            if (currentPage) {
                pages.push(`<div style="height: 100%; padding: 20px; overflow: hidden;">${currentPage}</div>`);
            }
            currentPage = paraHTML;
        } else {
            currentPage = testPage;
        }
        
        // 마지막 문단이면 남은 내용 추가
        if (index === paragraphs.length - 1 && currentPage) {
            pages.push(`<div style="height: 100%; padding: 20px; overflow: hidden;">${currentPage}</div>`);
        }
    });
    
    // 임시 요소 제거
    document.body.removeChild(pageDiv);
    
    // 전역 변수에 페이지 배열 저장
    window.totalContent = pages;
    window.currentPageSet = 1;
    
    // 첫 페이지 세트 표시
    displayPageSet(1);
}

// 페이지 이동 함수
function displayPageSet(pageNumber) {
    const leftPageContent = document.querySelector('.left-page .page-content');
    const rightPageContent = document.querySelector('.right-page .page-content');
    
    if (!leftPageContent || !rightPageContent) return;
    
    // 페이지 번호가 유효한 범위를 벗어나면 처리하지 않음
    if (pageNumber < 1 || pageNumber * 2 > window.totalContent.length) {
        return;
    }
    
    const startIndex = (pageNumber - 1) * 2;
    
    // 페이지 내용 표시
    leftPageContent.innerHTML = window.totalContent[startIndex] || '';
    rightPageContent.innerHTML = window.totalContent[startIndex + 1] || '';
    
    // 스크롤 방지
    leftPageContent.style.overflow = 'hidden';
    rightPageContent.style.overflow = 'hidden';
}

// 페이지 클릭 이벤트
function handlePageClick(e) {
    const bookView = document.querySelector('.book-view');
    const bookRect = bookView.getBoundingClientRect();
    const clickX = e.clientX - bookRect.left;
    const centerX = bookRect.width / 2;
    
    if (clickX < centerX) {
        // 왼쪽 클릭
        if (window.currentPageSet <= 1) {
            alert('첫 페이지입니다.');
            return;
        }
        window.currentPageSet--;
        displayPageSet(window.currentPageSet);
    } else {
        // 오른쪽 클릭
        if (window.currentPageSet * 2 >= window.totalContent.length) {
            alert('마지막 페이지입니다.');
            return;
        }
        const rightPage = document.querySelector('.right-page');
        rightPage.classList.add('flip-page');
        
        setTimeout(() => {
            rightPage.classList.remove('flip-page');
            window.currentPageSet++;
            displayPageSet(window.currentPageSet);
        }, 600);
    }
}

// 페이지 클릭 이벤트 설정
function setupPageNavigation() {
    const bookView = document.querySelector('.book-view');
    if (bookView) {
        bookView.addEventListener('click', handlePageClick);
    }
}

// 뷰 모드 전환
window.toggleViewMode = function(mode) {
    const scrollView = document.querySelector('.scroll-view');
    const bookView = document.querySelector('.book-view');
    const buttons = document.querySelectorAll('.view-mode-toggle .btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.btn[onclick*="${mode}"]`).classList.add('active');
    
    if (mode === 'scroll') {
        scrollView.classList.add('active');
        bookView.classList.remove('active');
        document.body.classList.remove('book-mode');
    } else {
        scrollView.classList.remove('active');
        bookView.classList.add('active');
        document.body.classList.add('book-mode');
        splitContentIntoPages();
    }
}