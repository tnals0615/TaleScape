// 전역 변수
let projectCount = 0;

// 초기화 함수
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initSectionToggles();
    initTheme();
});

// 이벤트 리스너 초기화
function initEventListeners() {
    // 프로젝트 관련
    document.querySelector('.add-project-btn').addEventListener('click', handleAddProject);
    document.querySelector('#projectModal .btn-primary').addEventListener('click', handleProjectSubmit);
    document.getElementById('projectModal').addEventListener('hidden.bs.modal', handleProjectModalHidden);

    // 챕터 관련
    document.querySelector('.add-chapter-btn').addEventListener('click', handleAddChapter);

    // 메모 관련
    document.querySelector('.add-memo-btn').addEventListener('click', handleAddMemo);
    document.querySelector('.confirm-memo-btn').addEventListener('click', handleConfirmMemo);

    // 캐릭터 관련
    document.querySelector('.add-character-btn').addEventListener('click', handleAddCharacter);
    document.querySelector('.confirm-character-btn').addEventListener('click', handleConfirmCharacter);

    // 세계관 관��
    document.querySelector('.add-world-btn').addEventListener('click', handleAddWorld);
    document.querySelector('.confirm-world-btn').addEventListener('click', handleConfirmWorld);

    // 테마 관련
    document.querySelector('.theme-toggle').addEventListener('click', handleThemeToggle);
}

// 섹션 토글 초기화
function initSectionToggles() {
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            const targetId = header.getAttribute('data-bs-target');
            const content = document.querySelector(targetId);
            
            // Bootstrap collapse 인스턴스 가져오기
            const bsCollapse = bootstrap.Collapse.getInstance(content);
            if (!bsCollapse) {
                // collapse 인스턴스가 없으면 새로 생성
                new bootstrap.Collapse(content);
            } else {
                // 있으면 토글
                bsCollapse.toggle();
            }
        });
    });

    // 초기 상태 설정 - 모든 섹션을 접힌 상태로 시작
    document.querySelectorAll('.section-header').forEach(header => {
        header.classList.add('collapsed');
    });
}

// 테마 초기화
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        handleThemeToggle();
    }
}

// 프로젝트 관련 함수들
function handleAddProject() {
    const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
    projectModal.show();
}

function handleProjectSubmit() {
    const projectName = document.querySelector('#projectNameInput').value.trim();
    const projectDesc = document.querySelector('#projectDescInput').value.trim();
    
    if (projectName) {
        createProject(projectName, projectDesc);
    }
}

function createProject(projectName, projectDesc) {
    projectCount++;
    const projectList = document.querySelector('.project-list');
    removeGuideText(projectList);
    
    const newProject = createProjectElement(projectName, projectCount);
    attachProjectEvents(newProject, projectName, projectDesc);
    
    projectList.appendChild(newProject);
    closeAndResetProjectModal();
}

// 프로젝트 관련 유틸리티 함수들
function createProjectElement(projectName, count) {
    const newProject = document.createElement('li');
    newProject.className = 'project-item';
    newProject.dataset.projectId = `project-${count}`;
    newProject.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span class="project-name cursor-pointer">${count}. ${projectName}</span>
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
    updateMainContent(name, desc);
    resetSections();
    addDefaultChapter(name);
}

function handleProjectDelete(project) {
    if (confirm('프로젝트를 삭제하시겠습니까?')) {
        project.remove();
        checkEmptyProjectList();
    }
}

