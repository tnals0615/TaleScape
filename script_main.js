import { db, addDoc, collection, getDoc, doc, onSnapshot, query, orderBy, where, updateDoc, deleteDoc, getDocs } from "./firebase.js";

// 전역 변수
let projectCount = 0;
let projectId = "";

document.addEventListener('DOMContentLoaded', async () => {
    // 현재 페이지가 main.html인지 확인
    const isMainPage = window.location.pathname.includes('main.html');
    
    // 저장된 projectId 복원
    const savedProjectId = localStorage.getItem('currentProjectId');
    if (savedProjectId) {
        try {
            const projectRef = doc(db, "project", savedProjectId);
            const docSnap = await getDoc(projectRef);

            if (docSnap.exists()) {
                projectId = savedProjectId;
                
                // main.html 페이지일 때만 UI 업데이트 시도
                if (isMainPage) {
                    const mainTitle = document.querySelector('.main-title');
                    const projectDesc = document.querySelector('.project-desc');
                    const accordion = document.querySelector('.accordion');
                    const chapterTable = document.querySelector('.chapter-table');
                    
                    if (mainTitle && projectDesc && accordion && chapterTable) {
                        const data = docSnap.data();
                        
                        // UI 업데이트
                        mainTitle.textContent = data.name || "프로젝트 이름 없음";
                        projectDesc.textContent = data.plot || "설명 없음";

                        // 프로젝트 리스트에서 해당 프로젝트 활성화
                        const projectItem = document.querySelector(`[data-id="${savedProjectId}"]`);
                        if (projectItem) {
                            projectItem.classList.add('active');
                        }

                        // 데이터 로드
                        loadMemoData();
                        loadCharacterData();
                        loadWorldBuildingData();
                        loadEpisodeData();

                        // 아코디언 섹션 표시
                        accordion.style.display = 'block';
                        chapterTable.style.display = 'block';
                    }
                }
            }
        } catch (error) {
            console.error("저장된 프로젝트 데이터 로드 중 오류:", error);
            localStorage.removeItem('currentProjectId');  // 잘못된 projectId 제거
        }
    }
    
    // 이벤트 리스너는 main.html 페이지일 때만 초기화
    if (isMainPage) {
        initEventListeners();
    }
});

// 이벤트 리스너 초기화
function initEventListeners() {
    // 프로젝트 관련
    //document.querySelector('.icon-plus').addEventListener('click', handleAddProject);
    //document.querySelector('#projectModal .btn-primary').addEventListener('click', handleProjectSubmit);
    //document.getElementById('projectModal').addEventListener('hidden.bs.modal', handleProjectModalHidden);

    const projectList = document.querySelector(".project-list");
    projectList.addEventListener("click", async (event) => {
        const target = event.target;

        if (target.tagName === "LI") {
            // 이전에 선택된 프로젝트의 활성 상태 제거
            document.querySelectorAll('.project-list li').forEach(li => {
                li.classList.remove('active');
            });
            
            // 클릭된 프로젝트 활성화
            target.classList.add('active');
            
            projectId = target.getAttribute("data-id"); // Firestore ID 가져오기
            console.log("Selected Project ID:", projectId); // 프로젝트 ID 확인

            if (projectId) {
                try {
                    // 프로젝트 기본 정보 가져오기
                    const projectRef = doc(db, "project", projectId);
                    const docSnap = await getDoc(projectRef);

                    if (docSnap.exists()) {
                        const projectData = docSnap.data();
                        
                        // 프로젝트 제목과 설명 업데이트
                        document.querySelector('.main-title').textContent = projectData.name || "프로젝트 이름 없음";
                        document.querySelector('.project-desc').textContent = projectData.plot || "설명 없음";

                        // 관련 데이터 로드
                        loadMemoData();
                        loadCharacterData();
                        loadWorldBuildingData();
                        loadEpisodeData();

                        // 아코디언 섹션 표시
                        document.querySelector('.accordion').style.display = 'block';
                        document.querySelector('.chapter-table').style.display = 'block';

                    } else {
                        console.log("프로젝트를 찾을 수 없습니다!");
                        alert("프로젝트 데이터를 불러올 수 없습니다.");
                    }
                } catch (error) {
                    console.error("프로젝트 데이터 로드 중 오류 발생:", error);
                    alert("프로젝트 데이터를 불러오는 중 문제가 발생했습니다.");
                }
            }
        }
    });


    // 챕터 관련 - 단순화
    document.querySelector('#addChapterBtn').addEventListener('click', () => {
        if (!projectId) {
            alert("프로젝트를 먼저 선택해주세요.");
            return;
        }
        const chapterModal = new bootstrap.Modal(document.getElementById('chapterModal'));
        
        // 기존 이벤트 리스너 제거 후 새로 연결
        const confirmBtn = document.querySelector('.confirm-chapter-btn');
        confirmBtn.onclick = null;  // 기존 이벤트 제거
        confirmBtn.onclick = handleConfirmChapter;  // 새 이벤트 연결
        
        // 모달 초기화
        resetChapterModal();
        
        chapterModal.show();
    });

    // 메모, 캐릭터, 세계관 관련
    document.querySelector('#memoSection .btn').addEventListener('click', () => {
        if (!projectId) {
            alert("프로젝트를 먼저 선택해주세요.");
            return;
        }
        const memoModal = new bootstrap.Modal(document.getElementById('memoModal'));
        
        // 기존 이벤트 리스너 제거 후 새로 연결
        const confirmBtn = document.querySelector('.confirm-memo-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirmMemo);
        
        memoModal.show();
    });

    document.querySelector('#characterSection .btn').addEventListener('click', () => {
        if (!projectId) {
            alert("프로젝트를 먼저 선택해주세요.");
            return;
        }
        const characterModal = new bootstrap.Modal(document.getElementById('characterModal'));
        
        // 기존 이벤트 리스너 제거 후 새로 연결
        const confirmBtn = document.querySelector('.confirm-character-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirmCharacter);
        
        characterModal.show();
    });

    document.querySelector('#worldSection .btn').addEventListener('click', () => {
        if (!projectId) {
            alert("프로젝트를 먼저 선택해주세요.");
            return;
        }
        const worldModal = new bootstrap.Modal(document.getElementById('worldModal'));
        
        // 기존 이벤트 리스너 제거 후 새로 연결
        const confirmBtn = document.querySelector('.confirm-world-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirmWorld);
        
        worldModal.show();
    });

    // 테그 입력 처리
    document.getElementById('characterTagInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tagText = this.value.trim();
            if (tagText) {
                const tagElement = document.createElement('span');
                tagElement.className = 'character-tag';
                tagElement.innerHTML = `#${tagText} <span class="remove-tag">×</span>`;
                
                tagElement.querySelector('.remove-tag').addEventListener('click', function() {
                    this.parentElement.remove();
                });
                
                document.getElementById('characterTags').appendChild(tagElement);
                this.value = '';
            }
        }
    });

    // 이미지 미리보기
    document.getElementById('characterImageInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('characterImagePreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="미리보기" style="max-width: 200px;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 모달 리셋 이벤트
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function () {
            // 입력값 초기화만 수행
            this.querySelectorAll('input, textarea, select').forEach(input => {
                input.value = '';
            });
            
            // 이미지 미리보기 초기화
            const imagePreview = this.querySelector('#characterImagePreview');
            if (imagePreview) {
                imagePreview.innerHTML = '';
            }
            
            // 태그 초기화
            const tagsContainer = this.querySelector('#characterTags');
            if (tagsContainer) {
                tagsContainer.innerHTML = '';
            }
        });
    });

    document.getElementById('newChapterCheck').addEventListener('change', function() {
        const chapterNameGroup = document.getElementById('chapterNameGroup');
        chapterNameGroup.style.display = this.checked ? 'block' : 'none';
    });
}

