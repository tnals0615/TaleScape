// firebase.js에서 export한것만 가져올 수 있다.
import { db, addDoc, collection, getDoc, doc, onSnapshot, query, orderBy } from "./firebase.js";

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

// 다크 모드 토글
iconMoon?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// 모달 열기
openButton?.addEventListener("click", () => {
  modalContainer?.classList.remove("hidden");
});

// 모달 닫기
closeButton?.addEventListener("click", () => {
  modalContainer?.classList.add("hidden");
});

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
    const docRef = await addDoc(collection(db, "project"), {
      name: projectName,
      plot: projectPlot,
      createdAt: new Date(),
    });

    console.log("Document written with ID: ", docRef.id);

    // 안내 메시지 제거
    if (addBtnMsg) {
      addBtnMsg.remove();
    }

    // 입력 필드 초기화 및 모달 닫기
    projectNameInput.value = "";
    projectPlotInput.value = "";
    modalContainer?.classList.add("hidden");

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

        const listItem = document.createElement("li");
        listItem.textContent = projectName; // 프로젝트 이름 설정
        listItem.setAttribute("data-id", doc.id); // Firestore 문서 ID 설정
        projectList.appendChild(listItem);
      });
    }
  }, (error) => {
    console.error("실시간 동기화 중 오류 발생:", error);
  });
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
