// 전역 변수
let projectCount = 0;

// 초기화 함수
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initTheme();
});

// 이벤트 리스너 초기화
function initEventListeners() {
    // 프로젝트 관련
    document.querySelector('.icon-plus').addEventListener('click', handleAddProject);
    document.querySelector('#projectModal .btn-primary').addEventListener('click', handleProjectSubmit);
    document.getElementById('projectModal').addEventListener('hidden.bs.modal', handleProjectModalHidden);

    // 챕터 관련
    document.querySelector('.chapter-table .btn').addEventListener('click', handleAddChapter);

    // 메모 관련
    document.querySelector('#memoSection .btn').addEventListener('click', () => {
        const memoModal = new bootstrap.Modal(document.getElementById('memoModal'));
        memoModal.show();
    });
    document.querySelector('.confirm-memo-btn').addEventListener('click', handleConfirmMemo);

    // 캐릭터 관련
    document.querySelector('#characterSection .btn').addEventListener('click', () => {
        const characterModal = new bootstrap.Modal(document.getElementById('characterModal'));
        characterModal.show();
    });
    document.querySelector('.confirm-character-btn').addEventListener('click', handleConfirmCharacter);

    // 세계관 관련
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
                
                // 태그 삭제 기능
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
    const projectList = document.querySelector('.project-list');
    removeGuideText(projectList);
    
    const newProject = createProjectElement(projectName);
    attachProjectEvents(newProject, projectName, projectDesc);
    
    projectList.appendChild(newProject);
    closeAndResetProjectModal();

    handleProjectClick(newProject, projectName, projectDesc);
}

// 프로젝트 관련 유틸리티 함수들
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
        <div class="character-content">
            ${imageUrl ? `
                <div class="character-image">
                    <img src="${imageUrl}" alt="${name}">
                </div>
            ` : ''}
            <div class="character-header">
                <h3 class="character-name">${name}</h3>
                <div class="character-actions">
                    <button class="edit-character-btn" title="수정">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="delete-btn" title="삭제">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="character-info">
                ${profile ? `<div class="character-profile">${profile.replace(/\n/g, '<br>')}</div>` : ''}
                ${desc ? `<div class="character-desc">${desc.replace(/\n/g, '<br>')}</div>` : ''}
                <div class="character-tags">
                    ${tags.map(tag => `<span class="character-tag">${tag}</span>`).join('')}
                </div>
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

    characterModal.show();

    // 확인 버튼에 수정 이벤트 연결
    const confirmBtn = document.querySelector('.confirm-character-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        updateCharacter(character);
    });
}

function updateCharacter(character) {
    const name = document.getElementById('characterNameInput').value.trim();
    const profile = document.getElementById('characterProfileInput').value.trim();
    const desc = document.getElementById('characterDescInput').value.trim();
    const tags = Array.from(document.getElementById('characterTags').children).map(tag => 
        tag.textContent.replace('×', '').trim()
    );
    const imageUrl = document.getElementById('characterImagePreview').querySelector('img')?.src || '';

    if (name) {
        const newCharacter = createCharacterElement(name, profile, desc, tags, imageUrl);
        character.replaceWith(newCharacter);
        closeModal('characterModal');
    }
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