// ===============================
// 프로젝트 관련 함수들
// ===============================
function handleAddProject() {
    const modalContainer = document.getElementById('projectModalContainer');
    modalContainer.classList.remove('hidden');
}

function handleProjectSubmit() {
    const projectName = document.querySelector('#projectNameInput').value.trim();
    const projectPlot = document.querySelector('#projectPlotInput').value.trim();
    
    if (projectName) {
        createProject(projectName, projectPlot);
    }
}

function createProject(projectName, projectDesc) {
    const projectList = document.querySelector('.project-list');
    removeGuideText(projectList);
    
    const newProject = createProjectElement(projectName);
    attachProjectEvents(newProject, projectName, projectDesc);
    
    projectList.appendChild(newProject);
    closeAndResetProjectModal();

    handleProjectClick(newProject, projectName, projectDesc);
}

function createProjectElement(projectName) {
    const newProject = document.createElement('li');
    newProject.className = 'project-item';
    newProject.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span class="project-name cursor-pointer">${projectName}</span>
            <div>
                <button class="btn btn-sm btn-link edit-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-trash"></i></button>
            </div>
        </div>
    `;
    return newProject;
}

function attachProjectEvents(project, name, desc) {
    project.querySelector('.project-name').addEventListener('click', () => {
        handleProjectClick(project, name, desc);
    });
    
    project.querySelector('.delete-btn').addEventListener('click', () => {
        handleProjectDelete(project);
    });

    project.querySelector('.edit-btn').addEventListener('click', () => {
        handleProjectEdit(project, name, desc);
    });
}

function handleProjectClick(project, name, desc) {
    // 기존 선택 제거
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 새로 선택된 프로젝트 선택
    project.classList.add('active');
    projectId = project.getAttribute('data-id');
    
    // UI 업데이트 - 기존 부분이 변경되어야 함
    document.getElementById('projectName').textContent = name;
    document.getElementById('projectPlot').textContent = desc || '프로젝트의 설명이 입력되는 부분입니다.';
    
    // 데이터 로드
    loadMemoData();
    loadCharacterData();
    loadWorldBuildingData();
    loadEpisodeData();
}

function handleProjectDelete(project) {
    if (confirm('프로젝트를 삭제하시겠습니까?')) {
        project.remove();
        checkEmptyProjectList();
    }
}

function handleProjectEdit(project, name, desc) {
    const modalContainer = document.getElementById('projectModalContainer');
    document.querySelector('#projectNameInput').value = name;
    document.querySelector('#projectPlotInput').value = desc;
    modalContainer.classList.remove('hidden');
}

function removeGuideText(projectList) {
    const guideText = projectList.querySelector('.text-muted');
    if (guideText) {
        guideText.remove();
    }
}

function checkEmptyProjectList() {
    const projectList = document.querySelector('.project-list');
    if (projectList.children.length === 0) {
        const guideText = document.createElement('li');
        guideText.className = 'text-muted text-center mt-3';
        guideText.innerHTML = '<small>+ 버튼을 눌러 프젝트를 생성해주세요</small>';
        projectList.appendChild(guideText);
    }
}

function closeAndResetProjectModal() {
    const modalContainer = document.getElementById('projectModalContainer');
    modalContainer.classList.add('hidden');
    document.querySelector('#projectNameInput').value = '';
    document.querySelector('#projectPlotInput').value = '';
}

function handleProjectModalHidden() {
    this.querySelector('input').value = '';
}

// ===============================
// 챕터 관련 함수들
// ===============================
function handleAddEpisode() {
    const tbody = document.querySelector('tbody');
    const newRow = createEpisodeElement(getNextEpisodeNumber());
    attachChapterEvents(newRow);
    tbody.appendChild(newRow);
}

function createEpisodeElement(episodeNum, epiChapter = '', epiTitle = '', epiCharacter = '', epiStatus = '작성중', epiUrl = '', episodeId = '') {
    const newRow = document.createElement('tr');
    newRow.className = 'chapter-row';
    newRow.setAttribute('data-episode-number', episodeNum); // 에피소드 번호를 row에 저장

    newRow.innerHTML = `
        <td>${episodeNum}화</td>
        <td class="title-cell" episode-id="${episodeId}">${epiTitle}</td>
        <td>${epiCharacter}</td>
        <td>
            <select class="form-select form-select-sm status-select">
                <option value="작성중" ${epiStatus === '작성중' ? 'selected' : ''}>작성중</option>
                <option value="수정필요" ${epiStatus === '수정필요' ? 'selected' : ''}>수정필요</option>
                <option value="보류" ${epiStatus === '보류' ? 'selected' : ''}>보류</option>
                <option value="발행" ${epiStatus === '발행' ? 'selected' : ''}>발행</option>
            </select>
        </td>
        <td class="url-text">${epiUrl || 'url'}</td>
        <td>
            <button class="btn btn-sm btn-link edit-btn"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-trash"></i></button>
        </td>
    `;

    // 상태 변경 시 자동 저장
    const statusSelect = newRow.querySelector('.status-select');
    statusSelect.addEventListener('change', async () => {
        try {
            await updateDoc(doc(db, "episode", episodeId), {
                status: statusSelect.value
            });
            console.log("Status updated:", statusSelect.value);
        } catch (error) {
            console.error("상태 업데이트 중 오류:", error);
            alert("상태 변경에 실패했습니다.");
        }
    });

    return newRow;
}

function attachChapterEvents(row) {
    row.addEventListener('click', (e) => {
        if (!e.target.closest('button') && !e.target.closest('select')) {
            const titleCell = row.querySelector('.title-cell');
            const episodeId = titleCell?.getAttribute('episode-id');
            const episodeNumber = row.cells[0]?.textContent.replace('화', '');

            if (episodeId) {
                window.location.href = `edit.html?episode-id=${encodeURIComponent(episodeId)}&episode-number=${encodeURIComponent(episodeNumber)}`;
            }
        }
    });

    // 기존 버튼 이벤트는 그대로 유지
    row.querySelector('.edit-btn')?.addEventListener('click', () => {
        handleChapterEdit(row);
    });

    row.querySelector('.delete-btn')?.addEventListener('click', () => {
        handleChapterDelete(row);
    });
}

// 에피소드 수정 처리
function handleChapterEdit(row) {
    const chapterModal = new bootstrap.Modal(document.getElementById('chapterModal'));
    const titleCell = row.querySelector('.title-cell');
    const episodeId = titleCell?.getAttribute('episode-id');
    
    if (episodeId) {
        try {
            const docRef = doc(db, "episode", episodeId);
            getDoc(docRef).then((docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    // 모달에 데이터 채우기
                    document.getElementById('newChapterCheck').checked = data.is_new_chapter;
                    document.getElementById('chapterNameInput').value = data.chapter || '';
                    document.getElementById('chapterTitleInput').value = data.title || '';
                    document.getElementById('chapterCharacterInput').value = data.character || '';
                    document.getElementById('chapterStatusInput').value = data.status || '작성중';
                    document.getElementById('chapterUrlInput').value = data.url || '';
                    
                    // 새 챕터 체크박스에 따라 입력칸 표시/숨김
                    const chapterNameGroup = document.getElementById('chapterNameGroup');
                    chapterNameGroup.style.display = data.is_new_chapter ? 'block' : 'none';
                    
                    // 확인 버튼 이벤트 리스너
                    const confirmBtn = document.querySelector('.confirm-chapter-btn');
                    confirmBtn.onclick = async () => {
                        const isNewChapter = document.getElementById('newChapterCheck').checked;
                        const epiChapter = isNewChapter ? document.getElementById('chapterNameInput').value.trim() : '';
                        const epiTitle = document.getElementById('chapterTitleInput').value.trim();
                        const epiCharacter = document.getElementById('chapterCharacterInput').value.trim();
                        const epiStatus = document.getElementById('chapterStatusInput').value;
                        const epiUrl = document.getElementById('chapterUrlInput').value.trim();
                        
                        if (epiTitle) {
                            try {
                                await updateDoc(docRef, {
                                    is_new_chapter: isNewChapter,
                                    chapter: epiChapter,
                                    title: epiTitle,
                                    character: epiCharacter,
                                    status: epiStatus,
                                    url: epiUrl
                                });

                                console.log("Episode updated:", episodeId);
                                await loadEpisodeData();
                                
                                chapterModal.hide();
                            } catch (error) {
                                console.error("에피소드 수정 중 오류:", error);
                                alert("에피소드 수정에 실패했습니다.");
                            }
                        }
                    };
                    
                    chapterModal.show();
                }
            });
        } catch (error) {
            console.error("에피소드 데이터 로드 중 오류:", error);
            alert("에피소드 데이터를 불러오는 중 문제가 발생했습니다.");
        }
    }
}

// 에피소드 삭제 처리 함수
async function handleChapterDelete(row) {
    if (confirm('에피소드를 삭제하시겠습니까?')) {
        try {
            const titleCell = row.querySelector('.title-cell');
            const episodeId = titleCell?.getAttribute('episode-id');
            
            if (episodeId) {
                await handleDelete("episode", episodeId);
            }
        } catch (error) {
            console.error("에피소드 삭제 중 오류:", error);
            alert("에피소드 삭제에 실패했습니다.");
        }
    }
}

// ===============================
// 메모 관련 함수들
// ===============================
function handleAddMemo() {
    const memoModal = new bootstrap.Modal(document.getElementById('memoModal'));
    document.getElementById('memoInput').value = '';
    memoModal.show();
}

// 메모 추가 처리 함수
async function handleConfirmMemo() {
    console.log("Adding memo with projectId:", projectId);
    
    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }

    const titleInput = document.getElementById('memoTitleInput');
    const contentInput = document.getElementById('memoContentInput');
    
    const memoTitle = titleInput.value.trim();
    const memoContent = contentInput.value.trim();

    if (memoContent) {
        try {
            const docRef = await addDoc(collection(db, "memo"), {
                project_id: projectId,
                title: memoTitle,
                content: memoContent,
                createdAt: new Date()
            });

            console.log("Memo added with ID:", docRef.id);
            
            // 입력 필드 초기화
            titleInput.value = '';
            contentInput.value = '';
            
            // 모달 닫기
            const modal = bootstrap.Modal.getInstance(document.getElementById('memoModal'));
            modal.hide();

            // 메모 목록 새로고침
            await loadMemoData();
        } catch (error) {
            console.error("메모 추가 중 오류:", error);
            alert("메모 추가에 실패했습니다.");
        }
    } else {
        alert("메모 내용을 입력해주세요.");
    }
}

function createMemoElement(memoId, memoTitle, memoContent) {
    const memoElement = document.createElement('div');
    memoElement.className = 'memo-item';
    memoElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                ${memoTitle ? `<h6 class="memo-title">${memoTitle}</h6>` : ''}
                <div class="memo-content">${memoContent}</div>
            </div>
            <div>
                <button class="btn btn-sm btn-link edit-memo-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
    `;

    // 수정 버튼 클릭 이벤트
    memoElement.querySelector('.edit-memo-btn').addEventListener('click', async () => {
        try {
            const docRef = doc(db, "memo", memoId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // 모달 초기화 전에 기존 데이터 설정
                const titleInput = document.getElementById('memoTitleInput');
                const contentInput = document.getElementById('memoContentInput');
                
                titleInput.value = data.title || '';
                contentInput.value = data.content || '';
                
                // 모달 표시
                const memoModal = new bootstrap.Modal(document.getElementById('memoModal'));
                
                // 기존 이벤트 리스너 제거 후 새로 연결
                const confirmBtn = document.querySelector('.confirm-memo-btn');
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                
                newConfirmBtn.addEventListener('click', async () => {
                    const newTitle = titleInput.value.trim();
                    const newContent = contentInput.value.trim();
                    
                    if (newTitle && newContent) {
                        try {
                            await updateDoc(docRef, {
                                title: newTitle,
                                content: newContent,
                                lastModified: new Date()
                            });
                            
                            memoModal.hide();
                            await loadMemoData();
                        } catch (error) {
                            console.error("메모 수정 중 오류:", error);
                            alert("메모 수정에 실패했습니다.");
                        }
                    }
                });
                
                memoModal.show();
            }
        } catch (error) {
            console.error("메모 데이터 로드 중 오류:", error);
            alert("메모 데이터를 불러올 수 없습니다.");
        }
    });

    // 삭제 버튼 클릭 이벤트
    memoElement.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm('메모를 삭제하시겠습니까?')) {
            handleDelete("memo", memoId);
        }
    });

    return memoElement;
}

