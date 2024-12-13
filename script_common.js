const iconMoon = document.getElementById("moon");

iconMoon.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

const modalContainer = document.getElementById("projectModalContainer");
const openButton = document.querySelector(".icon-plus");
const closeButton = document.getElementById("pModalClose");
const applyButton = document.getElementById("pModalApply");

// 모달 열기
openButton.addEventListener("click", () => {
  modalContainer.classList.remove("hidden");
});

// 모달 닫기
closeButton.addEventListener("click", () => {
  modalContainer.classList.add("hidden");
});

applyButton.addEventListener("click", () => {
  const projectName = document.getElementById("projectNameInput").value;
  const projectPlot = document.getElementById("projectPlotInput").value;

  if (projectName && projectPlot) {
    // Add projectName as an <li> to the project list
    const projectList = document.querySelector(".project-list");
    const listItem = document.createElement("li");
    listItem.textContent = projectName;
    projectList.appendChild(listItem);

    // Remove the message if it exists
    const addBtnMsg = document.getElementById("addBtnMsg");
    if (addBtnMsg) {
      addBtnMsg.remove();
    }

    // Optional: Clear inputs and close modal
    document.getElementById("projectNameInput").value = "";
    document.getElementById("projectPlotInput").value = "";
    modalContainer.classList.add("hidden");
  } else {
    alert("모든 필드를 입력해주세요.");
  }
});
