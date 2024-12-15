import { db, addDoc, collection, getDoc, doc, onSnapshot, query, orderBy, where, updateDoc, deleteDoc } from "./firebase.js";

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
        
        // 모달 열기 전에 이벤트 리스너 연결
        const confirmBtn = document.querySelector('.confirm-chapter-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirmChapter);
        
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

function getNextEpisodeNumber() {
    const tbody = document.querySelector('tbody');
    return tbody.querySelectorAll('.chapter-row').length + 1;
}

function createEpisodeElement(episodeNum, epiChapter = '', epiTitle = '', epiCharacter = '', epiStatus = '작성중', epiUrl = '', episodeId = '') {
    const newRow = document.createElement('tr');
    newRow.className = 'chapter-row';
    newRow.style.cursor = 'pointer';
    newRow.innerHTML = `
        <td>${episodeNum}화</td>
        <td class="title-cell">${epiTitle}</td>
        <td>${epiCharacter}</td>
        <td>
            <select class="form-select form-select-sm">
                <option ${epiStatus === '작성중' ? 'selected' : ''}>작성중</option>
                <option ${epiStatus === '수정필요' ? 'selected' : ''}>수정필요</option>
                <option ${epiStatus === '보류' ? 'selected' : ''}>보류</option>
                <option ${epiStatus === '발행' ? 'selected' : ''}>발행</option>
            </select>
        </td>
        <td><button class="btn btn-sm btn-link url-btn">${epiUrl || 'url'}</button></td>
        <td>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-link edit-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-x-lg"></i></button>
            </div>
        </td>
    `;

    // "episode-id" 속성 부여
    const titleCell = newRow.querySelector('.title-cell');
    if (titleCell && episodeId) {
        titleCell.setAttribute('episode-id', episodeId);
    }

    return newRow;
}
function attachChapterEvents(row) {
    // 행 ��릭 이벤트
    row.addEventListener('click', (e) => {
        // 버튼이나 select 릭 시에는 이동하지 않음
        if (!e.target.closest('button') && !e.target.closest('select')) {
            // title-cell의 episode-id 성 가오기
            const titleCell = row.querySelector('.title-cell');
            const episodeId = titleCell?.getAttribute('episode-id');

            if (episodeId) {
                // edit.html로 episodeId를 쿼리 파라미터 전달
                window.location.href = `edit.html?episode-id=${encodeURIComponent(episodeId)}`;
            }
        }
    });


    // 기존 버튼 이벤트
    row.querySelector('.edit-btn').addEventListener('click', () => {
        handleChapterEdit(row);
    });

    row.querySelector('.delete-btn').addEventListener('click', () => {
        handleChapterDelete(row);
    });
}

function handleChapterEdit(row) {
    const chapterModal = new bootstrap.Modal(document.getElementById('chapterModal'));
    
    document.getElementById('chapterTitleInput').value = row.cells[1].textContent;
    document.getElementById('chapterCharacterInput').value = row.cells[2].textContent;
    document.getElementById('chapterStatusInput').value = row.querySelector('select').value;
    document.getElementById('chapterUrlInput').value = row.querySelector('.url-btn').textContent;
    
    chapterModal.show();

    const confirmBtn = document.querySelector('.confirm-chapter-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        updateChapter(row);
    });
}

function updateChapter(row) {
    const title = document.getElementById('chapterTitleInput').value.trim();
    const character = document.getElementById('chapterCharacterInput').value.trim();
    const status = document.getElementById('chapterStatusInput').value;
    const url = document.getElementById('chapterUrlInput').value.trim();
    const isNewChapter = document.getElementById('newChapterCheck').checked;
    const chapterName = document.getElementById('chapterNameInput').value.trim();

    if (title) {
        const tbody = document.querySelector('tbody');
        
        if (isNewChapter) {
            // 새 챕터 구분선을 현재 행 앞에 추가
            const nextChapterNum = tbody.querySelectorAll('.chapter-divider').length + 1;
            const dividerRow = createChapterDivider(nextChapterNum, chapterName);
            row.parentNode.insertBefore(dividerRow, row);
        }

        // 행 내용 업데이트
        row.cells[1].textContent = title;
        row.cells[2].textContent = character;
        row.querySelector('select').value = status;
        row.querySelector('.url-btn').textContent = url || 'url';
        
        updateChapterNumbers(); // 터 번호 업데트
        closeModal('chapterModal');
    }
}