function attachMemoEvents(memo, memoId) {
    memo.querySelector('.edit-memo-btn').addEventListener('click', () => {
        handleMemoEdit(memo);
    });

    memo.querySelector('.delete-btn').addEventListener('click', () => {
        handleDelete("memo", memoId);
    });
}

function handleMemoEdit(memo) {
    const memoModal = new bootstrap.Modal(document.getElementById('memoModal'));
    const title = memo.querySelector('.memo-title')?.textContent || '';
    const content = memo.querySelector('.memo-content').textContent;
    
    document.getElementById('memoTitleInput').value = title;
    document.getElementById('memoInput').value = content;
    memoModal.show();

    const confirmBtn = document.querySelector('.confirm-memo-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        updateMemo(memo);
    });
}

function updateMemo(memo) {
    const title = document.getElementById('memoTitleInput').value.trim();
    const content = document.getElementById('memoInput').value.trim();
    
    if (content) {
        const newMemo = createMemoElement(title, content);
        memo.replaceWith(newMemo);
        closeModal('memoModal');
    }
}

// ===============================
// 캐릭터 관련 함수들
// ===============================
function handleAddCharacter() {
    const characterModal = new bootstrap.Modal(document.getElementById('characterModal'));
    resetCharacterModal();
    characterModal.show();
}

