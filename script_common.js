// firebase.js에서 Firebase 모듈 가져오기
import { db } from "./firebase.js"; // 상대 경로를 정확히 설정하세요.
import { addDoc, collection} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

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

// 요소 존재 여부 확인
if (  !iconMoon ||  !modalContainer ||  !openButton ||  !closeButton ||  !applyButton ||  !projectNameInput ||  !projectPlotInput) {
  console.error("필수 DOM 요소 중 하나가 누락되었습니다. 코드 로직을 확인하세요.");
}

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

    // 프로젝트 목록 업데이트
    const listItem = document.createElement("li");
    listItem.textContent = projectName;
    projectList?.appendChild(listItem);

    // 안내 메시지 제거
    if (addBtnMsg) {
      addBtnMsg.remove();
    }

    // 입력 필드 초기화 및 모달 닫기
    projectNameInput.value = "";
    projectPlotInput.value = "";
    modalContainer?.classList.add("hidden");

    alert("프로젝트가 성공적으로 추가되었습니다!");
  } catch (error) {
    console.error("Firestore 추가 중 오류 발생: ", error);
    alert("프로젝트를 추가하는 중 문제가 발생했습니다.");
  }
});