function handleProjectEdit(project, name, desc) {
    const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
    document.querySelector('#projectNameInput').value = name;
    document.querySelector('#projectDescInput').value = desc;
    projectModal.show();
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

function updateMainContent(name, desc) {
    document.querySelector('.main-content h2').textContent = name;
    document.querySelector('.project-description p').textContent = desc || '프로젝트 설명이 없습니다.';
}

function resetSections() {
    document.querySelector('.memo-list').innerHTML = '';
    document.querySelector('.character-list').innerHTML = '';
    document.querySelector('.world-list').innerHTML = '';
    document.querySelector('tbody').innerHTML = '';
}

function closeAndResetProjectModal() {
    const projectModal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
    projectModal.hide();
    document.querySelector('#projectNameInput').value = '';
    document.querySelector('#projectDescInput').value = '';
}

function handleProjectModalHidden() {
    this.querySelector('input').value = '';
}

// 챕터 관련 함수들
function handleAddChapter() {
    const tbody = document.querySelector('tbody');
    const nextChapterNum = tbody.children.length + 1;
    const newRow = createChapterElement(nextChapterNum);
    attachChapterEvents(newRow);
    tbody.appendChild(newRow);
}

function createChapterElement(chapterNum) {
    const newRow = document.createElement('tr');
    newRow.className = 'chapter-row';
    newRow.innerHTML = `
        <td>
            <a href="edit.html" class="text-decoration-none chapter-title">${chapterNum}화 (0자)</a>
        </td>
        <td></td>
        <td>
            <select class="form-select form-select-sm">
                <option>작성중</option>
                <option>수정필요</option>
                <option>보류</option>
                <option>발행</option>
            </select>
        </td>
        <td><button class="btn btn-sm btn-link url-btn">url</button></td>
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
    row.querySelector('.edit-btn').addEventListener('click', () => {
        handleChapterEdit(row);
    });

    row.querySelector('.delete-btn').addEventListener('click', () => {
        handleChapterDelete(row);
    });
}

function handleChapterEdit(row) {
    const chapterModal = new bootstrap.Modal(document.getElementById('chapterModal'));
    
    document.getElementById('chapterTitleInput').value = row.cells[0].textContent;
    document.getElementById('chapterCharacterInput').value = row.cells[1].textContent;
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

    if (title) {
        row.cells[0].innerHTML = `<a href="edit.html" class="text-decoration-none chapter-title">${title}</a>`;
        row.cells[1].textContent = character;
        row.querySelector('select').value = status;
        row.querySelector('.url-btn').textContent = url || 'url';
        closeModal('chapterModal');
    }
}

function handleChapterDelete(row) {
    if (confirm('챕터를 삭제하시겠습니까?')) {
        row.remove();
        // 챕터 삭제 후 번호 재정렬
        updateChapterNumbers();
    }
}

// 챕터 번호 업데이트 함수 추가
function updateChapterNumbers() {
    const tbody = document.querySelector('tbody');
    const chapters = tbody.querySelectorAll('.chapter-row');
    
    chapters.forEach((chapter, index) => {
        const chapterTitle = chapter.querySelector('.chapter-title');
        const currentTitle = chapterTitle.textContent;
        // "(0자)" 부분을 유지하면서 챕터 번호만 업데이트
        const newTitle = `${index + 1}화 ${currentTitle.split(' ').slice(1).join(' ')}`;
        chapterTitle.textContent = newTitle;
    });
}

function addDefaultChapter(projectName) {
    const tbody = document.querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'chapter-row';
    newRow.innerHTML = `
        <td>
            <a href="edit.html" class="text-decoration-none chapter-title">1화 (0자)</a>
        </td>
        <td></td>
        <td>
            <select class="form-select form-select-sm">
                <option>작성중</option>
                <option>수정필요</option>
                <option>보류</option>
                <option>발행</option>
            </select>
        </td>
        <td><button class="btn btn-sm btn-link url-btn">url</button></td>
        <td>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-link edit-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-x-lg"></i></button>
            </div>
        </td>
    `;

    attachChapterEvents(newRow);
    tbody.appendChild(newRow);
}

// 메모 관련 함수들
function handleAddMemo() {
    const memoModal = new bootstrap.Modal(document.getElementById('memoModal'));
    document.getElementById('memoInput').value = '';
    memoModal.show();
}

function handleConfirmMemo() {
    const memoText = document.getElementById('memoInput').value.trim();
    if (memoText) {
        const memoList = document.querySelector('.memo-list');
        const newMemo = createMemoElement(memoText);
        memoList.appendChild(newMemo);
        closeModal('memoModal');
    }
}

function createMemoElement(memoText) {
    const newMemo = document.createElement('div');
    newMemo.className = 'memo-item p-3 bg-light rounded mb-2';
    newMemo.innerHTML = `
        <div class="d-flex justify-content-between">
            <div class="memo-content">${memoText}</div>
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
    document.getElementById('memoInput').value = memo.querySelector('.memo-content').textContent;
    memoModal.show();

    const confirmBtn = document.querySelector('.confirm-memo-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        updateMemo(memo);
    });
}

