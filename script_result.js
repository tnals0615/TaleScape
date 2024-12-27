import { db, doc, getDoc } from "./firebase.js";

// 에러 처리 함수
function handleError(error, message) {
    console.error(error);
    alert(message || "작업 중 문제가 발생했습니다.");
}

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

                let currentPageSet = 1;
                let totalContent = [];  // 전체 콘텐츠를 저장할 배열
                
                const leftPage = document.querySelector('.left-page');
                const rightPage = document.querySelector('.right-page');
                
                // 페이지 세트 표시 함수
                function displayPageSet(pageNumber) {
                    const startIndex = (pageNumber - 1) * 2;
    
                    // 첫 페이지에서 이전으로 가려고 할 때
                    if (pageNumber === 1 && leftPage.hasEventListener) {
                        alert("첫 페이지입니다.");
                        return;
                    }

                    // 페이지 내용 초기화
                    leftPage.innerHTML = '';
                    rightPage.innerHTML = '';

                    // 첫 페이지 제목 표시
                    if (pageNumber === 1) {
                        const titleElement = createTitleElement(data);
                        leftPage.appendChild(titleElement);
                    }

                    // 내용 표시
                    displayPageContent(pageNumber, startIndex);

                    // 페이지 전환 애니메이션
                    applyPageTransitionEffect();
                }

                // 제목 요소 생성 함수
                function createTitleElement(data) {
                    const titleElement = document.createElement('p');
                    titleElement.className = 'main-title';
                    titleElement.style.textAlign = 'center';
                    titleElement.style.fontSize = '25px';
                    titleElement.style.marginTop = '10px';
                    titleElement.style.marginBottom = '20px';
                    titleElement.textContent = `${data.episode_number || '?'}화. ${data.title}`;
                    return titleElement;
                }

                // 페이지 내용 표시 함수
                function displayPageContent(pageNumber, startIndex) {
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
                }

                // 페이지 전환 효과 적용 함수
                function applyPageTransitionEffect() {
                    leftPage.classList.add('page-appear');
                    rightPage.classList.add('page-appear');

                    setTimeout(() => {
                        leftPage.classList.remove('page-appear');
                        rightPage.classList.remove('page-appear');
                    }, 800);
                }

                // 오른쪽 페이지 클릭 이벤트
                rightPage.addEventListener('click', () => {
                    // 다음 페이지가 있는지 확인
                    const nextPageStart = currentPageSet * 2;
                    if (!totalContent[nextPageStart]) {
                        alert("마지막 페이지입니다.");
                        return;
                    }

                    rightPage.classList.add('flip-page');

                    // 애니메이션이 끝나면
                    setTimeout(() => {
                        rightPage.classList.remove('flip-page');
                        currentPageSet++; // currentPageSet 증가
                        displayPageSet(currentPageSet);
                    }, 800);
                });

                // 왼쪽 페이지 클릭 이벤트
                leftPage.addEventListener('click', () => {
                    if (currentPageSet > 1) {
                        currentPageSet--;
                        displayPageSet(currentPageSet, 'left');
                    } else {
                        alert("첫 페이지입니다.");
                    }
                });

                // 초기 콘텐츠 로드 및 페이지 나누기
                if (data.content) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.content;
    
                    const contentNodes = Array.from(tempDiv.childNodes);
                    let currentPage = leftPage;
    
                    // 각 텍스트 노드를 문장 단위로 분리
                    contentNodes.forEach(node => {
                        if (node.nodeType === 3) { // 텍스트 노드인 경우
                            const sentences = node.textContent.split(/([.!?])\s+/);
                            sentences.forEach(sentence => {
                                if (sentence.trim()) {
                                    const tempSpan = document.createElement('span');
                                    tempSpan.textContent = sentence + ' ';
                                    currentPage.appendChild(tempSpan);
                    
                                    // 높이 체크
                                    if (currentPage.scrollHeight > currentPage.clientHeight) {
                                        tempSpan.remove();
                        
                                        // 현재 페이지 내용 저장
                                        totalContent.push(currentPage.innerHTML);
                        
                                        // 다음 페이지로 전환
                                        if (currentPage === leftPage) {
                                            currentPage = rightPage;
                                        } else {
                                            // 오른쪽 페이지가 가득 차면 새로운 페이지 세트 시작
                                            leftPage.innerHTML = '';
                                            rightPage.innerHTML = '';
                                            currentPage = leftPage;
                                        }
                        
                                        currentPage.appendChild(tempSpan);
                                    }
                                }
                            });
                        } else if (node.nodeType === 1) { // 요소 노드인 경우
                            const clone = node.cloneNode(true);
                            currentPage.appendChild(clone);
            
                            // 높이 체크
                            if (currentPage.scrollHeight > currentPage.clientHeight) {
                                clone.remove();
                
                                // 현재 페이지 내용 저장
                                totalContent.push(currentPage.innerHTML);
                
                                // 다음 페이지로 전환
                                if (currentPage === leftPage) {
                                    currentPage = rightPage;
                                } else {
                                    // 오른쪽 페이지가 가득 차면 새로운 페이지 세트 시작
                                    leftPage.innerHTML = '';
                                    rightPage.innerHTML = '';
                                    currentPage = leftPage;
                                }
                
                                currentPage.appendChild(clone);
                            }
                        }
                    });

                    // 마지막 페이지들의 내용 저장
                    if (leftPage.innerHTML) {
                        totalContent.push(leftPage.innerHTML);
                    }
                    if (rightPage.innerHTML) {
                        totalContent.push(rightPage.innerHTML);
                    }
                }
                
                // 첫 페이지 세트 표시
                displayPageSet(1);
            } else {
                console.log("에피소드를 찾을 수 없습니다!");
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