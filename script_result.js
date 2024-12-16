import { db, doc, getDoc } from "./firebase.js";

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

                console.log("currentProjectId", data.project_id);

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

                    // 이전 내용 저장
                    const oldLeftContent = leftPage.innerHTML;
                    const oldRightContent = rightPage.innerHTML;

                    // 페이지 내용 초기화
                    leftPage.innerHTML = '';
                    rightPage.innerHTML = '';
    
                    // 첫 페이지에만 제목 표시
                    if (pageNumber === 1) {
                        const titleElement = document.createElement('p');
                        titleElement.className = 'main-title';
                        titleElement.style.textAlign = 'center';
                        titleElement.style.fontSize = '25px';
                        titleElement.style.marginTop = '10px';
                        titleElement.style.marginBottom = '20px';
                        titleElement.textContent = `${data.episode_number || '?'}화. ${data.title}`;
                        leftPage.appendChild(titleElement);
                    }
    
                    // 내용 표시
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
    
                    // 새 페이지 내용을 표시할 때
                    leftPage.classList.add('page-appear');
                    rightPage.classList.add('page-appear');

                    // 애니메이션이 끝나면 클래스 제거
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
            console.error("에피소드 데이터 로드 중 오류:", error);
            alert("에피소드 데이터를 불러오는 중 문제가 발생했습니다.");
        }
    }
});
/*
document.addEventListener("DOMContentLoaded", () => {
  const modalOpenButton = document.getElementById("plus");
  const modalCloseButton = document.getElementById("modalCloseButton");
  const modal = document.getElementById("modalContainer");

  modalOpenButton.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  modalCloseButton.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
});

*/