function updateMemo(memo) {
    const updatedText = document.getElementById('memoInput').value.trim();
    if (updatedText) {
        memo.querySelector('.memo-content').textContent = updatedText;
        closeModal('memoModal');
    }
}

function handleMemoDelete(memo) {
    if (confirm('메모를 삭제하시겠습니까?')) {
        memo.remove();
    }
}

// 캐릭터 관련 함수들
function handleAddCharacter() {
    const characterModal = new bootstrap.Modal(document.getElementById('characterModal'));
    resetCharacterModal();
    characterModal.show();
}

function handleConfirmCharacter() {
    const name = document.getElementById('characterNameInput').value.trim();
    const age = document.getElementById('characterAgeInput').value.trim();
    const personality = document.getElementById('characterPersonalityInput').value.trim();
    const feature = document.getElementById('characterFeatureInput').value.trim();
    const memo = document.getElementById('characterMemoInput').value.trim();

    if (name) {
        const characterList = document.querySelector('.character-list');
        const newCharacter = createCharacterElement(name, age, personality, feature, memo);
        characterList.appendChild(newCharacter);
        closeModal('characterModal');
    }
}

function createCharacterElement(name, age, personality, feature, memo) {
    const newCharacter = document.createElement('div');
    newCharacter.className = 'character-item p-3 bg-light rounded mb-2';
    newCharacter.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h6 class="mb-1">${name}</h6>
                <div class="small text-muted">
                    ${age ? `나이: ${age}<br>` : ''}
                    ${personality ? `성격: ${personality}<br>` : ''}
                    ${feature ? `특징: ${feature}<br>` : ''}
                    ${memo ? `메모: ${memo}` : ''}
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
    
    const currentName = character.querySelector('h6').textContent;
    const textContent = character.querySelector('.small.text-muted').textContent;
    
    document.getElementById('characterNameInput').value = currentName;
    document.getElementById('characterAgeInput').value = textContent.match(/나이: (.*?)(?:\n|$)/)?.[1] || '';
    document.getElementById('characterPersonalityInput').value = textContent.match(/성격: (.*?)(?:\n|$)/)?.[1] || '';
    document.getElementById('characterFeatureInput').value = textContent.match(/특징: (.*?)(?:\n|$)/)?.[1] || '';
    document.getElementById('characterMemoInput').value = textContent.match(/메모: (.*?)(?:\n|$)/)?.[1] || '';
    
    characterModal.show();

    const confirmBtn = document.querySelector('.confirm-character-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        updateCharacter(character);
    });
}

function updateCharacter(character) {
    const name = document.getElementById('characterNameInput').value.trim();
    const age = document.getElementById('characterAgeInput').value.trim();
    const personality = document.getElementById('characterPersonalityInput').value.trim();
    const feature = document.getElementById('characterFeatureInput').value.trim();
    const memo = document.getElementById('characterMemoInput').value.trim();

    if (name) {
        character.querySelector('h6').textContent = name;
        character.querySelector('.small.text-muted').innerHTML = `
            ${age ? `나이: ${age}<br>` : ''}
            ${personality ? `성격: ${personality}<br>` : ''}
            ${feature ? `특징: ${feature}<br>` : ''}
            ${memo ? `메모: ${memo}` : ''}
        `;
        closeModal('characterModal');
    }
}

function handleCharacterDelete(character) {
    if (confirm('캐릭터를 삭제하시겠습니까?')) {
        character.remove();
    }
}

function resetCharacterModal() {
    document.querySelectorAll('#characterModal input, #characterModal textarea').forEach(input => {
        input.value = '';
    });
}

// 세계관 관련 함수들
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
    newWorld.className = 'world-item p-3 bg-light rounded mb-2';
    newWorld.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h6 class="mb-1">${title}</h6>
                <div class="small text-muted world-content">${content}</div>
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

// 유틸리티 함수
function closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
}