// firebase.js에서 export한것만 가져올 수 있다.
import { db, addDoc, collection, getDoc, doc, onSnapshot, query, orderBy, updateDoc, deleteDoc, getDocs, where } from "./firebase.js";

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
const projectContainer = document.getElementById("projectContainer");
const taleScapeHeader = document.getElementById("TaleScape");

// 1. 자주 사용되는 DOM 요소들을 상수로 정의
const UI = {
    mainTitle: document.querySelector('.main-title'),
    projectDesc: document.querySelector('.project-desc'),
};

// 2. 모달 관련 유틸리티 함수
const modalUtils = {
    open() {
        modalContainer.classList.remove('hidden');
    },
    close() {
        modalContainer.classList.add('hidden');
        projectNameInput.value = '';
        projectPlotInput.value = '';
    },
    setValues(name, plot) {
        projectNameInput.value = name;
        projectPlotInput.value = plot;
    }
};

// 요소 존재 여부 확인
if (!iconMoon || !modalContainer || !openButton || !closeButton || !applyButton || !projectNameInput || !projectPlotInput || !taleScapeHeader) {
    console.error("필수 DOM 요소 중 하나가 누락되었습니다. 코드 로직을 확인하세요.");
}

// 헤더 클릭 이벤트
taleScapeHeader?.addEventListener("click", () => window.location.href = "main.html");

// 다크 모드 토글 이벤트 리스너
iconMoon?.addEventListener("click", () => {
    const body = document.querySelector('body');
    body.classList.toggle("dark-mode");
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// 모달 이벤트 리스너
openButton?.addEventListener("click", modalUtils.open);
closeButton?.addEventListener("click", modalUtils.close);

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
    await addDoc(collection(db, "project"), {
      name: projectName,
      plot: projectPlot,
      createdAt: new Date(),
    });

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

function attachProjectEvents(listItem, projectId) {
    // 프로젝트 클릭 이벤트
    listItem.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-project-btn') && !e.target.closest('.edit-project-btn')) {
            handleProjectSelection(listItem, projectId);
        }
    });

    // 삭제 버튼 이벤트
    const deleteBtn = listItem.querySelector('.delete-project-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            handleProjectDelete(projectId);
        });
    }

    // 수정 버튼 이벤트
    const editBtn = listItem.querySelector('.edit-project-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 방지
            handleProjectEdit(listItem, projectId);
        });
    }
}

function checkEmptyProjectList() {
    const projectList = document.querySelector('.project-list');
    if (!projectList.children.length) {
        handleAddBtnMsg(false, projectContainer);
    }
}

async function handleProjectSelection(project, projectId, isClick = true) {
    try {
        const projectRef = doc(db, "project", projectId);
        const docSnap = await getDoc(projectRef);

        if (docSnap.exists()) {
            localStorage.setItem('currentProjectId', projectId);
            
            if (isClick) {
                document.querySelectorAll('.project-list li').forEach(li => {
                    li.classList.remove('active');
                });
                project.classList.add('active');
            }

            const currentPath = window.location.pathname;
            if (currentPath.includes('edit.html') || currentPath.includes('result.html')) {
                window.location.href = 'main.html';
                return;
            }

            // main.html에서의 처리
            if (UI.mainTitle && UI.projectDesc) {
                UI.mainTitle.textContent = docSnap.data().name || "프로젝트 이름 없음";
                UI.projectDesc.textContent = docSnap.data().plot || "설명 없음";
            }
        }
    } catch (error) {
        console.error("프로젝트 데이터 로드 중 오류:", error);
    }
}

