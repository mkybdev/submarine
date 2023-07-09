import { getDoc, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { turnPlay, turnWait } from "./game.js";

class Ship {
    constructor(type) {
        this.type = type;
        this.x;
        this.y;
        this.hp = (type == "W") ? 1 : (type == "C") ? 1 : 1;
        this.isAlive = true;
    }
}

class Game {

    constructor(user, docRef) {
        this.user = user;
        this.opp = 1 - user;
        this.userName;
        this.oppName;
        this.docRef = docRef;
        this.ownField;
        this.oppField;
        this.turn;
        this.tmp;
        this.state;
        this.ownShips = { "W": new Ship("W"), "C": new Ship("C"), "S": new Ship("S") };
        this.oppShips = { "W": new Ship("W"), "C": new Ship("C"), "S": new Ship("S") };
    }

    updateMessage(msg) {
        if (window.getComputedStyle(document.getElementById("mesSP")).getPropertyValue('display') == "none") {
            document.getElementById("gameMessagePC").innerHTML = msg;
        } else {
            document.getElementById("gameMessageSP").innerHTML = msg;
        }
        console.log("updateMessage OK");
    }

    async loadOppField() {
        try {
            const querySnapshot = await getDoc(this.docRef);
            this.oppField = querySnapshot.data().field[this.opp];
            console.log("loadOppField OK");
        } catch (e) {
            console.error("loadOppField Error: ", e);
        }
    }

    async loadTurn() {
        try {
            const querySnapshot = await getDoc(this.docRef);
            this.turn = querySnapshot.data().turn;
            console.log("loadTurn OK");
        } catch (e) {
            console.error("loadTurn Error: ", e);
        }
    }

    async updateOwnShips() {
        try {
            const querySnapshot = await getDoc(this.docRef);
            const oppShipsObj = querySnapshot.data().ships[this.opp];
            let ownShipsObj = {};
            Object.keys(this.ownShips).forEach((key) => {
                ownShipsObj[key] = {
                    type: this.ownShips[key].type,
                    x: this.ownShips[key].x,
                    y: this.ownShips[key].y,
                    hp: this.ownShips[key].hp,
                    isAlive: this.ownShips[key].isAlive,
                };
            });
            await updateDoc(this.docRef, {
                ships: { [this.user]: ownShipsObj, [this.opp]: oppShipsObj },
            });
            console.log("updateOwnShips OK");
        } catch (e) {
            console.error("updateOwnShips Error: ", e);
        }
    }

    async loadOppShips() {
        try {
            const querySnapshot = await getDoc(this.docRef);
            const oppShipsObj = querySnapshot.data().ships[this.opp];
            Object.keys(oppShipsObj).forEach((key) => {
                const ship = oppShipsObj[key];
                this.oppShips[key].x = ship.x;
                this.oppShips[key].y = ship.y;
                this.oppShips[key].hp = ship.hp;
                this.oppShips[key].isAlive = ship.isAlive;
            });
            console.log("loadOppShips OK");
        } catch (e) {
            console.error("loadOppShips Error: ", e);
        }
    }

    async changeTurn() {
        try {
            await updateDoc(this.docRef, {
                turn: this.opp,
            });
            this.turn = this.opp;
        } catch (e) {
            console.error("changeTurn Error: ", e);
        }
    }

    async updateOwnField() {
        try {
            const querySnapshot = await getDoc(this.docRef);
            this.ownField = querySnapshot.data().field[this.user];
            Object.keys(this.ownField).forEach((key) => {
                for (let i = 0; i < 5; i++) {
                    this.ownField[key][i] = "";
                }
            });
            Object.keys(this.ownShips).forEach((key) => {
                const ship = this.ownShips[key];
                if (ship.x != undefined) {
                    this.ownField[ship.y][ship.x] = ship.type;
                }
            });
            await this.loadOppField();
            await updateDoc(this.docRef, {
                field: { [this.user]: this.ownField, [this.opp]: this.oppField },
            });
            console.log("updateOwnField OK");
        } catch (e) {
            console.error("updateOwnField Error: ", e);
        }
    }

    async initBoard() {
        try {
            const board = document.getElementById("board");
            board.innerHTML = "";
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    let btn = document.createElement('button');
                    btn.className = "cell";
                    btn.style.border = "1.5px solid white";
                    btn.style.backgroundColor = "black";
                    btn.style.color = "white";
                    btn.style.width = "100%";
                    btn.style.height = "100%";
                    if (window.getComputedStyle(document.getElementById("mesSP")).getPropertyValue('display') == "none") {
                        btn.style.fontSize = "3em";
                    } else {
                        btn.style.fontSize = "1.75em";
                    }
                    btn.style.fontFamily = "PixelMplus";
                    btn.id = "cell" + i + j;
                    board.appendChild(btn);
                }
            }
            console.log("initBoard OK");
        } catch (e) {
            console.error("initBoard Error: ", e);
        }
    }

    updateBoard() {
        try {
            const cells = document.querySelectorAll(".cell");
            cells.forEach((cell) => {
                cell.innerHTML = "";
            });
            Object.keys(this.ownShips).forEach((key) => {
                const ship = this.ownShips[key];
                if (ship.x != undefined && ship.isAlive) {
                    document.getElementById("cell" + ship.y + ship.x).innerHTML = ship.type;
                }
            });
            console.log("updateBoard OK");
        } catch (e) {
            console.error("updateBoard Error: ", e);
        }
    }

    readUserClick() {
        const cells = document.querySelectorAll(".cell");
        return new Promise((resolve) => {
            cells.forEach((cell) => {
                cell.addEventListener("click", function click(e) {
                    cells.forEach((cell) => {
                        cell.removeEventListener("click", click);
                    });
                    resolve(e.target);
                });
            });
        });
    }

    readUserInput() {
        return new Promise((resolve) => {
            document.addEventListener("keydown", function keydown(e) {
                    document.removeEventListener("keydown", keydown);
                    resolve(e.key);
            });
        });
    }

    async getOwn(pos) {
        if (pos[0] >= 0 && pos[0] <= 4 && pos[1] >= 0 && pos[1] <= 4) {
            const res = this.ownField[pos[1]][pos[0]];
            if (res != "") {
                if (this.ownShips[res].isAlive) {
                    return res;
                } else {
                    return "";
                }
            } else {
                return "";
            }
        } else {
            return undefined;
        }
    }

    async getOpp(pos) {
        await this.loadOppField();
        await this.loadOppShips();
        if (pos[0] >= 0 && pos[0] <= 4 && pos[1] >= 0 && pos[1] <= 4) {
            const res = this.oppField[pos[1]][pos[0]];
            if (res != "") {
                if (this.oppShips[res].isAlive) {
                    return res;
                } else {
                    return "";
                }
            } else {
                return "";
            }
        } else {
            return undefined;
        }
    }

    async move() {
        this.state = "move";
        this.updateMessage("どの艦を動かしますか？（クリックで選択）");
        let el;
        while (true) {
            el = await this.readUserClick();
            if (el.innerHTML != "") {
                break;
            } else {
                this.updateMessage("別の場所を選択してください。");
            }
        }
        const ship = this.ownShips[el.innerHTML];
        let moveTo = [ship.x, ship.y];
        this.updateMessage("艦の移動先を選択してください（矢印キーで移動、Enterキーで決定）。");
        const collisionCheck = (pos, ship) => {
            let res = false;
            ["W", "C", "S"].forEach((key) => {
                if (pos[0] == this.ownShips[key].x && pos[1] == this.ownShips[key].y && this.ownShips[key].isAlive) {
                    res = true;
                }
            });
            return res;
        }
        let res = { handType: "", shipType: "", direction: "", distance: 0, message: "" };
        while (true) {
            document.getElementById("cell" + ship.y + ship.x).style.border = "2px solid blue";
            document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
            const key = await this.readUserInput();
            if (key == "Enter") {
                if (collisionCheck(moveTo, ship.type)) {
                    this.updateMessage("すでに艦がいる場所には動かせません。");
                } else {
                    document.getElementById("cell" + ship.y + ship.x).style.border = "1px solid white";
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    res.handType = "M";
                    res.shipType = ship.type;
                    if (moveTo[0] - ship.x != 0) {
                        res.direction = "x";
                        res.distance = moveTo[0] - ship.x;
                    } else {
                        res.direction = "y";
                        res.distance = moveTo[1] - ship.y;
                    }
                    ship.x = moveTo[0];
                    ship.y = moveTo[1];
                    await this.updateOwnField();
                    await this.updateOwnShips();
                    this.updateBoard();
                    let tmp;
                    if (res.direction == "x") {
                        tmp = (res.distance > 0) ? "右" : "左";
                    } else {
                        tmp = (res.distance > 0) ? "下" : "上";
                    }
                    res.message = ship.type + "を" + tmp + "に" + Math.abs(res.distance) + "マス移動しました。";
                    await this.changeTurn();
                    break;
                }
            } else if (key == "ArrowUp") {
                if (!(moveTo[0] == ship.x || moveTo[1]-1 == ship.y)) {
                    this.updateMessage("艦は縦横のどちらかにのみ動かせます。");
                } else if (moveTo[1] != 0) {
                    const tmp = [moveTo[0], moveTo[1]-1];
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    moveTo = tmp;
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
                } else {
                    this.updateMessage("他の場所を選択してください。");
                }
            } else if (key == "ArrowDown") {
                if (!(moveTo[0] == ship.x || moveTo[1]+1 == ship.y)) {
                    this.updateMessage("艦は縦横のどちらかにのみ動かせます。");
                } else if (moveTo[1] != 4) {
                    const tmp = [moveTo[0], moveTo[1]+1];
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    moveTo = tmp;
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
                } else {
                    this.updateMessage("他の場所を選択してください。");
                }
            } else if (key == "ArrowLeft") {
                if (!(moveTo[0]-1 == ship.x || moveTo[1] == ship.y)) {
                    this.updateMessage("艦は縦横のどちらかにのみ動かせます。");
                } else if (moveTo[0] != 0) {
                    const tmp = [moveTo[0]-1, moveTo[1]];
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    moveTo = tmp;
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
                } else {
                    this.updateMessage("他の場所を選択してください。");
                }
            } else if (key == "ArrowRight") {
                if (!(moveTo[0]+1 == ship.x || moveTo[1] == ship.y)) {
                    this.updateMessage("艦は縦横のどちらかにのみ動かせます。");
                } else if (moveTo[0] != 4) {
                    const tmp = [moveTo[0]+1, moveTo[1]];
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    moveTo = tmp;
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
                } else {
                    this.updateMessage("他の場所を選択してください。");
                }
            } else {
                this.updateMessage("無効なキー入力です。");
            }
        }
        return new Promise((resolve) => {
            resolve(res);
        });
    }

    async getOwnSurrounding(pos) {
        let res = [];
        for (let x = pos[0]-1; x <= pos[0]+1; x++) {
            for (let y = pos[1]-1; y <= pos[1]+1; y++) {
                if (x == pos[0] && y == pos[1]) {
                    continue;
                }
                const el = await this.getOwn([x, y]);
                if (el == "" || el == undefined) {
                    if (this.ownShips[el].isAlive) {
                        res.push(el);
                    }
                }
            }
        }
        return res;
    }

    async getOppSurrounding(pos) {
        await this.loadOppField();
        await this.loadOppShips();
        let res = [];
        for (let x = pos[0]-1; x <= pos[0]+1; x++) {
            for (let y = pos[1]-1; y <= pos[1]+1; y++) {
                if (x == pos[0] && y == pos[1]) {
                    continue;
                }
                const el = await this.getOpp([x, y]);
                if (el != "" && el != undefined) {
                    if (this.oppShips[el].isAlive) {
                        res.push(el);
                    }
                }
            }
        }
        return res;
    }

    async attack() {
        this.state = "attack";
        await this.loadOppField();
        await this.loadOppShips();
        this.updateMessage("攻撃する場所を選んでください（クリックで選択）。");
        const canAttack = (pos) => {
            let res = false;
            ["W", "C", "S"].forEach((key) => {
                let xdif = Math.abs(pos[0] - this.ownShips[key].x);
                let ydif = Math.abs(pos[1] - this.ownShips[key].y);
                if (xdif < 2 && ydif < 2) {
                    res = true;
                }
            });
            return res;
        }
        let pos;
        while (true) {
            const el = await this.readUserClick();
            pos = [parseInt(el.id[5]), parseInt(el.id[4])];
            if (canAttack(pos)) {
                break;
            } else {
                this.updateMessage("他の場所を選択してください。");
            }
        }
        let res = { "handType": "A", "pos": pos, "ship": "", "message": "" };
        const el = await this.getOpp(pos);
        if (el != "") {
            try {
                const querySnapshot = await getDoc(this.docRef);
                const ownShipsObj = querySnapshot.data().ships[this.user];
                const oppShipsObj = querySnapshot.data().ships[this.opp];
                oppShipsObj[el].hp--;
                oppShipsObj[el].isAlive = oppShipsObj[el].hp > 0;
                await updateDoc(this.docRef, {
                    ships: { [this.user]: ownShipsObj, [this.opp]: oppShipsObj },
                });
            } catch (e) {
                console.error("Error updating document: ", e);
            }
            this.oppShips[el].hp--;
            res.ship = el;
            if (this.oppShips[el].hp == 0) {
                this.oppShips[el].isAlive = false;
                res.message += el + "を撃沈しました！";
            } else {
                res.message += el + "に攻撃しました。";
            }
        } else {
            res.message += "攻撃は外れました。";
        }
        const surr = await this.getOppSurrounding(pos);
        if (surr.length > 0) {
            res.message += "攻撃した場所は";
            surr.forEach((el) => {
                res.message += el + "、";
            });
            let tmp = res.message.slice(0, -1);
            res.message = tmp + "の近くでした。";
        }
        await this.updateOwnField();
        await this.updateOwnShips();
        this.updateBoard();
        await this.changeTurn();
        return new Promise((resolve) => {
            resolve(res);
        });
    }

}

