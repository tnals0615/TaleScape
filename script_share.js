import { db, doc, getDoc } from "./firebase.js";

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeId = urlParams.get('episode-id');
    
    if (episodeId) {
        try {
            const docRef = doc(db, "episode", episodeId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // 제목 설정
                document.querySelector('.title').textContent = 
                    `${data.episode_number || '?'}화. ${data.title}`;
                
                // 내용 설정
                if (data.content) {
                    document.querySelector('.content').innerHTML = data.content;
                }
            } else {
                console.error("에피소드를 찾을 수 없습니다!");
                document.querySelector('.content').textContent = 
                    "에피소드를 찾을 수 없습니다.";
            }
        } catch (error) {
            console.error("데이터 로드 중 오류:", error);
            document.querySelector('.content').textContent = 
                "데이터를 불러오는 중 문제가 발생했습니다.";
        }
    } else {
        document.querySelector('.content').textContent = 
            "올바른 에피소드 ID가 제공되지 않았습니다.";
    }
}); 