// 프로젝트 삭제 처리 함수
async function handleProjectDelete(projectId) {
    if (confirm('프로젝트를 삭제하시겠습니까?\n관련된 모든 메모, 캐릭터, 세계관, 에피소드가 함께 삭제됩니다.')) {
        try {
            // 1. 에피소드 내용 삭제
            const episodeQuery = query(
                collection(db, "episode"),
                where("project_id", "==", projectId)
            );
            const episodeSnapshot = await getDocs(episodeQuery);
            
            // 에피소드 내용 삭제
            for (const episodeDoc of episodeSnapshot.docs) {
                const episodeContentRef = doc(db, "episode_content", episodeDoc.id);
                try {
                    await deleteDoc(episodeContentRef);
                    console.log("에피소드 내용이 삭제되었습니다:", episodeDoc.id);
                } catch (error) {
                    console.error("에피소드 내용 삭제 중 오류:", error);
                }
            }

            // 2. 관련된 모든 하위 데이터 삭제
            const collections = ["memo", "character", "worldBuilding", "episode"];
            
            for (const collectionName of collections) {
                try {
                    const q = query(
                        collection(db, collectionName),
                        where("project_id", "==", projectId)
                    );
                    
                    const querySnapshot = await getDocs(q);
                    console.log(`${collectionName} 문서 수:`, querySnapshot.size); // 디버깅용
                    
                    for (const docSnapshot of querySnapshot.docs) {
                        await deleteDoc(docSnapshot.ref);
                        console.log(`${collectionName} 문서 삭제됨:`, docSnapshot.id);
                    }
                    
                    console.log(`${collectionName} 컬렉션의 관련 문서들이 삭제되었습니다.`);
                } catch (error) {
                    console.error(`${collectionName} 삭제 중 오류:`, error);
                }
            }
            
            // 3. 프로젝트 문서 삭제
            await deleteDoc(doc(db, "project", projectId));
            console.log("프로젝트 문서가 삭제되었습니다:", projectId);
            
            // 4. UI 업데이트
            document.querySelector(`[data-id="${projectId}"]`)?.remove();
            
            // 5. 현재 선택된 프로젝트가 삭제된 경우 UI 초기화
            if (projectId === localStorage.getItem('currentProjectId')) {
                localStorage.removeItem('currentProjectId');
                resetMainUI();
            }

            console.log("프로젝트와 관련 데이터가 모두 삭제되었습니다.");
        } catch (error) {
            console.error("프로젝트 삭제 중 오류:", error);
            alert("프로젝트 삭제에 실패했습니다.");
        }
    }
}

// 3. resetMainUI 함수 개선
function resetMainUI() {
    const isMainPage = window.location.pathname.includes('main.html');
    
    if (isMainPage) {
        UI.mainTitle.textContent = "프로젝트를 선택하세요";
        UI.projectDesc.textContent = "";
    } else {
        window.location.href = 'main.html';
    }
}

// 프로젝트 수정 처리 함수
async function handleProjectEdit(listItem, projectId) {
    try {
        const projectRef = doc(db, "project", projectId);
        const docSnap = await getDoc(projectRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            modalUtils.setValues(data.name, data.plot);
            modalUtils.open();
            
            // 이벤트 리스너 설정을 위한 버튼 참조
            const confirmButton = document.getElementById("pModalApply");
            const cancelButton = document.getElementById("pModalClose");
            
            // 이벤트 리스너 제거
            const newConfirmButton = confirmButton.cloneNode(true);
            const newCancelButton = cancelButton.cloneNode(true);
            
            if (confirmButton.parentNode && cancelButton.parentNode) {
                confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
                cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
            }
            
            // 닫기 버튼 이벤트
            newCancelButton.addEventListener('click', () => {
                modalUtils.close();
            });
            
            // 수정 확인 버튼 이벤트
            newConfirmButton.addEventListener('click', async () => {
                const newName = projectNameInput.value.trim();
                const newPlot = projectPlotInput.value.trim();
                
                if (newName && newPlot) {
                    if (newName.length > 50) {
                        alert("프로젝트 이름은 50자를 초과할 수 없습니다.");
                        return;
                    }

                    try {
                        await updateDoc(projectRef, {
                            name: newName,
                            plot: newPlot,
                            lastModified: new Date()
                        });
                        
                        modalUtils.close();
                        projectNameInput.value = '';
                        projectPlotInput.value = '';
                        
                        console.log("프로젝트가 수정되었습니다.");
                    } catch (error) {
                        console.error("프로젝트 수정 중 오류:", error);
                        alert("프로젝트 수정에 실패했습니다.");
                    }
                } else {
                    alert("모든 필드를 입력해주세요.");
                }
            });
        }
    } catch (error) {
        console.error("프로젝트 데이터 로드 중 오류:", error);
        alert("프로젝트 데이터를 불러올 수 없습니다.");
    }
}

// 프로젝트 리스트 상태 체크 함수 통합
function updateProjectListStatus() {
    const projectList = document.querySelector('.project-list');
    const projectContainer = document.getElementById('projectContainer');
    const hasProjects = projectList.children.length > 0;
    handleAddBtnMsg(!hasProjects, projectContainer);
}
