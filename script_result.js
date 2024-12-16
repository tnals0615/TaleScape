import { db, doc, getDoc } from "./firebase.js";

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeId = urlParams.get('episode-id');
    
    if (episodeId) {
        try {
            const docRef = doc(db, "episode", episodeId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                let currentPageSet = 1;
                let totalContent = [];  // 전체 콘텐츠를 저장할 배열
                
                const leftPage = document.querySelector('.left-page');
                const rightPage = document.querySelector('.right-page');
                
                // 페이지 세트 표시 함수
                function displayPageSet(pageNumber) {
                    leftPage.innerHTML = '';
                    rightPage.innerHTML = '';
                    
                    const startIndex = (pageNumber - 1) * 2;
                    
                    // 첫 페이지 세트가 아닌 경우에는 제목 없이 내용만 표시
                    if (pageNumber === 1) {
                        // 제목 추가
                        const titleElement = document.createElement('p');
                        titleElement.className = 'main-title';
                        titleElement.style.textAlign = 'center';
                        titleElement.style.fontSize = '25px';
                        titleElement.style.marginTop = '20px';
                        titleElement.style.marginBottom = '20px';
                        titleElement.textContent = `${data.episode_number || '?'}화. ${data.title}`;
                        leftPage.appendChild(titleElement);
                    }
                    
                    if (totalContent[startIndex]) {
                        if (pageNumber === 1) {
                            // 첫 페이지의 경우 기존 내용에 추가
                            leftPage.innerHTML += totalContent[startIndex];
                        } else {
                            // 다른 페이지는 내용만 표시
                            leftPage.innerHTML = totalContent[startIndex];
                        }
                    }
                    
                    if (totalContent[startIndex + 1]) {
                        rightPage.innerHTML = totalContent[startIndex + 1];
                    }
                    
                    // 마지막 페이지 세트인 경우 처리
                    if (!totalContent[startIndex] && !totalContent[startIndex + 1]) {
                        currentPageSet = 1;
                        displayPageSet(1);
                    }
                }
                
                // 오른쪽 페이지 클릭 이벤트
                rightPage.addEventListener('click', () => {
                    currentPageSet++;
                    displayPageSet(currentPageSet);
                });

                // 초기 콘텐츠 로드 및 페이지 나누기
                if (data.content) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.content;
                    
                    const contentNodes = Array.from(tempDiv.childNodes);
                    let currentPage = leftPage;
                    let currentContent = '';
                    
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
                                    if (currentPage === leftPage && 
                                        currentPage.scrollHeight > currentPage.clientHeight) {
                                        // 왼쪽 페이지 높이 초과시
                                        currentPage = rightPage;
                                        tempSpan.remove();
                                        rightPage.appendChild(tempSpan);
                                    }
                                }
                            });
                        } else if (node.nodeType === 1) { // 요소 노드인 경우
                            const clone = node.cloneNode(true);
                            currentPage.appendChild(clone);
                            
                            // 높이 체크
                            if (currentPage === leftPage && 
                                currentPage.scrollHeight > currentPage.clientHeight) {
                                // 왼쪽 페이지 높이 초과시
                                currentPage = rightPage;
                                clone.remove();
                                rightPage.appendChild(clone);
                            }
                        }
                    });

                    // 각 페이지의 내용을 totalContent 배열에 저장
                    totalContent.push(leftPage.innerHTML);
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