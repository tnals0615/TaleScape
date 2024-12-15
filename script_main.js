// ===============================
// 초기화 관련
// ===============================
let projectCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initTheme();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        handleThemeToggle();
    }
}

// ===============================
// 이벤트 리스너 초기화
// ===============================
function initEventListeners() {
    // 프로젝트 추가 버튼
    document.querySelector('.icon-plus').addEventListener('click', handleAddProject);
    
    // 프로젝트 모달 버튼들
    document.getElementById('pModalApply').addEventListener('click', handleProjectSubmit);
    document.getElementById('pModalClose').addEventListener('click', () => {
        const modalContainer = document.getElementById('projectModalContainer');
        modalContainer.classList.add('hidden');
    });

    // 챕터 관련
    document.querySelector('#addChapterBtn').addEventListener('click', () => {
        const chapterModal = new bootstrap.Modal(document.getElementById('chapterModal'));
        resetChapterModal();
        chapterModal.show();
    });

    // 새 항목 추가 확인
    document.querySelector('.confirm-chapter-btn').addEventListener('click', () => {
        const isNewChapter = document.getElementById('newChapterCheck').checked;
        const chapterName = document.getElementById('chapterNameInput').value.trim();
        const title = document.getElementById('chapterTitleInput').value.trim();
        const character = document.getElementById('chapterCharacterInput').value.trim();
        const status = document.getElementById('chapterStatusInput').value;
        const url = document.getElementById('chapterUrlInput').value.trim();

        if (title) {
            const tbody = document.querySelector('tbody');
            
            if (isNewChapter) {
                // 새 챕터 추가
                const nextChapterNum = tbody.querySelectorAll('.chapter-divider').length + 1;
                const newDivider = createChapterDivider(nextChapterNum, chapterName);
                tbody.appendChild(newDivider);
            }

            // 새 화 추가
            const episodeNum = getNextEpisodeNumber();
            const newRow = createChapterElement(episodeNum, title, character, status, url);
            tbody.appendChild(newRow);
            attachChapterEvents(newRow);
            closeModal('chapterModal');
        }
    });

    // 메모, 캐릭터, 세계관 관련
    document.querySelector('#memoSection .btn').addEventListener('click', () => {
        const memoModal = new bootstrap.Modal(document.getElementById('memoModal'));
        memoModal.show();
    });
    document.querySelector('.confirm-memo-btn').addEventListener('click', handleConfirmMemo);

    document.querySelector('#characterSection .btn').addEventListener('click', () => {
        const characterModal = new bootstrap.Modal(document.getElementById('characterModal'));
        characterModal.show();
    });
    document.querySelector('.confirm-character-btn').addEventListener('click', handleConfirmCharacter);

    document.querySelector('#worldSection .btn').addEventListener('click', () => {
        const worldModal = new bootstrap.Modal(document.getElementById('worldModal'));
        worldModal.show();
    });
    document.querySelector('.confirm-world-btn').addEventListener('click', handleConfirmWorld);

    // 테마 관련
    document.getElementById('moon').addEventListener('click', handleThemeToggle);

    // 태그 입력 처리
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
            // 기존 입력값 초기화
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
            
            // 새 챕터 체크박스 초기화
            const newChapterCheck = this.querySelector('#newChapterCheck');
            if (newChapterCheck) {
                newChapterCheck.checked = false;
            }

            // 확인 버튼 이벤트 리스너 초기화
            const confirmBtn = this.querySelector('.confirm-character-btn, .confirm-memo-btn, .confirm-world-btn, .confirm-chapter-btn');
            if (confirmBtn) {
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                
                // 기본 이벤트 리스너 다시 연결
                if (newConfirmBtn.classList.contains('confirm-character-btn')) {
                    newConfirmBtn.addEventListener('click', handleConfirmCharacter);
                } else if (newConfirmBtn.classList.contains('confirm-memo-btn')) {
                    newConfirmBtn.addEventListener('click', handleConfirmMemo);
                } else if (newConfirmBtn.classList.contains('confirm-world-btn')) {
                    newConfirmBtn.addEventListener('click', handleConfirmWorld);
                } else if (newConfirmBtn.classList.contains('confirm-chapter-btn')) {
                    newConfirmBtn.addEventListener('click', () => {
                        const isNewChapter = document.getElementById('newChapterCheck').checked;
                        const chapterName = document.getElementById('chapterNameInput').value.trim();
                        const title = document.getElementById('chapterTitleInput').value.trim();
                        const character = document.getElementById('chapterCharacterInput').value.trim();
                        const status = document.getElementById('chapterStatusInput').value;
                        const url = document.getElementById('chapterUrlInput').value.trim();

                        if (title) {
                            const tbody = document.querySelector('tbody');
                            
                            if (isNewChapter) {
                                const nextChapterNum = tbody.querySelectorAll('.chapter-divider').length + 1;
                                const newDivider = createChapterDivider(nextChapterNum, chapterName);
                                tbody.appendChild(newDivider);
                            }

                            const episodeNum = getNextEpisodeNumber();
                            const newRow = createChapterElement(episodeNum, title, character, status, url);
                            tbody.appendChild(newRow);
                            attachChapterEvents(newRow);
                            closeModal('chapterModal');
                        }
                    });
                }
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
    document.querySelectorAll('.project-item').forEach(item => {
        item.classList.remove('active');
    });
    
    project.classList.add('active');
    document.querySelector('.main-title').textContent = name;
    document.querySelector('.project-desc').textContent = desc || '프로젝트 설명이 없습니다.';
    document.querySelector('.memo-list').innerHTML = '';
    document.querySelector('.character-list').innerHTML = '';
    document.querySelector('.world-list').innerHTML = '';
    document.querySelector('tbody').innerHTML = '';
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
        guideText.innerHTML = '<small>+ 버튼을 눌러 프로젝트를 생성해주세요</small>';
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
    const newRow = createChapterElement(getNextEpisodeNumber());
    attachChapterEvents(newRow);
    tbody.appendChild(newRow);
}

function getNextEpisodeNumber() {
    const tbody = document.querySelector('tbody');
    return tbody.querySelectorAll('.chapter-row').length + 1;
}

function createChapterElement(episodeNum, title = '', character = '', status = '작성중', url = '') {
    const newRow = document.createElement('tr');
    newRow.className = 'chapter-row';
    newRow.style.cursor = 'pointer';  // 커서 스타일 변경
    newRow.innerHTML = `
        <td>${episodeNum}화</td>
        <td>${title}</td>
        <td>${character}</td>
        <td>
            <select class="form-select form-select-sm">
                <option ${status === '작성중' ? 'selected' : ''}>작성중</option>
                <option ${status === '수정필요' ? 'selected' : ''}>수정필요</option>
                <option ${status === '보류' ? 'selected' : ''}>보류</option>
                <option ${status === '발행' ? 'selected' : ''}>발행</option>
            </select>
        </td>
        <td><button class="btn btn-sm btn-link url-btn">${url || 'url'}</button></td>
        <td>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-link edit-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-x-lg"></i></button>
            </div>
        </td>
    `;
    return newRow;
}

function attachChapterEvents(row) {
    // 행 클릭 이벤트
    row.addEventListener('click', (e) => {
        // 버튼이나 select 클릭 시에는 이동하지 않음
        if (!e.target.closest('button') && !e.target.closest('select')) {
            window.location.href = 'edit.html';  // edit.html로 이동
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
    
    // 챕터 이름 입력란 초기화
    document.getElementById('newChapterCheck').checked = false;
    document.getElementById('chapterNameGroup').style.display = 'none';
    document.getElementById('chapterNameInput').value = '';
    
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
        
        updateChapterNumbers(); // 챕터 번호 업데이트
        closeModal('chapterModal');
    }
}

function handleChapterDelete(row) {
    if (confirm('이 화를 삭제하시겠습니까?')) {
        row.remove();
        updateChapterNumbers();
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

function handleConfirmMemo() {
    const memoTitle = document.getElementById('memoTitleInput').value.trim();
    const memoText = document.getElementById('memoInput').value.trim();
    if (memoText) {
        const memoList = document.querySelector('.memo-list');
        const newMemo = createMemoElement(memoTitle, memoText);
        memoList.appendChild(newMemo);
        closeModal('memoModal');
    }
}

function createMemoElement(memoTitle, memoText) {
    const newMemo = document.createElement('div');
    newMemo.className = 'memo-item';
    newMemo.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                ${memoTitle ? `<h6 class="memo-title">${memoTitle}</h6>` : ''}
                <div class="memo-content">${memoText}</div>
            </div>
            <div>
                <button class="btn btn-sm btn-link edit-memo-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
    `;
    attachMemoEvents(newMemo);
    return newMemo;
}

function attachMemoEvents(memo) {
    memo.querySelector('.edit-memo-btn').addEventListener('click', () => {
        handleMemoEdit(memo);
    });

    memo.querySelector('.delete-btn').addEventListener('click', () => {
        handleMemoDelete(memo);
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

function handleMemoDelete(memo) {
    if (confirm('메모를 삭제하시겠습니까?')) {
        memo.remove();
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

function handleConfirmCharacter() {
    const name = document.getElementById('characterNameInput').value.trim();
    const profile = document.getElementById('characterProfileInput').value.trim();
    const desc = document.getElementById('characterDescInput').value.trim();
    const tags = Array.from(document.getElementById('characterTags').children).map(tag => 
        tag.textContent.replace('×', '').trim()
    );
    const imageUrl = document.getElementById('characterImagePreview').querySelector('img')?.src || '';

    if (name) {  // 이름은 필수 입력
        const characterList = document.querySelector('.character-list');
        const newCharacter = createCharacterElement(name, profile, desc, tags, imageUrl);
        characterList.appendChild(newCharacter);
        closeModal('characterModal');
    }
}

function createCharacterElement(name, profile, desc, tags, imageUrl) {
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
    attachCharacterEvents(newCharacter);
    return newCharacter;
}

function attachCharacterEvents(character) {
    character.querySelector('.edit-character-btn').addEventListener('click', () => {
        handleCharacterEdit(character);
    });

    character.querySelector('.delete-btn').addEventListener('click', () => {
        handleCharacterDelete(character);
    });
}

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
    
    // 태그 설정
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

    // 기존 확인 버튼의 이벤트 리스너를 모두 제거하고 새로운 버튼으로 교체
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

function handleConfirmWorld() {
    const title = document.getElementById('worldTitleInput').value.trim();
    const content = document.getElementById('worldContentInput').value.trim();
    
    if (title && content) {
        const worldList = document.querySelector('.world-list');
        const newWorld = createWorldElement(title, content);
        worldList.appendChild(newWorld);
        closeModal('worldModal');
    }
}

function createWorldElement(title, content) {
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
    attachWorldEvents(newWorld);
    return newWorld;
}

function attachWorldEvents(world) {
    world.querySelector('.edit-world-btn').addEventListener('click', () => {
        handleWorldEdit(world);
    });

    world.querySelector('.delete-btn').addEventListener('click', () => {
        handleWorldDelete(world);
    });
}

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

function handleWorldDelete(world) {
    if (confirm('세계관을 삭제하시겠습니까?')) {
        world.remove();
    }
}

function resetWorldModal() {
    document.getElementById('worldTitleInput').value = '';
    document.getElementById('worldContentInput').value = '';
}

function handleThemeToggle() {
    const body = document.querySelector('body');
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
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
    document.getElementById('chapterNameGroup').style.display = 'none';  // 챕터 이름 입력칸 숨김
    document.getElementById('chapterTitleInput').value = '';
    document.getElementById('chapterCharacterInput').value = '';
    document.getElementById('chapterStatusInput').value = '작성중';
    document.getElementById('chapterUrlInput').value = '';
}

function createChapterDivider(chapterNum, chapterName = '') {
    const dividerRow = document.createElement('tr');
    dividerRow.className = 'chapter-divider';
    dividerRow.innerHTML = `
        <td colspan="5">
            챕터 ${chapterNum}${chapterName ? ': ' + chapterName : ''}
        </td>
        <td>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-link edit-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-x-lg"></i></button>
            </div>
        </td>
    `;
    
    // 삭제 버튼에 이벤트 리스너 추가
    dividerRow.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm('챕터 구분선을 삭제하시겠습니까?')) {
            dividerRow.remove();
            updateChapterNumbers();
        }
    });

    // 편집 버튼에 이벤트 리스너 추가
    dividerRow.querySelector('.edit-btn').addEventListener('click', () => {
        handleChapterDividerEdit(dividerRow, chapterNum, chapterName);
    });
    
    return dividerRow;
}

function handleChapterDividerEdit(dividerRow, chapterNum, currentName) {
    const editModal = new bootstrap.Modal(document.getElementById('editChapterModal'));
    const input = document.getElementById('editChapterNameInput');
    input.value = currentName;
    
    const confirmBtn = document.getElementById('confirmEditChapter');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
        const newName = input.value.trim();
        // 현재 챕터 번호를 다시 계산
        const allDividers = document.querySelectorAll('.chapter-divider');
        const currentIndex = Array.from(allDividers).indexOf(dividerRow) + 1;
        
        dividerRow.querySelector('td').textContent = `챕터 ${currentIndex}${newName ? ': ' + newName : ''}`;
        editModal.hide();
        // 모든 챕터 번호 업데이트
        updateChapterNumbers();
    });
    
    editModal.show();
}