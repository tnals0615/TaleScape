// firebase.js에서 export한것만 가져올 수 있다.
import { db, addDoc, collection, getDoc, doc, onSnapshot, query, orderBy, updateDoc, deleteDoc } from "./firebase.js";
import { loadMemoData, loadCharacterData, loadWorldBuildingData, loadEpisodeData } from './script_main.js';

// 전역 변수
let projectId = "";

// DOM 요소 캐싱
const iconMoon = document.getElementById("moon");
const modalContainer = document.getElementById("projectModalContainer");
const openButton = document.querySelector(".icon-plus");
const closeButton = document.getElementById("pModalClose");
const applyButton = document.getElementById("pModalApply");
const projectNameInput = document.getElementById("projectNameInput");
const projectPlotInput = document.getElementById("projectPlotInput");
const projectList = document.querySelector(".project-list");
const addBtnMsg = document.getElementById("addBtnMsg");

// 요소 존재 여부 확인
if (  !iconMoon ||  !modalContainer ||  !openButton ||  !closeButton ||  !applyButton ||  !projectNameInput ||  !projectPlotInput) {
  console.error("필수 DOM 요소 중 하나가 누락되었습니다. 코드 로직을 확인하세요.");
}

document.getElementById("TaleScape").addEventListener("click", function() {
            window.location.href = "main.html"; // Redirect to main.html
        });

// 다크 모드 토글 이벤트 리스너
document.getElementById("moon")?.addEventListener("click", () => {
    const body = document.querySelector('body');
    body.classList.toggle("dark-mode");
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// 모달 열기
openButton?.addEventListener("click", () => {
  modalContainer?.classList.remove("hidden");
});

// 모달 닫기
closeButton?.addEventListener("click", () => {
  modalContainer?.classList.add("hidden");
});

// Firestore에 데이터 추가
applyButton?.addEventListener("click", async () => {
  const projectName = projectNameInput.value.trim();
  const projectPlot = projectPlotInput.value.trim();

  // 입력 유효성 검사
  if (!projectName || !projectPlot) {
    alert("모든 필드를 입력해주세요.");
    return;
  }

  if (projectName.length > 50) {
    alert("프로젝트 이름은 50자를 초과할 수 없습니다.");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "project"), {
      name: projectName,
      plot: projectPlot,
      createdAt: new Date(),
    });

    console.log("Document written with ID: ", docRef.id);

    // 안내 메시지 제거
    if (addBtnMsg) {
      addBtnMsg.remove();
    }

    // 입력 필드 초기화 및 모달 닫기
    projectNameInput.value = "";
    projectPlotInput.value = "";
    modalContainer?.classList.add("hidden");

    alert("프로젝트가 성공적으로 추가되었습니다!");
  } catch (error) {
    console.error("Firestore 추가 중 오류 발생: ", error);
    alert("프로젝트를 추가하는 중 문제가 발생했습니다.");
  }
});

/* 데이터 로드 */
document.addEventListener("DOMContentLoaded", () => {
  const projectContainer = document.getElementById("projectContainer");
  const projectList = document.querySelector(".project-list");

  if (!projectContainer || !projectList) {
    console.error("요소를 찾을 수 없습니다.");
    return;
  }

  // Firestore 컬렉션 쿼리: createdAt 기준으로 정렬
  const q = query(collection(db, "project"), orderBy("name", "asc")); // 알파벳 순 정렬
  onSnapshot(q, (snapshot) => {
    projectList.innerHTML = ""; // 기존 리스트 초기화

    if (snapshot.empty) {
      handleAddBtnMsg(false, projectContainer); // 데이터가 없음을 알림
    } else {
      handleAddBtnMsg(true, projectContainer); // 메시지 제거
      snapshot.forEach((doc) => {
        const data = doc.data();
        const projectName = data.name;
        const listItem = createProjectElement(projectName, doc.id);
        projectList.appendChild(listItem);
        attachProjectEvents(listItem, doc.id);
      });
    }
  }, (error) => {
    console.error("실시간 동기화 중 오류 발생:", error);
  });

  // 저장된 projectId 복원
  const savedProjectId = localStorage.getItem('currentProjectId');
  if (savedProjectId) {
    projectId = savedProjectId;
  }

  // 저장된 테마 적용
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
});

function handleAddBtnMsg(hasData, container) {
  const addBtnMsg = document.getElementById("addBtnMsg");

  if (hasData) {
    // 데이터가 있으면 메시지 제거
    if (addBtnMsg) addBtnMsg.remove();
  } else {
    // 데이터가 없으면 메시지 추가
    if (!addBtnMsg) {
      const msg = document.createElement("p");
      msg.id = "addBtnMsg";
      msg.innerHTML = "+버튼을 눌러 프로젝트를<br />생성해주세요";
      container.prepend(msg); // 메시지를 container 맨 앞에 추가
    }
  }
}

