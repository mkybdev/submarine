import { getFirestore, connectFirestoreEmulator, onSnapshot, collection, getDoc, setDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import gameInit from './gameInit.js';
import gameInitCpu from './gameInitCpu.js';

// Your web app's Firebase configuration
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
    connectFirestoreEmulator(db, 'localhost', 8080);
    return db;
}

function initializeFirebase() {
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
}

// Initialize Firebase
const isEmulating = true;
const db = (isEmulating) ? initializeFirebaseEmulating() : initializeFirebase();

for (const el of document.getElementsByClassName('operator')) {
    el.style.display = "none";
}
document.querySelector('.screen').style.display = "none";

document.getElementById('playCpu').onclick = function() {
    document.getElementById('initMessage').textContent = "コンピュータの強さを選択してください";
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
    document.getElementById('initMessage').textContent = "名前とルームIDを入力してください";
    document.getElementById('playOption').style.display = "none";
    document.getElementById('room').style.display = "block";
}

document.getElementById('enterRoom').onclick = async function() {
    const roomID = document.getElementById('roomID').value;
    if (roomID.startsWith("cpu")) {
        document.getElementById('initMessage').textContent = "そのルームIDは使用できません";
    } else {
        const userName = document.getElementById('userName').value;
        const docRef = doc(db, "rooms", roomID);
        const querySnapshot = await getDoc(docRef);
        if (querySnapshot.exists()) {
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
                    ships: {0: {}, 1: {}}
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