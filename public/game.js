import { onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/**
    * 行動ターン
*/
export async function turnPlay(game) {
    console.log(game.ownShips);
    console.log(game.ownField);
    console.log("turnPlay Start");
    game.turns += 1;
    let hd;
    try {
        const querySnapshot = await getDoc(game.docRef);
        hd = querySnapshot.data().hand;
    } catch (e) {
        console.error("Error getting document: ", e);
    }
    if (Object.keys(hd).length == 0) {
        game.updateMessage("移動するか攻撃するかを選択してください。");
    } else {
        if (hd.handType == "M") {
            let tmp;
            if (hd.direction == "x") {
                tmp = (hd.distance > 0) ? "右" : "左";
            } else {
                tmp = (hd.distance > 0) ? "下" : "上";
            }
            document.getElementById("faceSP").innerHTML = "<img src=\"./images/normal.gif\">";
            document.getElementById("facePC").innerHTML = "<img src=\"./images/normal.gif\">";
            game.updateMessage(game.oppName + "さんが" + hd.shipName + "を" + tmp + "に" + Math.abs(hd.distance) + "マス動かしました。移動するか攻撃するかを選択してください。");
        } else if (hd.handType == "A") {
            if (hd.ship != "") {
                game.ownShips[hd.ship].hp--;
                if (game.ownShips[hd.ship].hp == 0) {
                    game.ownShips[hd.ship].isAlive = false;
                    await game.updateBoard();
                    let isAllSunk = true;
                    Object.keys(game.ownShips).forEach((key) => {
                        if (game.ownShips[key].isAlive) {
                            isAllSunk = false;
                        }
                    });
                    if (isAllSunk) {
                        const mes = game.oppName + "さんが(" + hd.pos + ")を攻撃し、" + hd.shipName + "が撃沈しました。あなたの負けです。";
                        gameLose(game, mes);
                        return;
                    } else { 
                        document.getElementById("faceSP").innerHTML = "<img src=\"./images/sad.gif\">";
                        document.getElementById("facePC").innerHTML = "<img src=\"./images/sad.gif\">";
                        game.updateMessage(game.oppName + "さんが(" + hd.pos + ")を攻撃し、" + hd.shipName + "が撃沈しました。移動するか攻撃するかを選択してください。");
                    }
                } else {
                    await game.updateBoard();
                    document.getElementById("faceSP").innerHTML = "<img src=\"./images/surprised.gif\">";
                    document.getElementById("facePC").innerHTML = "<img src=\"./images/surprised.gif\">";
                    game.updateMessage(game.oppName + "さんが(" + hd.pos + ")を攻撃し、" + hd.shipName + "に命中しました。移動するか攻撃するかを選択してください。");
                }
            } else { 
                document.getElementById("faceSP").innerHTML = "<img src=\"./images/normal.gif\">";
                document.getElementById("facePC").innerHTML = "<img src=\"./images/normal.gif\">";
                game.updateMessage(game.oppName + "さんが(" + hd.pos + ")を攻撃しました。移動するか攻撃するかを選択してください。");
            }
        }
    }
    let res;
    while (true) {
        const button = await game.readUserInput();
        if (button == "move") {
            res = await game.move();
            break;
        } else if (button == "attack") {
            res = await game.attack();
            break;
        }
    } 
    try {
        await updateDoc(game.docRef, {
            hand: res,
        });
    } catch (e) {
        console.error("Error updating Document: ", e);
    }
    console.log("turnPlay End");
    if (res.handType == "A") {
        if (res.ship == "") {
            document.getElementById("faceSP").innerHTML = "<img src=\"./images/normal.gif\">";
            document.getElementById("facePC").innerHTML = "<img src=\"./images/normal.gif\">";
        } else {
            document.getElementById("faceSP").innerHTML = "<img src=\"./images/happy.gif\">";
            document.getElementById("facePC").innerHTML = "<img src=\"./images/happy.gif\">";
        }
    }
    turnWait(game, res.message); 
}

/**
    * 待機ターン
*/
export async function turnWait(game, mes) {
    console.log("turnWait Start");
    await game.loadOppField();
    await game.loadOppShips();
    console.log(game.oppShips);
    let isAllSunk = true;
    Object.keys(game.oppShips).forEach((key) => {
        if (game.oppShips[key].isAlive) {
            isAllSunk = false;
        }
    });
    if (isAllSunk) {
        const m = mes + "あなたは" + game.oppName + "さんの艦を全て撃沈しました。あなたの勝ちです。";
        gameWin(game, m);
        return;
    } else {
        game.updateMessage(mes + game.oppName + "さんを待っています...");
        const wait = await onSnapshot(game.docRef, async () => {
            await game.loadTurn();
            if (game.turn == game.user) {
                wait();
                console.log("turnWait End");
                await game.loadOppField();
                await game.loadOppShips();
                turnPlay(game);
            }
        });
    }
}

/**
    * 勝利処理
*/
export async function gameWin(game, mes) {
    console.log("gameWin Start");
    game.updateMessage(mes);
    document.getElementById("faceSP").innerHTML = "<img src=\"./images/win.gif\">";
    document.getElementById("facePC").innerHTML = "<img src=\"./images/win.gif\">";
    document.getElementById('arrows').style.display = "none";
    document.getElementById('buttons').style.display = "none";
    document.getElementById('gameEnd').style.display = "flex";
    const turn = String(game.turns).replace(/[A-Za-z0-9]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
    document.getElementById('gameEndMessage').innerHTML = turn + "ターンで勝利！";
    console.log("gameWin End");
}

/**
    * 敗北処理
*/
export async function gameLose(game, mes) {
    console.log("gameEnd Start");
    game.updateMessage(mes);
    document.getElementById("faceSP").innerHTML = "<img src=\"./images/lose.gif\">";
    document.getElementById("facePC").innerHTML = "<img src=\"./images/lose.gif\">";
    document.getElementById('arrows').style.display = "none";
    document.getElementById('buttons').style.display = "none";
    document.getElementById('gameEnd').style.display = "flex";
    const turn = String(game.turns).replace(/[A-Za-z0-9]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
    document.getElementById('gameEndMessage').innerHTML = turn + "ターンで敗北...";
    console.log("gameEnd End");
}

document.getElementById('gameEndBack').onclick = () => {
    window.location.reload();
}