// 캐릭터 추가 처리 함수
async function handleConfirmCharacter() {
    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }

    const characterName = document.getElementById('characterNameInput').value.trim();
    const characterProfile = document.getElementById('characterProfileInput').value.trim();
    const characterDesc = document.getElementById('characterDescInput').value.trim();
    const characterTags = Array.from(document.getElementById('characterTags').children)
        .map(tag => tag.textContent.replace('×', '').trim());
    const characterImageUrl = document.getElementById('characterImagePreview').querySelector('img')?.src || '';

    if (characterName) {
        try {
            const docRef = await addDoc(collection(db, "character"), {
                project_id: projectId,
                name: characterName,
                profile: characterProfile,
                desc: characterDesc,
                tags: characterTags,
                imageUrl: characterImageUrl,
                createdAt: new Date()
            });

            console.log("Character added successfully:", docRef.id);
            loadCharacterData();  // 캐릭터 목록 새로고침
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('characterModal'));
            modal.hide();
        } catch (error) {
            console.error("캐릭터 추가 중 오류 발생:", error);
            alert("캐릭터를 추가하는 중 문제가 발생했습니다.");
        }
    }
}

function createCharacterElement(characterId, name, profile, desc, tags, imageUrl) {
    const newCharacter = document.createElement('div');
    newCharacter.className = 'character-item';
    newCharacter.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h6 class="character-name">${name}</h6>
                ${imageUrl ? `
                    <div class="character-image mb-2">
                        <img src="${imageUrl}" alt="${name}">
                    </div>
                ` : ''}
                <div class="character-content">
                    ${profile ? `<div class="character-profile mb-2">${profile.replace(/\n/g, '<br>')}</div>` : ''}
                    ${desc ? `<div class="character-desc mb-2">${desc.replace(/\n/g, '<br>')}</div>` : ''}
                    <div class="character-tags">
                        ${tags.map(tag => `<span class="character-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div>
                <button class="btn btn-sm btn-link edit-character-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
    `;
    attachCharacterEvents(newCharacter, characterId);
    return newCharacter;
}

function attachCharacterEvents(character, characterId) {
    character.querySelector('.edit-character-btn').addEventListener('click', () => {
        handleCharacterEdit(characterId);
    });

    character.querySelector('.delete-btn').addEventListener('click', () => {
        handleDelete("character", characterId);
    });
}

function handleCharacterEdit(characterId) {
    const characterModal = new bootstrap.Modal(document.getElementById('characterModal'));

    // Firestore에서 캐릭터 데이터 가져오기
    const docRef = doc(db, "character", characterId);

    getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();

            // 입력 필요 Firestore 데이터 채우기
            document.getElementById('characterNameInput').value = data.name || '';
            document.getElementById('characterProfileInput').value = data.profile || '';
            document.getElementById('characterDescInput').value = data.desc || '';
            
            // 태그 채우기
            const tagsContainer = document.getElementById('characterTags');
            tagsContainer.innerHTML = (data.tags || [])
                .map(tag => `<span class="character-tag">${tag} <span class="remove-tag">×</span></span>`)
                .join('');
            tagsContainer.querySelectorAll('.remove-tag').forEach(tag =>
                tag.addEventListener('click', function () {
                    this.parentElement.remove();
                })
            );

            // 이미지 미리보기 설정
            const previewContainer = document.getElementById('characterImagePreview');
            previewContainer.innerHTML = data.imageUrl
                ? `<img src="${data.imageUrl}" alt="미리보기" style="max-width: 200px;">`
                : '';

            // 모달 표시
            characterModal.show();
        } else {
            console.error("해당 캐릭터 데이터를 찾을 수 없습니다.");
            alert("캐릭터 데이터를 불러오는 중 문제가 발생했습니다.");
        }
    }).catch((error) => {
        console.error("Firestore에서 캐릭터 데이터 가져오기 중 오류 발생:", error);
        alert("캐릭터 데이터를 불러오는 중 오류가 발생했습니다.");
    });

    // 확인 버튼 이벤트 설정
    const confirmBtn = document.querySelector('.confirm-character-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true); // 기존 이벤트 제거용 복제
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
        const updatedData = {
            name: document.getElementById('characterNameInput').value.trim(),
            profile: document.getElementById('characterProfileInput').value.trim(),
            desc: document.getElementById('characterDescInput').value.trim(),
            tags: Array.from(document.getElementById('characterTags').children).map(tag =>
                tag.textContent.replace('×', '').trim()
            ),
            imageUrl: document.getElementById('characterImagePreview').querySelector('img')?.src || '',
        };

        if (updatedData.name) {
            try {
                // Firestore 업데이트
                await updateDoc(docRef, updatedData);

                console.log(`Character with ID: ${characterId} has been updated.`);
                alert("캐릭터가 성공적으로 수정되었습니다.");
                closeModal('characterModal'); // 달 닫기
            } catch (error) {
                console.error("캐릭터 수정 중 오류 발생:", error);
                alert("캐릭터 수정에 실패했습니다.");
            }
        } else {
            alert("캐릭터 이름은 필수 항목입니다.");
        }
    });
}