async function handleChapterDelete(row) {
    if (confirm('이 화를 삭제하시겠습니까?')) {
        const titleCell = row.querySelector('.title-cell');
        const episodeId = titleCell?.getAttribute('episode-id');
        
        if (episodeId) {
            try {
                await deleteDoc(doc(db, "episode", episodeId));
                console.log("Episode deleted:", episodeId);
                row.remove();
                updateChapterNumbers();
            } catch (error) {
                console.error("에피소드 삭제 중 오류:", error);
                alert("에피소드 삭제에 실패했습니다.");
            }
        }
    }
}

function updateChapterNumbers() {
    const tbody = document.querySelector('tbody');
    let currentChapter = 1;
    let episodeInChapter = 1;
    
    tbody.querySelectorAll('tr').forEach(row => {
        if (row.classList.contains('chapter-divider')) {
            const currentText = row.querySelector('td').textContent;
            const chapterName = currentText.includes(':') ? ': ' + currentText.split(':')[1].trim() : '';
            row.querySelector('td').textContent = `챕터 ${currentChapter}${chapterName}`;
            currentChapter++;
            episodeInChapter = 1;
        } else {
            row.cells[0].textContent = `${episodeInChapter}화`;
            episodeInChapter++;
        }
    });
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
    console.log("Adding memo with projectId:", projectId); // 디버깅용

    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }

    const memoTitle = document.getElementById('memoTitleInput').value.trim();
    const memoContent = document.getElementById('memoInput').value.trim();

    if (memoContent) {
        try {
            const docRef = await addDoc(collection(db, "memo"), {
                project_id: projectId,
                title: memoTitle,
                content: memoContent,
                createdAt: new Date()
            });

            console.log("Memo added with ID:", docRef.id);
            loadMemoData();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('memoModal'));
            modal.hide();
        } catch (error) {
            console.error("메모 추가 중 오류:", error);
            alert("메모를 추가하는 중 문제가 발생했습니다.");
        }
    }
}

function createMemoElement(memoId, memoTitle, memoContent) {
    const newMemo = document.createElement('div');
    newMemo.className = 'memo-item';
    newMemo.innerHTML = `
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
    attachMemoEvents(newMemo, memoId);
    return newMemo;
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

/*
function handleMemoDelete(memo) {
    if (confirm('메모를 삭제하시겠습니까?')) {
        memo.remove();
    }
}
*/

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
        alert("프로��트를 먼저 선택해주세요.");
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
            console.error("캐릭터 추가 중 오��� 발생:", error);
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

/*

function handleCharacterEdit(character) {
    const characterModal = new bootstrap.Modal(document.getElementById('characterModal'));
    
    // 현재 데이터 불러오기
    const name = character.querySelector('.character-name').textContent;
    const profile = character.querySelector('.character-profile')?.innerHTML.replace(/<br>/g, '\n') || '';
    const desc = character.querySelector('.character-desc')?.innerHTML.replace(/<br>/g, '\n') || '';
    const tags = Array.from(character.querySelectorAll('.character-tag')).map(tag => 
        tag.textContent.replace('#', '').trim()
    );
    const imageUrl = character.querySelector('.character-image img')?.src;

    // 모달에 데이터 설정
    document.getElementById('characterNameInput').value = name;
    document.getElementById('characterProfileInput').value = profile;
    document.getElementById('characterDescInput').value = desc;
    
    // 태그 설
    const tagsContainer = document.getElementById('characterTags');
    tagsContainer.innerHTML = '';
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'character-tag';
        tagElement.innerHTML = `#${tag} <span class="remove-tag">×</span>`;
        tagElement.querySelector('.remove-tag').addEventListener('click', function() {
            this.parentElement.remove();
        });
        tagsContainer.appendChild(tagElement);
    });

    // 이미지 미리보기 설정
    if (imageUrl) {
        document.getElementById('characterImagePreview').innerHTML = 
            `<img src="${imageUrl}" alt="미리보기" style="max-width: 200px;">`;
    }

    // 기 확인 버튼 이벤트 리스너를 모두 제거하고 새로운 버튼로 체
    const confirmBtn = document.querySelector('.confirm-character-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // 수정용 이벤트 리스너 추가
    newConfirmBtn.addEventListener('click', () => {
        const updatedCharacter = createCharacterElement(
            document.getElementById('characterNameInput').value.trim(),
            document.getElementById('characterProfileInput').value.trim(),
            document.getElementById('characterDescInput').value.trim(),
            Array.from(document.getElementById('characterTags').children).map(tag => 
                tag.textContent.replace('×', '').trim()
            ),
            document.getElementById('characterImagePreview').querySelector('img')?.src || ''
        );
        character.replaceWith(updatedCharacter);
        characterModal.hide();
    });

    characterModal.show();
}