function createProjectElement(projectName, docId) {
    const newProject = document.createElement('li');
    newProject.className = 'project-item';
    newProject.textContent = projectName;
    newProject.setAttribute('data-id', docId);

    // 수정/삭제 버튼 컨테이너
    const actionButtons = document.createElement('div');
    actionButtons.className = 'project-actions';
    actionButtons.innerHTML = `
        <button class="edit-project-btn" title="수정"><i class="bi bi-pencil"></i></button>
        <button class="delete-project-btn" title="삭제"><i class="bi bi-trash"></i></button>
    `;

    // 버튼을 li 요소에 추가
    newProject.appendChild(actionButtons);

    return newProject;
}

function attachProjectEvents(project, docId) {
    // 프로젝트 클릭 이벤트 - 전체 li에 이벤트 추가
    project.addEventListener('click', (e) => {
        // 버튼 클릭은 무시
        if (!e.target.closest('.project-actions')) {
            const projectId = project.getAttribute('data-id');
            if (projectId) {
                handleProjectClick(project, projectId);
            }
        }
    });
    
    // 수정 버튼 이벤트
    project.querySelector('.edit-project-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const projectId = project.getAttribute('data-id');
        if (!projectId) return;
        
        try {
            const projectRef = doc(db, "project", projectId);
            const docSnap = await getDoc(projectRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('projectNameInput').value = data.name;
                document.getElementById('projectPlotInput').value = data.plot;
                
                const modal = document.getElementById('projectModalContainer');
                modal.classList.remove('hidden');
                
                // 확인 버튼에 임시 이벤트 리스너 추가
                const applyBtn = document.getElementById('pModalApply');
                const newApplyBtn = applyBtn.cloneNode(true);
                applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
                
                newApplyBtn.addEventListener('click', async () => {
                    const newName = document.getElementById('projectNameInput').value.trim();
                    const newPlot = document.getElementById('projectPlotInput').value.trim();
                    
                    if (newName) {
                        try {
                            await updateDoc(projectRef, {
                                name: newName,
                                plot: newPlot
                            });
                            
                            project.textContent = newName; // textContent 업데이트
                            // 수정/삭제 버튼 다시 추가
                            const actionButtons = document.createElement('div');
                            actionButtons.className = 'project-actions';
                            actionButtons.innerHTML = `
                                <button class="edit-project-btn" title="수정"><i class="bi bi-pencil"></i></button>
                                <button class="delete-project-btn" title="삭제"><i class="bi bi-trash"></i></button>
                            `;
                            project.appendChild(actionButtons);
                            
                            modal.classList.add('hidden');
                            
                            // 현재 페이지가 main.html인 경우에만 추가 업데이트
                            if (window.location.pathname.includes('main.html')) {
                                document.querySelector('.main-title').textContent = newName;
                                document.querySelector('.project-desc').textContent = newPlot;
                            }
                        } catch (error) {
                            console.error("프로젝트 수정 중 오류 발생:", error);
                            alert("프로젝트 수정에 실패했습니다.");
                        }
                    }
                });
            }
        } catch (error) {
            console.error("프로젝트 데이터 로드 중 오류 발생:", error);
            alert("프로젝트 데이터를 불러오는 중 문제가 발생했습니다.");
        }
    });
    
    // 삭제 버튼 이벤트
    project.querySelector('.delete-project-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('프로젝트를 삭제하시겠습니까?')) {
            try {
                await deleteDoc(doc(db, "project", docId));
                project.remove();
                checkEmptyProjectList();
            } catch (error) {
                console.error("프로젝트 삭제 중 오류 발생:", error);
                alert("프로젝트 삭제에 실패했습니다.");
            }
        }
    });
}

function checkEmptyProjectList() {
    const projectList = document.querySelector('.project-list');
    if (!projectList.children.length) {
        handleAddBtnMsg(false, document.getElementById('projectContainer'));
    }
}

async function handleProjectClick(project, clickedProjectId) {
    try {
        const projectRef = doc(db, "project", clickedProjectId);
        const docSnap = await getDoc(projectRef);

        if (docSnap.exists()) {
            projectId = clickedProjectId;  // 전역 변수 설정
            localStorage.setItem('currentProjectId', clickedProjectId);
            
            // 모든 프로젝트에서 active 클래스 제거
            document.querySelectorAll('.project-list li').forEach(li => {
                li.classList.remove('active');
            });
            
            // 클릭된 프로젝트에 active 클래스 추가
            project.classList.add('active');

            // 현재 페이지 확인
            const currentPath = window.location.pathname;
            if (currentPath.includes('edit.html') || currentPath.includes('result.html')) {
                window.location.href = 'main.html';
                return;
            }
            
            // main.html에서만 데이터 업데이트 및 로드
            const mainTitle = document.querySelector('.main-title');
            const projectDesc = document.querySelector('.project-desc');
            if (mainTitle && projectDesc) {
                mainTitle.textContent = docSnap.data().name || "프로젝트 이름 없음";
                projectDesc.textContent = docSnap.data().plot || "설명 없음";
                
                // 데이터 로드
                loadMemoData();
                loadCharacterData();
                loadWorldBuildingData();
                loadEpisodeData();
            }
        }
    } catch (error) {
        console.error("프로젝트 데이터 로드 중 오류 발생:", error);
        // 에러 메시지 표시하지 않음
    }
}
