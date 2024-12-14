// 전역 변수
let projectCount = 0;

// 초기화 함수
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initTheme();
});

// 이벤트 리스너 초기화
function initEventListeners() {
    // 프로젝트 추가 버튼
    document.querySelector('.icon-plus').addEventListener('click', handleAddProject);
    
    // 프로젝트 모달 버튼들
    document.getElementById('pModalApply').addEventListener('click', handleProjectSubmit);
    document.getElementById('pModalClose').addEventListener('click', () => {
        const modalContainer = document.getElementById('projectModalContainer');
        modalContainer.classList.add('hidden');
    });

    // 챕터 관련 - 단순화
    document.querySelector('#addChapterBtn').addEventListener('click', () => {
        const chapterModal = new bootstrap.Modal(document.getElementById('chapterModal'));
        resetChapterModal();
        chapterModal.show();
    });

    // 새 항목 추가 확인 버튼 이벤트
    document.querySelector('.confirm-chapter-btn').addEventListener('click', () => {
        const isNewChapter = document.getElementById('newChapterCheck').checked;
        const title = document.getElementById('chapterTitleInput').value.trim();
        const character = document.getElementById('chapterCharacterInput').value.trim();
        const status = document.getElementById('chapterStatusInput').value;
        const url = document.getElementById('chapterUrlInput').value.trim();

        if (title) {
            const tbody = document.querySelector('tbody');
            
            if (isNewChapter) {
                // 새 챕터 추가
                const nextChapterNum = tbody.querySelectorAll('.chapter-divider').length + 1;
                handleAddNewChapter(nextChapterNum);
            }

            // 새 화 추가
            const episodeNum = getNextEpisodeNumber();
            const newRow = createChapterElement(episodeNum, title, character, status, url);
            tbody.appendChild(newRow);
            attachChapterEvents(newRow);
            closeModal('chapterModal');
        }
    });

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

    // 모달 리셋 이벤트 추가
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function () {
            // 모든 입력 필드 초기화
            this.querySelectorAll('input, textarea, select').forEach(input => {
                input.value = '';
            });
            
            // 이미지 미리보기 초기화 (캐릭터 모달)
            const imagePreview = this.querySelector('#characterImagePreview');
            if (imagePreview) {
                imagePreview.innerHTML = '';
            }
            
            // 태그 컨테이너 초기화 (캐릭터 모달)
            const tagsContainer = this.querySelector('#characterTags');
            if (tagsContainer) {
                tagsContainer.innerHTML = '';
            }
            
            // 새 챕터 체크박스 초기화 (챕터 모달)
            const newChapterCheck = this.querySelector('#newChapterCheck');
            if (newChapterCheck) {
                newChapterCheck.checked = false;
            }
        });
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

// 챕터 관련 함수들
function handleAddNewChapter(chapterNum) {
    const tbody = document.querySelector('tbody');
    
    // 챕터 구분선 추가
    const dividerRow = document.createElement('tr');
    dividerRow.className = 'chapter-divider';
    dividerRow.innerHTML = `
        <td colspan="5">
            챕터 ${chapterNum}
        </td>
        <td>
            <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-x-lg"></i></button>
        </td>
    `;
    
    // 삭제 버튼에 이벤트 리스너 추가
    dividerRow.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm('챕터 구분선을 삭제하시겠습니까?')) {
            dividerRow.remove();
            updateChapterNumbers();
        }
    });
    
    tbody.appendChild(dividerRow);
}

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

function attachDividerEvents(divider) {
    divider.querySelector('.edit-btn').addEventListener('click', () => {
        const text = divider.querySelector('span').textContent;
        const newText = prompt('챕터 이름을 입력하세요:', text);
        if (newText !== null) {
            divider.querySelector('span').textContent = newText;
        }
    });

    divider.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm('이 챕터와 관련 항목들을 모두 삭제하시겠습니까?')) {
            let nextElement = divider.nextElementSibling;
            divider.remove();
            
            // 다음 챕터 구분선이 나올 때까지 항목들 삭제
            while (nextElement && !nextElement.classList.contains('chapter-divider')) {
                const temp = nextElement.nextElementSibling;
                nextElement.remove();
                nextElement = temp;
            }
        }
    });
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
        row.cells[1].textContent = title;
        row.cells[2].textContent = character;
        row.querySelector('select').value = status;
        row.querySelector('.url-btn').textContent = url || 'url';
        closeModal('chapterModal');
    }
}

function handleChapterDelete(row) {
    if (row.classList.contains('chapter-divider')) {
        // 챕터 구분선인 경우
        if (confirm('이 챕터와 포함된 모든 화를 삭제하시겠습니까?')) {
            let nextElement = row.nextElementSibling;
            row.remove();
            
            // 다음 챕터 구분선이 나올 때까지의 모든 화 삭제
            while (nextElement && !nextElement.classList.contains('chapter-divider')) {
                const temp = nextElement.nextElementSibling;
                nextElement.remove();
                nextElement = temp;
            }
            
            // 챕터 번호 재정렬
            updateChapterNumbers();
        }
    } else {
        // 일반 화인 경우
        if (confirm('이 화를 삭제하시겠습니까?')) {
            row.remove();
            updateChapterNumbers();
        }
    }
}

// 챕터 번호 업데이트 함수 수정
function updateChapterNumbers() {
    const tbody = document.querySelector('tbody');
    let currentChapter = 1;
    let episodeInChapter = 1;
    
    tbody.querySelectorAll('tr').forEach(row => {
        if (row.classList.contains('chapter-divider')) {
            row.querySelector('td').textContent = `챕터 ${currentChapter}`;
            currentChapter++;
            episodeInChapter = 1;
        } else {
            row.cells[0].textContent = `${episodeInChapter}화`;
            episodeInChapter++;
        }
    });
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
    newMemo.className = 'memo-item';
    newMemo.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
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

// 유틸��티 함수
function closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
}

function resetChapterModal() {
    document.getElementById('newChapterCheck').checked = false;
    document.getElementById('chapterTitleInput').value = '';
    document.getElementById('chapterCharacterInput').value = '';
    document.getElementById('chapterStatusInput').value = '작성중';
    document.getElementById('chapterUrlInput').value = '';
}