function resetCharacterModal() {
    document.getElementById('characterNameInput').value = '';
    document.getElementById('characterProfileInput').value = '';
    document.getElementById('characterDescInput').value = '';
    document.getElementById('characterTags').innerHTML = '';
    document.getElementById('characterImagePreview').innerHTML = '';
    document.getElementById('characterImageInput').value = '';
}

// ===============================
// 세계관 관련 함수들
// ===============================
function handleAddWorld() {
    const worldModal = new bootstrap.Modal(document.getElementById('worldModal'));
    resetWorldModal();
    worldModal.show();
}

// 세계관 추가 처리 함수
async function handleConfirmWorld() {
    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }

    const worldTitle = document.getElementById('worldTitleInput').value.trim();
    const worldContent = document.getElementById('worldContentInput').value.trim();

    if (worldTitle && worldContent) {
        try {
            const docRef = await addDoc(collection(db, "worldBuilding"), {
                project_id: projectId,
                title: worldTitle,
                content: worldContent,
                createdAt: new Date()
            });

            console.log("World Building added successfully:", docRef.id);
            loadWorldBuildingData();  // 세계관 목록 새로고침
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('worldModal'));
            modal.hide();
        } catch (error) {
            console.error("세계관 추가 중 오류 발생:", error);
            alert("세계관을 추가하는 중 문제가 발생했습니다.");
        }
    }
}

