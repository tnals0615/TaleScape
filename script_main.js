import { db, addDoc, collection, getDoc, doc, onSnapshot, query, orderBy, where, updateDoc, deleteDoc, getDocs } from "./firebase.js";
import { modalUtils, eventUtils, dataUtils, validationUtils } from "./utils.js";

// 전역 변수
let projectId = "";

document.addEventListener('DOMContentLoaded', async () => {
    // 현재 페이지가 main.html인지 확인
    const isMainPage = window.location.pathname.includes('main.html');
    
    // 저장된 projectId 복원
    const savedProjectId = localStorage.getItem('currentProjectId');
    if (savedProjectId) {
        try {
            const data = await dataUtils.getDocument("project", savedProjectId);
            if (data) {
                projectId = savedProjectId;
                
                // main.html 페이지일 때만 UI 업데이트 시도
                if (isMainPage) {
                    const mainTitle = document.querySelector('.main-title');
                    const projectDesc = document.querySelector('.project-desc');
                    const accordion = document.querySelector('.accordion');
                    const chapterTable = document.querySelector('.chapter-table');
                    
                    if (mainTitle && projectDesc && accordion && chapterTable) {
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
                    const data = await dataUtils.getDocument("project", projectId);
                    if (data) {
                        // 프로젝트 제목과 설명 업데이트
                        document.querySelector('.main-title').textContent = data.name || "프로젝트 이름 없음";
                        document.querySelector('.project-desc').textContent = data.plot || "설명 없음";

                        // 관련 데이터 로드
                        loadMemoData();
                        loadCharacterData();
                        loadWorldBuildingData();
                        loadEpisodeData();

                        // 아코디언 섹션 표시
                        document.querySelector('.accordion').style.display = 'block';
                        document.querySelector('.chapter-table').style.display = 'block';

                        // 현재 프로젝트 ID를 로컬 스토리지에 저장
                        localStorage.setItem('currentProjectId', projectId);
                    } else {
                        console.log("프로젝트를 찾을 수 없습니다!");
                        alert("프로젝트 데이터를 불러올 수 없습니다.");
                    }
                } catch (error) {
                    console.error("프로젝트 데이터 로드 중 오류:", error);
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
        modalUtils.resetModal('chapterModal');
        modalUtils.showModal('chapterModal');
        
        // 이벤트 리스너 교체
        const confirmBtn = document.querySelector('.confirm-chapter-btn');
        eventUtils.replaceEventListener(confirmBtn, 'click', handleConfirmChapter);
    });

    // 메모, 캐릭터, 세계관 관련
    document.querySelector('#memoSection .btn').addEventListener('click', () => {
        if (!projectId) {
            alert("프로젝트를 먼저 선택해주세요.");
            return;
        }
        modalUtils.resetModal('memoModal');
        modalUtils.showModal('memoModal');
        
        // 기존 이벤트 리스너 교체
        const confirmBtn = document.querySelector('.confirm-memo-btn');
        eventUtils.replaceEventListener(confirmBtn, 'click', handleConfirmMemo);
    });

    document.querySelector('#characterSection .btn').addEventListener('click', () => {
        if (!projectId) {
            alert("프로젝트를 먼저 선택해주세요.");
            return;
        }
        modalUtils.resetModal('characterModal');
        modalUtils.showModal('characterModal');
        
        // 기존 이벤트 리스너 교체
        const confirmBtn = document.querySelector('.confirm-character-btn');
        eventUtils.replaceEventListener(confirmBtn, 'click', handleConfirmCharacter);
    });

    document.querySelector('#worldSection .btn').addEventListener('click', () => {
        if (!projectId) {
            alert("프로젝트를 먼저 선택해주세요.");
            return;
        }
        modalUtils.resetModal('worldModal');
        modalUtils.showModal('worldModal');
        
        // 기존 이벤트 리스너 교체
        const confirmBtn = document.querySelector('.confirm-world-btn');
        eventUtils.replaceEventListener(confirmBtn, 'click', handleConfirmWorld);
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
                
                eventUtils.replaceEventListener(
                    tagElement.querySelector('.remove-tag'),
                    'click',
                    function() { this.parentElement.remove(); }
                );
                
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

    // 모달 리셋 이벤트 통합
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function() {
            modalUtils.resetModal(this.id);
        });
    });

    document.getElementById('newChapterCheck').addEventListener('change', function() {
        const chapterNameGroup = document.getElementById('chapterNameGroup');
        chapterNameGroup.style.display = this.checked ? 'block' : 'none';
    });
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
    newRow.setAttribute('data-episode-number', episodeNum);

    // URL 셀에 공유 아이콘 추가
    const shareUrl = `https://talescape-d61b8.web.app/share.html?episode-id=${episodeId}`;
    
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
        <td class="url-cell">
            <i class="fas fa-share-alt share-icon" 
               style="cursor: pointer; color: #666;" 
               title="공유하기"></i>
        </td>
        <td>
            <button class="btn btn-sm btn-link edit-btn"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-link delete-btn"><i class="bi bi-trash"></i></button>
        </td>
    `;

    // 공유 아이콘 클릭 이벤트 추가
    const shareIcon = newRow.querySelector('.share-icon');
    shareIcon.addEventListener('click', async (e) => {
        e.stopPropagation(); // 행 클릭 이벤트 방지
        window.open(shareUrl, '_blank');
    });

    // 상태 변경 시 자동 저장
    const statusSelect = newRow.querySelector('.status-select');
    statusSelect.addEventListener('change', async () => {
        const result = await dataUtils.updateDocument("episode", episodeId, {
            status: statusSelect.value
        });
        
        if (!result.success) {
            console.error("상태 업데이트 중 오류:", result.error);
            alert("상태 변경에 실패했습니다.");
        } else {
            console.log("Status updated:", statusSelect.value);
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
    const titleCell = row.querySelector('.title-cell');
    const episodeId = titleCell?.getAttribute('episode-id');
    
    if (episodeId) {
        dataUtils.getDocument("episode", episodeId).then(async (data) => {
            if (data) {
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
                
                modalUtils.showModal('chapterModal');
                
                // 확인 버튼 이벤트 리스너
                const confirmBtn = document.querySelector('.confirm-chapter-btn');
                eventUtils.replaceEventListener(confirmBtn, 'click', async () => {
                    const isNewChapter = document.getElementById('newChapterCheck').checked;
                    const epiChapter = isNewChapter ? document.getElementById('chapterNameInput').value.trim() : '';
                    const epiTitle = document.getElementById('chapterTitleInput').value.trim();
                    const epiCharacter = document.getElementById('chapterCharacterInput').value.trim();
                    const epiStatus = document.getElementById('chapterStatusInput').value;
                    const epiUrl = document.getElementById('chapterUrlInput').value.trim();
                    
                    if (!validationUtils.isEmpty(epiTitle)) {
                        const result = await dataUtils.updateDocument("episode", episodeId, {
                            is_new_chapter: isNewChapter,
                            chapter: epiChapter,
                            title: epiTitle,
                            character: epiCharacter,
                            status: epiStatus,
                            url: epiUrl
                        });

                        if (result.success) {
                            console.log("Episode updated:", episodeId);
                            await loadEpisodeData();
                            modalUtils.hideModal('chapterModal');
                        } else {
                            console.error("에피소드 수정 중 오류:", result.error);
                            alert("에피소드 수정에 실패했습니다.");
                        }
                    } else {
                        alert("제목을 입력해주세요.");
                    }
                });
            } else {
                console.error("해당 에피소드 데이터를 찾을 수 없습니다.");
                alert("에피소드 데이터를 불러오는 중 문제가 발생했습니다.");
            }
        }).catch((error) => {
            console.error("에피소드 데이터 로드 중 오류:", error);
            alert("에피소드 데이터를 불러오는 중 문제가 발생했습니다.");
        });
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
    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }
    modalUtils.showModal('memoModal');
}

// 메모 추가 처리 함수
async function handleConfirmMemo() {
    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }

    const titleInput = document.getElementById('memoTitleInput');
    const contentInput = document.getElementById('memoContentInput');
    
    const memoTitle = titleInput.value.trim();
    const memoContent = contentInput.value.trim();

    if (!validationUtils.isEmpty(memoContent)) {
        const result = await dataUtils.createDocument("memo", {
            project_id: projectId,
            title: memoTitle,
            content: memoContent
        });

        if (result.success) {
            console.log("Memo added with ID:", result.id);
            titleInput.value = '';
            contentInput.value = '';
            modalUtils.hideModal('memoModal');
            await loadMemoData();
        } else {
            console.error("메모 추가 중 오류:", result.error);
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
            const data = await dataUtils.getDocument("memo", memoId);
            
            if (data) {
                // 모달 초기화 전에 기존 데이터 설정
                const titleInput = document.getElementById('memoTitleInput');
                const contentInput = document.getElementById('memoContentInput');
                
                titleInput.value = data.title || '';
                contentInput.value = data.content || '';
                
                // 모달 표시
                modalUtils.showModal('memoModal');
                
                // 기존 이벤트 리스너 제거 후 새로 연결
                const confirmBtn = document.querySelector('.confirm-memo-btn');
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                
                newConfirmBtn.addEventListener('click', async () => {
                    const newTitle = titleInput.value.trim();
                    const newContent = contentInput.value.trim();
                    
                    if (newTitle && newContent) {
                        const result = await dataUtils.updateDocument("memo", memoId, {
                            title: newTitle,
                            content: newContent,
                            lastModified: new Date()
                        });
                        
                        if (result.success) {
                            modalUtils.hideModal('memoModal');
                            await loadMemoData();
                        } else {
                            console.error("메모 수정 중 오류:", result.error);
                            alert("메모 수정에 실패했습니다.");
                        }
                    } else {
                        alert("제목과 내용을 모두 입력해주세요.");
                    }
                });
            } else {
                throw new Error("메모 데이터를 찾을 수 없습니다.");
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
    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }
    modalUtils.showModal('characterModal');
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
        const result = await dataUtils.createDocument("character", {
            project_id: projectId,
            name: characterName,
            profile: characterProfile,
            desc: characterDesc,
            tags: characterTags,
            imageUrl: characterImageUrl
        });

        if (result.success) {
            console.log("Character added successfully:", result.id);
            loadCharacterData();  // 캐릭터 록 새로고침
            modalUtils.hideModal('characterModal');
        } else {
            console.error("캐릭터 추가 중 오류 발생:", result.error);
            alert("캐릭터를 추가하는 중 문제가 발생했습니다.");
        }
    } else {
        alert("캐릭터 이름은 필수 항목입니다.");
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
    // Firestore에서 캐릭터 데이터 가져오기
    dataUtils.getDocument("character", characterId).then((data) => {
        if (data) {
            // 입력 필드에 데이터 채우기
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
            modalUtils.showModal('characterModal');

            // 확인 버튼 이벤트 설정
            const confirmBtn = document.querySelector('.confirm-character-btn');
            const newConfirmBtn = confirmBtn.cloneNode(true);
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
                    const result = await dataUtils.updateDocument("character", characterId, updatedData);
                    
                    if (result.success) {
                        console.log(`Character with ID: ${characterId} has been updated.`);
                        modalUtils.hideModal('characterModal');
                        loadCharacterData();
                    } else {
                        console.error("캐릭터 수정 중 오류:", result.error);
                        alert("캐릭터 수정에 실패했습니다.");
                    }
                } else {
                    alert("캐릭터 이름은 필수 항목입니다.");
                }
            });
        } else {
            console.error("해당 캐릭터 데이터를 찾을 수 없습니다.");
            alert("캐릭터 데이터를 불러오는 중 문제가 발생했습니다.");
        }
    }).catch((error) => {
        console.error("캐릭터 데이터 가져오기 중 오류 발생:", error);
        alert("캐릭터 데이터를 불러오는 중 오류가 발생했습니다.");
    });
}

// ===============================
// 세계관 관련 함수들
// ===============================
function handleAddWorld() {
    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }
    modalUtils.showModal('worldModal');
}

// 세계관 추가 처리 함수
async function handleConfirmWorld() {
    if (!projectId) {
        alert("프로젝트를 먼저 선택해주세요.");
        return;
    }

    const worldTitle = document.getElementById('worldTitleInput').value.trim();
    const worldContent = document.getElementById('worldContentInput').value.trim();

    if (!validationUtils.isEmpty(worldTitle) && !validationUtils.isEmpty(worldContent)) {
        const result = await dataUtils.createDocument("worldBuilding", {
            project_id: projectId,
            title: worldTitle,
            content: worldContent
        });

        if (result.success) {
            console.log("World Building added successfully:", result.id);
            loadWorldBuildingData();
            modalUtils.hideModal('worldModal');
        } else {
            console.error("세계관 추가 중 오류 발생:", result.error);
            alert("세계관을 추가하는 중 문제가 발생했습니다.");
        }
    } else {
        alert("제목과 내용을 모두 입력해주세요.");
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
    // Firestore에서 세계관 데이터 가져오기
    dataUtils.getDocument("worldBuilding", worldId).then((data) => {
        if (data) {
            // 모달에 데이터 채우기
            document.getElementById('worldTitleInput').value = data.title || '';
            document.getElementById('worldContentInput').value = data.content || '';

            // 모달 표시
            modalUtils.showModal('worldModal');

            // 확인 버튼 이벤트 설정
            const confirmBtn = document.querySelector('.confirm-world-btn');
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

            newConfirmBtn.addEventListener('click', async () => {
                const title = document.getElementById('worldTitleInput').value.trim();
                const content = document.getElementById('worldContentInput').value.trim();

                if (title && content) {
                    const result = await dataUtils.updateDocument("worldBuilding", worldId, {
                        title,
                        content,
                        lastModified: new Date()
                    });

                    if (result.success) {
                        console.log(`World with ID: ${worldId} has been updated.`);
                        modalUtils.hideModal('worldModal');
                        loadWorldBuildingData();
                    } else {
                        console.error("세계관 수정 중 오류:", result.error);
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
        console.error("세계관 데이터 가져오기 중 오류:", error);
        alert("세계관 데이터를 불러오는 중 오류가 발생했습니다.");
    });
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

// 데이터 로드 함수들
export function loadMemoData() {
    const memoList = document.querySelector('.memo-list');
    if (!memoList) {
        console.error("Memo list element not found");
        return;
    }
    
    memoList.innerHTML = '';
    
    dataUtils.loadData("memo", projectId, (snapshot) => {
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
    if (!characterList) return;
    
    characterList.innerHTML = '';
    
    dataUtils.loadData("character", projectId, (snapshot) => {
        characterList.innerHTML = '';
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
    if (!worldList) return;
    
    worldList.innerHTML = '';
    
    dataUtils.loadData("worldBuilding", projectId, (snapshot) => {
        worldList.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const worldElement = createWorldElement(doc.id, data.title, data.content);
            worldList.appendChild(worldElement);
        });
    });
}

export function loadEpisodeData() {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    dataUtils.loadData("episode", projectId, (snapshot) => {
        tbody.innerHTML = '';
        let episodeNum = 1;
        let chapterNum = 1;
        let currentChapter = '';

        // 데이터를 createdAt 기준으로 정렬
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

            // 에피소드 번호 정렬
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
    const typeNames = {
        memo: "메모",
        character: "캐릭터",
        worldBuilding: "세계관",
        episode: "에피소드"
    };
    
    if (!confirm(`${typeNames[collectionName]}을(를) 삭제하시겠습니까?`)) {
        return;
    }

    try {
        // 에피소드인 경우, 관련된 에디터 내용도 삭제
        if (collectionName === "episode") {
            await dataUtils.deleteDocument("episode_content", id);
        }

        const result = await dataUtils.deleteDocument(collectionName, id);
        
        if (result.success) {
            // 에피소드인 경우 번호 재정렬
            if (collectionName === "episode") {
                await reorderEpisodes();
            } else {
                if (collectionName === "memo") await loadMemoData();
                else if (collectionName === "character") await loadCharacterData();
                else if (collectionName === "worldBuilding") await loadWorldBuildingData();
            }
        } else {
            throw result.error;
        }
    } catch (error) {
        console.error(`${typeNames[collectionName]} 삭제 중 오류 발생:`, error);
        alert(`${typeNames[collectionName]} 삭제에 실패했습니다.`);
    }
}

// 새 항목 추가 처리 함수
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
            // 현재 최대 에피소드 번호 가져오기
            const snapshot = await dataUtils.loadDataOnce("episode", projectId);
            let maxEpisodeNumber = 0;
            
            snapshot.forEach((doc) => {
                const episodeNumber = doc.data().episode_number || 0;
                maxEpisodeNumber = Math.max(maxEpisodeNumber, episodeNumber);
            });

            const result = await dataUtils.createDocument("episode", {
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

            if (result.success) {
                console.log("Episode added with ID:", result.id);
                modalUtils.hideModal('chapterModal');
                await loadEpisodeData();
            } else {
                throw result.error;
            }
        } catch (error) {
            console.error("에피소드 추가 중 오류:", error);
            alert("에피소드를 추가하는 중 문제가 발생했습니다.");
        }
    } else {
        alert("제목을 입력해주세요.");
    }
}

// 챕터 이름 수정 함수
async function handleChapterNameEdit(episodeId, currentChapterName) {
    const newChapterName = prompt('챕터 이름을 입력하세요:', currentChapterName);
    if (newChapterName !== null && !validationUtils.isEmpty(newChapterName)) {
        const result = await dataUtils.updateDocument("episode", episodeId, {
            chapter: newChapterName.trim()
        });
        
        if (result.success) {
            console.log("Chapter name updated:", newChapterName);
            await loadEpisodeData();
        } else {
            console.error("챕터 이름 수정 중 오류:", result.error);
            alert("챕터 이름 수정에 실패했습니다.");
        }
    }
}

// 챕터 삭제 함수 (챕터만 삭제하고 에피소드는 유지)
async function handleChapterNameDelete(episodeId, chapterName) {
    if (confirm(`"${chapterName}" 챕터를 삭제하시겠습니까? (에피소드는 유지됩니다)`)) {
        try {
            // 해당 챕터의 모든 에피소드 찾기
            const episodes = await dataUtils.loadDataWithFilter("episode", projectId, {
                field: "chapter",
                value: chapterName
            });
            
            // 모든 에피소드의 챕터 정보 제거
            const updatePromises = episodes.docs.map(doc => 
                dataUtils.updateDocument("episode", doc.id, {
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
        // 현재 프로젝트의 모든 에피소드 가져와서 정렬
        const snapshot = await dataUtils.loadDataOnce("episode", projectId);
        
        // createdAt 기준으로 정렬
        const sortedEpisodes = snapshot.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

        // 순차적으로 번호 재할당
        const updatePromises = sortedEpisodes.map((episode, index) => 
            dataUtils.updateDocument("episode", episode.id, {
                episode_number: index + 1
            })
        );

        await Promise.all(updatePromises);
        console.log("에피소드 번호가 재정렬되었습니다.");
        
        // 데이터 새로고침
        await loadEpisodeData();
    } catch (error) {
        console.error("에피소드 번호 재정렬 중 오류:", error);
        alert("에피소드 번호 재정렬에 실패했습니다.");
    }
}

// 프로젝트 삭제 함수
async function deleteProject(projectId) {
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) return;
    
    try {
        const collections = [
            { name: "episode", needsContent: true },
            { name: "memo", needsContent: false },
            { name: "character", needsContent: false },
            { name: "worldBuilding", needsContent: false }
        ];

        // 각 컬렉션 삭제
        for (const { name, needsContent } of collections) {
            const documents = await dataUtils.loadData(name, projectId);
            
            await Promise.all(documents.docs.map(async doc => {
                if (needsContent) {
                    await dataUtils.deleteDocument(`${name}_content`, doc.id);
                }
                return dataUtils.deleteDocument(name, doc.id);
            }));
        }

        // 프로젝트 삭제
        const result = await dataUtils.deleteDocument("project", projectId);
        
        if (result.success) {
            console.log("프로젝트와 관련 데이터가 삭제되었습니다.");
            loadProjects();
        } else {
            throw result.error;
        }
    } catch (error) {
        console.error("프로젝트 삭제 중 오류:", error);
        alert("프로젝트를 삭제하는 중 문제가 발생했습니다.");
    }
}