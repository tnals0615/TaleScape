// script_edit_result.js

import { db, collection, query, where, onSnapshot } from "./firebase.js";


const toggleTitles = document.querySelectorAll('.toggle-title');
    
    toggleTitles.forEach(title => {
        title.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const isExpanded = content.style.display === 'block';
            content.style.display = isExpanded ? 'none' : 'block';
            
            const arrow = this.textContent.trim().charAt(0);
            this.textContent = this.textContent.replace(
                arrow,
                isExpanded ? '▼' : '▶'
            );
        });
    });

// 현재 프로젝트 ID 가져오기
const currentProjectId = localStorage.getItem('currentProjectId');

// 팝업 스타일 CSS 추가
const style = document.createElement('style');
document.head.appendChild(style);

// 메모 데이터 로드
export function loadMemoList() {
    if (!currentProjectId) return;
    const memoList = document.querySelector('.memo-list');
    if (!memoList) return;

    const q = query(
        collection(db, "memo"), 
        where("project_id", "==", currentProjectId)
    );

    onSnapshot(q, (querySnapshot) => {
        memoList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const memo = doc.data();
            const li = document.createElement('li');
            li.textContent = memo.title;
            li.style.cursor = 'pointer';
            
            li.addEventListener('click', () => {
                createPopup(memo.title, memo.content);
            });
            
            memoList.appendChild(li);
        });
    });
}

// 캐릭터 데이터 로드
export function loadCharacterList() {
    if (!currentProjectId) return;

    const characterList = document.querySelector('.character-list');
    if (!characterList) return;

    const q = query(
        collection(db, "character"), 
        where("project_id", "==", currentProjectId)
    );

    onSnapshot(q, (querySnapshot) => {
        characterList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const character = doc.data();
            const li = document.createElement('li');
            li.textContent = character.name;
            li.style.cursor = 'pointer';
            
            li.addEventListener('click', () => {
                const content = `
                    <div class="character-popup">
                        ${character.imageUrl ? `<img src="${character.imageUrl}" alt="${character.name}" style="max-width: 200px;">` : ''}
                        <p><strong>프로필</strong> <br> ${character.profile || '-'}</p>
                        
                        <p><strong>설명</strong> <br> ${character.desc || '-'}</p>
                        <br>
                        <hr class="black-divider" />
                        ${character.tags ? `<p> ${character.tags.join(', ')}</p>` : ''}
                    </div>
                `;
                createPopup(character.name, content);
            });
            
            characterList.appendChild(li);
        });
    });
}

// 세계관 데이터 로드
export function loadWorldList() {
    if (!currentProjectId) return;

    const worldList = document.querySelector('.world-list');
    if (!worldList) return;

    const q = query(
        collection(db, "worldBuilding"), 
        where("project_id", "==", currentProjectId)
    );

    onSnapshot(q, (querySnapshot) => {
        worldList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const world = doc.data();
            const li = document.createElement('li');
            li.textContent = world.title;
            li.style.cursor = 'pointer';
            
            li.addEventListener('click', () => {
                createPopup(world.title, world.content);
            });
            
            worldList.appendChild(li);
        });
    });
}

// 팝업 생성 함수
function createPopup(title, content) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'popup-content';
    
    popup.innerHTML = `
        <div class="popup-header">
            <h3>${title}</h3>
            <span class="popup-close">✕</span>
        </div>
        <div class="popup-body">
        <hr class="black-divider" />
                        <br>
            ${content}
        </div>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // 닫기 이벤트
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.className === 'popup-close') {
            overlay.remove();
        }
    });
}

// 페이지 로드 시 모든 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
    loadMemoList();
    loadCharacterList();
    loadWorldList();
});