function createWorldElement( worldId, title, content) {
    const newWorld = document.createElement('div');
    newWorld.className = 'world-item';
    newWorld.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h6 class="world-title">${title}</h6>
                <div class="world-content">${content}</div>
            </div>
            <div>
                <button class="btn btn-sm btn-link edit-world-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
    `;
    attachWorldEvents(newWorld, worldId);
    return newWorld;
}

function attachWorldEvents(world, worldId) {
    world.querySelector('.edit-world-btn').addEventListener('click', () => {
        handleWorldEdit(worldId);
    });

    world.querySelector('.delete-btn').addEventListener('click', () => {
        handleDelete("worldBuilding", worldId);
    });
}

function handleWorldEdit(worldId) {
    const worldModal = new bootstrap.Modal(document.getElementById('worldModal'));

    // Firestore에서 기존 이터 가져오기
    const docRef = doc(db, "worldBuilding", worldId);

    getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();

            // 모달에 데이터 채우기
            document.getElementById('worldTitleInput').value = data.title || '';
            document.getElementById('worldContentInput').value = data.content || '';

            // 모달 표시
            worldModal.show();

            // 확인 버튼 이벤트 설정
            const confirmBtn = document.querySelector('.confirm-world-btn');
            const newConfirmBtn = confirmBtn.cloneNode(true); // 기존 이벤트 제거용 복제
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

            newConfirmBtn.addEventListener('click', async () => {
                const title = document.getElementById('worldTitleInput').value.trim();
                const content = document.getElementById('worldContentInput').value.trim();

                if (title && content) {
                    try {
                        // Firestore 데이터 업데이트
                        await updateDoc(docRef, { title, content });

                        console.log(`World with ID: ${worldId} has been updated.`);
                        alert("세계관 성공적으로 수정었습니다.");

                        // 모달 닫기
                        closeModal('worldModal');
                    } catch (error) {
                        console.error("세계관 수정 중 오류 발생:", error);
                        alert("세계관 수정에 실패했습니다.");
                    }
                } else {
                    alert("제목과 내용을 모두 입력해주세요.");
                }
            });
        } else {
            console.error("해당 세계관 데이터를 찾을 수 없습니다.");
            alert("세계관 이터를 불러오는 중 문제가 발생했습니다.");
        }
    }).catch((error) => {
        console.error("Firestore에서 세계관 데이터 가져오기 중 오류 발생:", error);
        alert("세계관 이터를 불러오는 중 오류가 발생했습니다.");
    });
}

function resetWorldModal() {
    document.getElementById('worldTitleInput').value = '';
    document.getElementById('worldContentInput').value = '';
}

// ===============================
// 유틸리티 함수
// ===============================
function closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
}

function resetChapterModal() {
    document.getElementById('newChapterCheck').checked = false;
    document.getElementById('chapterNameGroup').style.display = 'none';  // 터 이름 입력칸 숨김
    document.getElementById('chapterTitleInput').value = '';
    document.getElementById('chapterCharacterInput').value = '';
    document.getElementById('chapterStatusInput').value = '작성중';
    document.getElementById('chapterUrlInput').value = '';
}

// 데이터 로드
function loadData(collectionName, listSelector, createElementCallback, errorMessage) {
    try {
        const q = query(
            collection(db, collectionName),
            where("project_id", "==", projectId) // 특정 project_id로 필터링
        );

        // 실시간 데이트
        onSnapshot(q, (snapshot) => {
            const listElement = document.querySelector(listSelector);
            if (!listElement) {
                console.error(`${listSelector} 요소를 찾을 수 없습니다.`);
                return;
            }

            // 기존 스 초기화 (중복 추가 방지)
            listElement.innerHTML = "";

            // 스냅샷 순회하며 데이터 추가
            snapshot.forEach((doc) => {
                const dataWithId = { id: doc.id, ...doc.data() };
                const newElement = createElementCallback(dataWithId);
                listElement.appendChild(newElement); // 화면에 요소 추가
            });

            console.log(`실시간 ${collectionName} 데이터:`, snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });
    } catch (error) {
        console.error(`데이터 로드 중 오류 발생:`, error);
        alert(errorMessage);
    }
}

export function loadMemoData() {
    console.log("Loading memos for project:", projectId); // 프로젝트 ID 확인
    
    const memoList = document.querySelector('.memo-list');
    if (!memoList) {
        console.error("Memo list element not found");
        return;
    }
    
    memoList.innerHTML = '';

    const q = query(
        collection(db, "memo"),
        where("project_id", "==", projectId)
    );

    onSnapshot(q, (snapshot) => {
        console.log("Memo snapshot:", snapshot.docs.map(doc => doc.data())); // 데이터 확인
        memoList.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const memoElement = createMemoElement(doc.id, data.title, data.content);
            memoList.appendChild(memoElement);
        });
    });
}

export function loadCharacterData() {
    const characterList = document.querySelector('.character-list');
    characterList.innerHTML = ''; // 기존 캐릭터 초기화

    const q = query(
        collection(db, "character"),
        where("project_id", "==", projectId)
    );

    onSnapshot(q, (snapshot) => {
        characterList.innerHTML = ''; // 실시간 업데이트를 위한 초기화
        snapshot.forEach((doc) => {
            const data = doc.data();
            const characterElement = createCharacterElement(
                doc.id,
                data.name,
                data.profile,
                data.desc,
                data.tags,
                data.imageUrl
            );
            characterList.appendChild(characterElement);
        });
    });
}

export function loadWorldBuildingData() {
    const worldList = document.querySelector('.world-list');
    worldList.innerHTML = ''; // 기존 세계관 초기화

    const q = query(
        collection(db, "worldBuilding"),
        where("project_id", "==", projectId)
    );

    onSnapshot(q, (snapshot) => {
        worldList.innerHTML = ''; // 실시간 업데이트를 위한 초기화
        snapshot.forEach((doc) => {
            const data = doc.data();
            const worldElement = createWorldElement(doc.id, data.title, data.content);
            worldList.appendChild(worldElement);
        });
    });
}

export function loadEpisodeData() {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    const q = query(
        collection(db, "episode"),
        where("project_id", "==", projectId)
    );

    onSnapshot(q, (snapshot) => {
        tbody.innerHTML = '';
        let episodeNum = 1;  // 순차적인 번호 부여를 위한 변수
        let chapterNum = 1;
        let currentChapter = '';

        // 데이터를 배열로 변환하여 createdAt 기준으로 정렬
        const episodes = snapshot.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

        episodes.forEach((data) => {
            // 새 챕터인 경우 구분선 추가
            if (data.is_new_chapter && data.chapter && data.chapter !== currentChapter) {
                const dividerRow = document.createElement('tr');
                dividerRow.className = 'chapter-divider';
                dividerRow.innerHTML = `
                    <td colspan="4">챕터 ${chapterNum++}: ${data.chapter}</td>
                    <td colspan="2" class="text-end chapter-actions">
                        <button class="btn btn-sm btn-link edit-chapter-btn"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-link delete-chapter-btn"><i class="bi bi-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(dividerRow);
                currentChapter = data.chapter;

                // 챕터 수정/삭제 버튼에 이벤트 리스너 추가
                dividerRow.querySelector('.edit-chapter-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleChapterNameEdit(data.id, data.chapter);
                });
                dividerRow.querySelector('.delete-chapter-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleChapterNameDelete(data.id, data.chapter);
                });
            }

            // 에피소드 번호 정: 기존 번호가 있면 사용, 없으면 차 번호 부여
            const currentEpisodeNum = data.episode_number || episodeNum++;
            
            const episodeElement = createEpisodeElement(
                currentEpisodeNum,
                data.chapter,
                data.title,
                data.character,
                data.status,
                data.url,
                data.id
            );
            tbody.appendChild(episodeElement);
            attachChapterEvents(episodeElement);
        });
    });
}


