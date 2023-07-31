import { getFirestore, connectFirestoreEmulator, onSnapshot, collection, getDoc, setDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import gameInit from './gameInit.js';
import gameInitCpu from './gameInitCpu.js';

/**
    * Firebaseの設定
*/
const firebaseConfig = {
    apiKey: "AIzaSyDeb13n42OlEVzhv2Hx_Ll04FuZOi0GhCE",
    authDomain: "mkybdevssubmarine.firebaseapp.com",
    projectId: "mkybdevssubmarine",
    storageBucket: "mkybdevssubmarine.appspot.com",
    messagingSenderId: "108771342371",
    appId: "1:108771342371:web:3faed3d30ca890c3925996"
}
    
initializeApp(firebaseConfig);

function initializeFirebaseEmulating() {
    const db = getFirestore();
    connectFirestoreEmulator(db, "192.168.3.42", 8080);
    return db;
}

function initializeFirebase() {
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
}

/**
    * Firebase初期化
*/
const isEmulating = false;
const db = (isEmulating) ? initializeFirebaseEmulating() : initializeFirebase();

/**
    * ダブルタップによる拡大防止（未遂）
*/
/*
document.addEventListener('touchstart', (event) => {
    if(event.touches && event.touches.length > 1) {
        event.preventDefault();
    }
}, {
    passive: false
});

document.addEventListener('touchmove', function (event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });

document.addEventListener("dblclick", function(e){ e.preventDefault();}, { passive: false });
*/

/**
    * UI初期化
*/
for (const el of document.getElementsByClassName('operator')) {
    el.style.display = "none";
}
document.querySelector('.screen').style.display = "none";

/**
    * 各種ボタンの挙動
*/
document.getElementById('playCpu').onclick = function() {
    document.getElementById('title').style.display = "none";
    document.getElementById('initMessage').innerHTML = "コンピュータの強さを<br>選択してください";
    document.getElementById('playOption').style.display = "none";
    document.getElementById('cpu').style.display = "block";
}

async function playCpu(difficulty) {
    document.getElementById('init').style.display = "none";
    document.querySelector('.room').style.display = "none";
    for (const el of document.getElementsByClassName('operator')) {
        el.style.display = "flex";
    }
    document.querySelector('.screen').style.display = "block";
    gameInitCpu();
}

document.getElementById('easy').onclick = () => playCpu('easy');

document.getElementById('playRoom').onclick = function() {
    document.getElementById('title').style.display = "none";
    document.getElementById('initMessage').innerHTML = "名前とルームIDを<br>入力してください";
    document.getElementById('playOption').style.display = "none";
    document.getElementById('room').style.display = "block";
}

document.getElementById('enterRoom').onclick = async function() {
    const userName = document.getElementById('userName').value;
    const roomID = document.getElementById('roomID').value;
    const count = (str) => {
        let len = 0;   
        for (let i = 0; i < str.length; i++) {
            (str[i].match(/[ -~]/)) ? len += 1 : len += 2;
        }   
        return len;  
    }
    if (count(userName) > 8) {
        document.getElementById('initMessage').textContent = "名前は全角4文字または半角8文字以内で入力してください";
    } else if (userName === "") {
        document.getElementById('initMessage').textContent = "名前を入力してください";
    } else if (roomID === "") {
        document.getElementById('initMessage').textContent = "ルームIDを入力してください";
    } else {
        const userName = document.getElementById('userName').value;
        const docRef = doc(db, "rooms", roomID);
        const querySnapshot = await getDoc(docRef);
        if (querySnapshot.exists()) {
            if (querySnapshot.data().users[1] !== "") {
                document.getElementById('initMessage').textContent = "そのルームは既に埋まっています";
                return;
            } else if (querySnapshot.data().users[0] === userName) {
                document.getElementById('initMessage').textContent = "相手と同じ名前は使用できません";
                return;
            }
            const users = querySnapshot.data().users;
            users[1] = userName;
            await updateDoc(docRef, {
                users: users
            });
            document.getElementById('init').style.display = "none";
            for (const el of document.getElementsByClassName('operator')) {
                el.style.display = "flex";
            }
            document.querySelector('.screen').style.display = "block";
            gameInit(db, roomID, 1);
        } else {
            const fieldInitial = {};
            for (let i = 0; i < 5; i++) {
                fieldInitial[i] = ["", "", "", "", ""];
            }
            try {
                await setDoc(docRef, {
                    users: {0: userName, 1: ""},
                    field: {0: fieldInitial, 1: fieldInitial},
                    turn: 0,
                    hand: {},
                    ships: {0: {}, 1: {}},
                });
            } catch (e) {
                console.error("Error setting document: ", e);
            }
            document.getElementById('initMessage').textContent = "相手を待っています...";
            document.querySelector('.room').style.display = "none";
            const wait = await onSnapshot(docRef, (doc) => {
                const users = doc.data().users;
                if (users[1] !== "") {
                    wait();
                    document.getElementById('init').style.display = "none";
                    for (const el of document.getElementsByClassName('operator')) {
                        el.style.display = "flex";
                    }
                    document.querySelector('.screen').style.display = "block";
                    gameInit(db, roomID, 0);
                }
            });
        }
    }
}

document.getElementById('htp').onclick = () => {
    document.getElementById('init').style.display = "none";
    document.getElementById('howtoplay').style.display = "flex";
}

document.getElementById('htpBack').onclick = () => {
    document.getElementById('init').style.display = "block";
    document.getElementById('howtoplay').style.display = "none";
}

document.getElementById('cpuBack').onclick = () => {
    document.getElementById('title').style.display = "block";
    document.getElementById('initMessage').innerHTML = "";
    document.getElementById('playOption').style.display = "block";
    document.getElementById('cpu').style.display = "none";
}

document.getElementById('roomBack').onclick = function() {
    document.getElementById('title').style.display = "block";
    document.getElementById('initMessage').innerHTML = "";
    document.getElementById('playOption').style.display = "block";
    document.getElementById('room').style.display = "none";
}