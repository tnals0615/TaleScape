import { db, collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDocs, getDoc } from "./firebase.js";

// 데이터베이스 관련 유틸리티
export const dataUtils = {
    // 데이터 로드 (실시간 감시)
    loadData(collectionName, projectId, callback) {
        if (!projectId) return null;
        
        const q = query(
            collection(db, collectionName),
            where("project_id", "==", projectId)
        );
        return onSnapshot(q, callback);
    },

    // 일회성 데이터 조회
    async loadDataOnce(collectionName, projectId) {
        if (!projectId) return null;
        
        try {
            const q = query(
                collection(db, collectionName),
                where("project_id", "==", projectId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot;
        } catch (error) {
            console.error(`${collectionName} 조회 중 오류:`, error);
            throw error;
        }
    },

    // 단일 문서 조회
    async getDocument(collectionName, docId) {
        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error(`${collectionName} 조회 중 오류:`, error);
            throw error;
        }
    },

    // 문서 생성
    async createDocument(collectionName, data) {
        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: new Date()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error(`${collectionName} 생성 중 오류:`, error);
            return { success: false, error };
        }
    },

    // 문서 수정
    async updateDocument(collectionName, docId, data) {
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: new Date()
            });
            return { success: true };
        } catch (error) {
            console.error(`${collectionName} 수정 중 오류:`, error);
            return { success: false, error };
        }
    },

    // 문서 삭제
    async deleteDocument(collectionName, docId) {
        try {
            await deleteDoc(doc(db, collectionName, docId));
            return { success: true };
        } catch (error) {
            console.error(`${collectionName} 삭제 중 오류:`, error);
            return { success: false, error };
        }
    },

    // 필터링된 데이터 조회
    async loadDataWithFilter(collectionName, projectId, filter) {
        if (!projectId) return null;
        
        try {
            const q = query(
                collection(db, collectionName),
                where("project_id", "==", projectId),
                where(filter.field, "==", filter.value)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot;
        } catch (error) {
            console.error(`${collectionName} 필터 조회 중 오류:`, error);
            throw error;
        }
    }
};

// 모달 관련 유틸리티
export const modalUtils = {
    showModal(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        return modal;
    },

    hideModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) return;

        // 모달 내부의 포커스된 요소의 포커스를 해제
        const focusedElement = modalElement.querySelector(':focus');
        if (focusedElement) {
            focusedElement.blur();
        }

        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }

        // aria-hidden 속성 제거
        modalElement.removeAttribute('aria-hidden');
    },

    resetModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // 입력값 초기화
        modal.querySelectorAll('input, textarea, select').forEach(input => {
            input.value = '';
        });
        
        // 이미지 미리보기 초기화
        const imagePreview = modal.querySelector('#characterImagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
        }
        
        // 태그 초기화
        const tagsContainer = modal.querySelector('#characterTags');
        if (tagsContainer) {
            tagsContainer.innerHTML = '';
        }

        // 챕터 모달 특수 처리
        if (modalId === 'chapterModal') {
            const newChapterCheck = modal.querySelector('#newChapterCheck');
            const chapterNameGroup = modal.querySelector('#chapterNameGroup');
            if (newChapterCheck && chapterNameGroup) {
                newChapterCheck.checked = false;
                chapterNameGroup.style.display = 'none';
            }
        }
    },

    setValues(modalId, values) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        Object.entries(values).forEach(([key, value]) => {
            const input = modal.querySelector(`[data-field="${key}"]`);
            if (input) {
                input.value = value;
            }
        });
    }
};

// 이벤트 관련 유틸리티
export const eventUtils = {
    // 이벤트 리스너 교체 (중복 방지)
    replaceEventListener(element, eventType, handler) {
        const clone = element.cloneNode(true);
        element.parentNode.replaceChild(clone, element);
        clone.addEventListener(eventType, handler);
        return clone;
    },

    // 여러 이벤트 리스너 한번에 추가
    addEventListeners(element, events) {
        Object.entries(events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }
};

// 유효성 검사 유틸리티
export const validationUtils = {
    isEmpty(value) {
        return !value || value.trim() === '';
    },

    isValidLength(value, maxLength) {
        return value.length <= maxLength;
    },

    validateProjectInput(name, plot) {
        if (this.isEmpty(name) || this.isEmpty(plot)) {
            alert("모든 필드를 입력해주세요.");
            return false;
        }
        if (!this.isValidLength(name, 50)) {
            alert("프로젝트 이름은 50자를 초과할 수 없습니다.");
            return false;
        }
        return true;
    },

    // 프로젝트 ID 체크
    checkProjectId(projectId) {
        if (!projectId) {
            alert("프로젝트를 먼저 선택해주세요.");
            return false;
        }
        return true;
    }
};

// UI 관련 유틸리티
export const uiUtils = {
    createPopup(title, content) {
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
}; 