async function handleDelete(collectionName, id) {
    try {
        const docRef = doc(db, collectionName, id);

        // 문서 삭제
        await deleteDoc(docRef);
        console.log(`${collectionName} 문서가 성공적으로 삭제되었습니다.`);

        // 에피소드인 경우 번호 재정렬
        if (collectionName === "episode") {
            await reorderEpisodes();
        } else {
            // 다른 컬렉션의 경우 기존 로직대로 처리
            if (collectionName === "memo") await loadMemoData();
            else if (collectionName === "character") await loadCharacterData();
            else if (collectionName === "worldBuilding") await loadWorldBuildingData();
        }
    } catch (error) {
        console.error(`${collectionName} 삭제 중 오류 발생:`, error);
        alert(`${collectionName} 항목 삭제에 실패했습니다.`);
    }
}

async function handleConfirmChapter() {
    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }

    const isNewChapter = document.getElementById('newChapterCheck').checked;
    const epiChapter = isNewChapter ? document.getElementById('chapterNameInput').value.trim() : '';
    const epiTitle = document.getElementById('chapterTitleInput').value.trim();
    const epiCharacter = document.getElementById('chapterCharacterInput').value.trim();
    const epiStatus = document.getElementById('chapterStatusInput').value;
    const epiUrl = document.getElementById('chapterUrlInput').value.trim();
    
    if (epiTitle) {
        try {
            const q = query(
                collection(db, "episode"),
                where("project_id", "==", projectId)
            );
            const querySnapshot = await getDocs(q);
            let maxEpisodeNumber = 0;
            
            querySnapshot.forEach((doc) => {
                const episodeNumber = doc.data().episode_number || 0;
                maxEpisodeNumber = Math.max(maxEpisodeNumber, episodeNumber);
            });

            const docRef = await addDoc(collection(db, "episode"), {
                project_id: projectId,
                is_new_chapter: isNewChapter,
                chapter: epiChapter,
                title: epiTitle,
                character: epiCharacter,
                status: epiStatus,
                url: epiUrl,
                episode_number: maxEpisodeNumber + 1,
                createdAt: new Date()
            });

            console.log("Episode added with ID:", docRef.id);
            await loadEpisodeData();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('chapterModal'));
            modal.hide();

            resetChapterModal();
        } catch (error) {
            console.error("에피소드 추가 중 오류:", error);
            alert("에피소드를 추가하는 중 문제가 발생했습니다.");
        }
    }
}

