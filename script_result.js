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
                
                const leftPage = document.querySelector('.left-page');
                const rightPage = document.querySelector('.right-page');
                
                // 기존 내용 초기화
                leftPage.innerHTML = '';
                rightPage.innerHTML = '';
                
                // 제목 스타일 수정
                const titleElement = document.createElement('p');
                titleElement.className = 'main-title';
                titleElement.style.textAlign = 'center';
                titleElement.style.fontSize = '25px';
                titleElement.style.marginTop = '10px';
                titleElement.style.marginBottom = '20px';
                titleElement.textContent = `${data.episode_number || '?'}화. ${data.title}`;
                leftPage.appendChild(titleElement);
                
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
/*
document.addEventListener("DOMContentLoaded", () => {
  // 토글 메뉴 클릭 이벤트
  document.querySelectorAll('.toggle-title').forEach(title => {
    title.addEventListener('click', () => {
      const content = title.nextElementSibling;
      if (content && content.classList.contains('toggle-content')) {
        // 현재 표시 상태 확인
        const isHidden = content.style.display === 'none';
        
        // 토글 상태 변경
        content.style.display = isHidden ? 'block' : 'none';
        
        // 화살표 방향 변경
        title.textContent = title.textContent.replace(
          isHidden ? '▶' : '▼',
          isHidden ? '▼' : '▶'
        );
      }
    });
  });

  // 공유하기 버튼 클릭 이벤트
  document.getElementById('generateShareLink')?.addEventListener('click', () => {
    // ... 기존 공유하기 코드 ...
  });
});

*/