function handleCharacterDelete(character) {
    if (confirm('캐릭터를 삭제하시겠습니까?')) {
        character.remove();
    }
}
*/

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

    // Firestore에서 기존 데이터 가져오기
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
                        alert("세계관이 성공적으로 수정었습니다.");

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
            alert("세계관 데이터를 불러오는 중 문제가 발생했습니다.");
        }
    }).catch((error) => {
        console.error("Firestore에서 세계관 데이터 가져오기 중 오류 발생:", error);
        alert("세계관 데이터를 불러오는 중 오류가 발생했습니다.");
    });
}

/*
function handleWorldEdit(world) {
    const worldModal = new bootstrap.Modal(document.getElementById('worldModal'));
    document.getElementById('worldTitleInput').value = world.querySelector('h6').textContent;
    document.getElementById('worldContentInput').value = world.querySelector('.world-content').textContent;
    worldModal.show();

    const confirmBtn = document.querySelector('.confirm-world-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        updateWorld(world);
    });
}


function updateWorld(world) {
    const title = document.getElementById('worldTitleInput').value.trim();
    const content = document.getElementById('worldContentInput').value.trim();

    if (title && content) {
        world.querySelector('h6').textContent = title;
        world.querySelector('.world-content').textContent = content;
        closeModal('worldModal');
    }
}
*/

/*
function handleWorldDelete(world) {
    if (confirm('세계관을 삭제하시겠습니까?')) {
        world.remove();
    }
}
*/

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

            // 기존 리스 초기화 (중복 추가 방지)
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
    tbody.innerHTML = ''; // 기존 에피소 초기화

    const q = query(
        collection(db, "episode"),
        where("project_id", "==", projectId)
    );

    onSnapshot(q, (snapshot) => {
        tbody.innerHTML = ''; // 실시간 업데이트를 위한 초기화
        let episodeNum = 1;
        snapshot.forEach((doc) => {
            const data = doc.data();
            const episodeElement = createEpisodeElement(
                episodeNum++,
                data.chapter,
                data.title,
                data.character,
                data.status,
                data.url,
                doc.id
            );
            tbody.appendChild(episodeElement);
            attachChapterEvents(episodeElement);
        });
    });
}


async function handleDelete(collectionName, id) {
    try {
        // Firestore에서 특정 컬렉션의 문서 참조
        const docRef = doc(db, collectionName, id);

        // 문서 삭제
        await deleteDoc(docRef);

        console.log(`${collectionName} 문서가 성적으로 삭제되었습니다.`);
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
            const docRef = await addDoc(collection(db, "episode"), {
                project_id: projectId,
                is_new_chapter: isNewChapter,
                chapter: epiChapter,
                title: epiTitle,
                character: epiCharacter,
                status: epiStatus,
                url: epiUrl,
                createdAt: new Date()
            });

            console.log("Episode added with ID:", docRef.id);
            await loadEpisodeData();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('chapterModal'));
            modal.hide();

        } catch (error) {
            console.error("에피소드 추가 중 오류:", error);
            alert("에피소드를 추가하는 중 문제가 발생했습니다.");
        }
    }
}