// 챕터 이름 수정 함수
async function handleChapterNameEdit(episodeId, currentChapterName) {
    const newChapterName = prompt('챕터 이름을 입력하세요:', currentChapterName);
    if (newChapterName !== null && newChapterName.trim() !== '') {
        try {
            await updateDoc(doc(db, "episode", episodeId), {
                chapter: newChapterName.trim()
            });
            console.log("Chapter name updated:", newChapterName);
            await loadEpisodeData();
        } catch (error) {
            console.error("챕터 이름 수정 중 오류:", error);
            alert("챕터 이름 수정에 실패했습니다.");
        }
    }
}

// 챕터 삭제 함수 (챕터만 삭제하고 에피소드는 유지)
async function handleChapterNameDelete(episodeId, chapterName) {
    if (confirm(`"${chapterName}" 챕터를 삭제하시겠습니까? (에피소드는 유지됩니다)`)) {
        try {
            // 해당 챕터의 모든 에피소드 찾기
            const q = query(
                collection(db, "episode"),
                where("project_id", "==", projectId),
                where("chapter", "==", chapterName)
            );
            
            const snapshot = await getDocs(q);
            
            // 모든 에피소드의 챕터 정보 제거
            const updatePromises = snapshot.docs.map(doc => 
                updateDoc(doc.ref, {
                    is_new_chapter: false,
                    chapter: ''
                })
            );
            await Promise.all(updatePromises);
            
            console.log("Chapter removed (episodes preserved)");
            await loadEpisodeData();
        } catch (error) {
            console.error("챕터 삭제 중 오류:", error);
            alert("챕터 삭제에 실패했습니다.");
        }
    }
}

// 에피소드 번호 재정렬 함수
async function reorderEpisodes() {
    try {
        // 현재 프로젝트의 모든 에피소드를 가져와서 정렬
        const q = query(
            collection(db, "episode"),
            where("project_id", "==", projectId)
        );
        const querySnapshot = await getDocs(q);
        
        // createdAt 기준으로 정렬
        const episodes = querySnapshot.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

        // 순차적으로 번호 재할당
        const updatePromises = episodes.map((episode, index) => 
            updateDoc(doc(db, "episode", episode.id), {
                episode_number: index + 1
            })
        );

        await Promise.all(updatePromises);
        console.log("에피소드 번호가 재정렬되었습니다.");
        
        // 데이터 새로고침
        await loadEpisodeData();
    } catch (error) {
        console.error("에피소드 번호 재정렬 중 오류:", error);
    }
}


