import { onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export async function turnPlay(game) {
    console.log("turnPlay Start");
    let hd;
    try {
        const querySnapshot = await getDoc(game.docRef);
        hd = querySnapshot.data().hand;
    } catch (e) {
        console.error("Error getting document: ", e);
    }
    if (Object.keys(hd).length == 0) {
        game.updateMessage("移動するか攻撃するかを選択してください（Mキーで移動、Aキーで攻撃）。");
    } else {
        if (hd.handType == "M") {
            let tmp;
            if (hd.direction == "x") {
                tmp = (hd.distance > 0) ? "右" : "左";
            } else {
                tmp = (hd.distance > 0) ? "下" : "上";
            }
            game.updateMessage(game.oppName + "さんが" + hd.shipType + "を" + tmp + "に" + Math.abs(hd.distance) + "マス動かしました。移動するか攻撃するかを選択してください。");
        } else if (hd.handType == "A") {
            if (hd.ship != "") {
                game.ownShips[hd.ship].hp--;
                if (game.ownShips[hd.ship].hp == 0) {
                    game.ownShips[hd.ship].isAlive = false;
                    game.updateBoard();
                    let isAllSunk = true;
                    Object.keys(game.ownShips).forEach((key) => {
                        if (game.ownShips[key].isAlive) {
                            isAllSunk = false;
                        }
                    });
                    if (isAllSunk) {
                        const mes = game.oppName + "さんが(" + hd.pos + ")を攻撃し、" + hd.ship + "が撃沈しました。あなたの負けです。";
                        gameLose(game, mes);
                        return;
                    } else { 
                        game.updateMessage(game.oppName + "さんが(" + hd.pos + ")を攻撃し、" + hd.ship + "が撃沈しました。移動するか攻撃するかを選択してください。");
                    }
                } else {
                    game.updateMessage(game.oppName + "さんが(" + hd.pos + ")を攻撃し、" + hd.ship + "に命中しました。移動するか攻撃するかを選択してください。");
                }
            } else { 
                game.updateMessage(game.oppName + "さんが(" + hd.pos + ")を攻撃しました。移動するか攻撃するかを選択してください。");
            }
        }
    }
    let res;
    while (true) {
        const key = await game.readUserInput();
        if (key == "m") {
            res = await game.move();
            break;
        } else if (key == "a") {
            res = await game.attack();
            break;
        } else {
            game.updateMessage("無効なキー入力です。");
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
    turnWait(game, res.message); 
}

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
        game.updateMessage(mes + game.oppName + "さんの番です。相手を待っています...");
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

async function gameWin(game, mes) {
    console.log("gameWin Start");
    game.updateMessage(mes);
    console.log("gameWin End");
}

async function gameLose(game, mes) {
    console.log("gameEnd Start");
    game.updateMessage(mes);
    console.log("gameEnd End");
}