export default async function gameInit(db, roomID, user) {

    const docRef = doc(db, "rooms", roomID);
    const game = new Game(user, docRef);

    try {
        const querySnapshot = await getDoc(game.docRef);
        game.userName = querySnapshot.data().users[game.user];
        game.oppName = querySnapshot.data().users[game.opp];
    } catch (e) {
        console.error("Error getting document: ", e);
    }

    async function setInitialState() {
        game.state = "setInitialState";
        console.log("setInitialState Start");
        async function setShip(ship) {
            game.updateMessage(ship.type + "艦を配置する場所を選択してください（クリックで選択）。");
            while (true) {
                const el = await game.readUserClick();
                if (el.innerHTML == "") {
                    ship.x = parseInt(el.id[5]);
                    ship.y = parseInt(el.id[4]);
                    break;
                } else {
                    game.updateMessage("他の場所を選択してください。");
                }
            }
            await game.updateOwnField();
            game.updateBoard();
        }
        await setShip(game.ownShips["W"]);
        await setShip(game.ownShips["C"]);
        await setShip(game.ownShips["S"]);
        await game.updateOwnShips();
        await game.changeTurn();
        console.log("setInitialState End");
        if (game.user == 1) {
            turnWait(game, "");
        } else {
            waitInitialState();
        }
    }

    async function waitInitialState() {
        game.state = "waitInitialState";
        console.log("waitInitialState Start");
        game.updateMessage("相手の配置を待っています...");
        const waitInput = await onSnapshot(game.docRef, async () => {
            await game.loadTurn();
            if (game.turn == game.user) {
                waitInput();
                console.log("waitInitialState End");
                if (game.user == 0) {
                    turnPlay(game);
                } else {
                    setInitialState();
                }
            }
        });
    }

    game.initBoard();
    await game.loadTurn();
    if (game.user == game.turn) {
        setInitialState();
    } else {
        waitInitialState();
    }

}