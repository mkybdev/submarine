import { getDoc, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { turnPlay, turnWait } from "./game.js";

export class Ship {
    constructor(type) {
        this.type = type;
        this.name = (type == "W") ? "戦艦" : (type == "C") ? "巡洋艦" : "潜水艦";
        this.x;
        this.y;
        this.hp = (type == "W") ? 3 : (type == "C") ? 2 : 1;
        this.isAlive = true;
    }
}

export class Game {

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
        this.message = "";
        this.cautionFlag = false;
    }

    updateMessage(msg) {
        if (window.getComputedStyle(document.getElementById("mesSP")).getPropertyValue('display') == "none") {
            document.getElementById("gameMessagePC").innerHTML = msg;
        } else {
            document.getElementById("gameMessageSP").innerHTML = msg;
        }
        this.message = msg;
        console.log("updateMessage OK");
    }

    updateCaution(msg) {
        this.cautionFlag = true;
        if (window.getComputedStyle(document.getElementById("mesSP")).getPropertyValue('display') == "none") {
            document.getElementById("gameMessagePC").innerHTML = msg;
        } else {
            document.getElementById("gameMessageSP").innerHTML = msg;
        }
        setTimeout(() => {
            if (this.cautionFlag) {
                if (window.getComputedStyle(document.getElementById("mesSP")).getPropertyValue('display') == "none") {
                    document.getElementById("gameMessagePC").innerHTML = this.message;
                } else {
                    document.getElementById("gameMessageSP").innerHTML = this.message;
                }
                this.cautionFlag = false;
            }
        }, 1000);
        console.log("updateCaution OK");
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
                    name: this.ownShips[key].name,
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
            console.log("changeTurn OK");
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
                if (ship.x != undefined && ship.isAlive) {
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
                    btn.style.border = "1.75px solid white";
                    btn.style.backgroundColor = "black";
                    btn.style.width = "100%";
                    btn.style.height = "100%";
                    btn.style.padding = "0";
                    if (window.getComputedStyle(document.getElementById("mesSP")).getPropertyValue('display') == "none") {
                        btn.style.fontSize = "2.5em";
                    } else {
                        btn.style.fontSize = "1.75em";
                    }
                    btn.id = "cell" + i + j;
                    board.appendChild(btn);
                }
            }
            console.log("initBoard OK");
        } catch (e) {
            console.error("initBoard Error: ", e);
        }
    }

    async updateBoard() {
        try {
            const cells = document.querySelectorAll(".cell");
            cells.forEach((cell) => {
                cell.innerHTML = "";
            });
            Object.keys(this.ownShips).forEach((key) => {
                const ship = this.ownShips[key];
                if (ship.x != undefined && ship.isAlive) {
                    document.getElementById("cell" + ship.y + ship.x).innerHTML =
                        (ship.type == "W") ? "<img src=\"./images/warship.png\" class=\"shipIcon\" name=\"W\"><div id=\"hp\">" + ship.hp + "</div>" :
                        (ship.type == "C") ? "<img src=\"./images/cruiser.png\" class=\"shipIcon\" name=\"C\"><div id=\"hp\">" + ship.hp + "</div>" :
                        "<img src=\"./images/submarine.png\" class=\"shipIcon\" name=\"S\"><div id=\"hp\">" + ship.hp + "</div>";
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
                    resolve(e.currentTarget);
                });
            });
        });
    }

    readUserInput() {
        return new Promise((resolve) => {
            document.addEventListener("click", function click(e) {
                    document.removeEventListener("click", click);
                    resolve(e.target.id);
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
        console.log("move Start")
        document.getElementById("faceSP").innerHTML = "<img src=\"./images/normal.gif\">";
        document.getElementById("facePC").innerHTML = "<img src=\"./images/normal.gif\">";
        this.updateMessage("どの艦を動かしますか？");
        let elname;
        while (true) {
            const el = await this.readUserClick();
            elname = el.children[0].name;
            if (elname != undefined) {
                break;
            } else {
                this.updateCaution("別の場所を選択してください。");
            }
        }
        const ship = this.ownShips[elname];
        let moveTo = [ship.x, ship.y];
        this.updateMessage("艦の移動先を選択してください。");
        const collisionCheck = (pos) => {
            let res = false;
            ["W", "C", "S"].forEach((key) => {
                if (pos[0] == this.ownShips[key].x && pos[1] == this.ownShips[key].y && this.ownShips[key].isAlive) {
                    res = true;
                }
            });
            return res;
        }
        let res = { handType: "", shipType: "", shipName: "", direction: "", distance: 0, message: "" };
        while (true) {
            document.getElementById("cell" + ship.y + ship.x).style.border = "2px solid blue";
            document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
            const button = await this.readUserInput();
            if (button == "enter") {
                if (collisionCheck(moveTo, ship.type)) {
                    this.updateCaution("すでに艦がいる場所には動かせません。");
                } else {
                    document.getElementById("cell" + ship.y + ship.x).style.border = "1px solid white";
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    res.handType = "M";
                    res.shipType = ship.type;
                    res.shipName = ship.name;
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
                    await this.updateBoard();
                    let tmp;
                    if (res.direction == "x") {
                        tmp = (res.distance > 0) ? "右" : "左";
                    } else {
                        tmp = (res.distance > 0) ? "下" : "上";
                    }
                    res.message = ship.name + "を" + tmp + "に" + Math.abs(res.distance) + "マス移動しました。";
                    await this.changeTurn();
                    break;
                }
            } else if (button == "up") {
                if (!(moveTo[0] == ship.x || moveTo[1]-1 == ship.y)) {
                    this.updateCaution("艦は縦横のどちらかにのみ動かせます。");
                } else if (moveTo[1] != 0) {
                    const tmp = [moveTo[0], moveTo[1]-1];
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    moveTo = tmp;
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
                } else {
                    this.updateCaution("他の場所を選択してください。");
                }
            } else if (button == "down") {
                if (!(moveTo[0] == ship.x || moveTo[1]+1 == ship.y)) {
                    this.updateCaution("艦は縦横のどちらかにのみ動かせます。");
                } else if (moveTo[1] != 4) {
                    const tmp = [moveTo[0], moveTo[1]+1];
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    moveTo = tmp;
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
                } else {
                    this.updateCaution("他の場所を選択してください。");
                }
            } else if (button == "left") {
                if (!(moveTo[0]-1 == ship.x || moveTo[1] == ship.y)) {
                    this.updateCaution("艦は縦横のどちらかにのみ動かせます。");
                } else if (moveTo[0] != 0) {
                    const tmp = [moveTo[0]-1, moveTo[1]];
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    moveTo = tmp;
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
                } else {
                    this.updateCaution("他の場所を選択してください。");
                }
            } else if (button == "right") {
                if (!(moveTo[0]+1 == ship.x || moveTo[1] == ship.y)) {
                    this.updateCaution("艦は縦横のどちらかにのみ動かせます。");
                } else if (moveTo[0] != 4) {
                    const tmp = [moveTo[0]+1, moveTo[1]];
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "1px solid white";
                    moveTo = tmp;
                    document.getElementById("cell" + moveTo[1] + moveTo[0]).style.border = "2px solid red";
                } else {
                    this.updateCaution("他の場所を選択してください。");
                }
            }
        }
        console.log("move End")
        return new Promise((resolve) => {
            resolve(res);
        });
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
        console.log("attack Start")
        await this.loadOppField();
        await this.loadOppShips();
        document.getElementById("faceSP").innerHTML = "<img src=\"./images/normal.gif\">";
        document.getElementById("facePC").innerHTML = "<img src=\"./images/normal.gif\">";
        this.updateMessage("攻撃する場所を選択してください。");
        const canAttack = (pos) => {
            let res = false;
            ["W", "C", "S"].forEach((key) => {
                let xdif = Math.abs(pos[0] - this.ownShips[key].x);
                let ydif = Math.abs(pos[1] - this.ownShips[key].y);
                if (xdif < 2 && ydif < 2 && this.ownShips[key].isAlive) {
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
                this.updateCaution("他の場所を選択してください。");
            }
        }
        this.updateMessage("(" + [pos[0]+1, pos[1]+1] + ")を攻撃中です…");
        let res = { handType: "A", pos: [pos[0]+1, pos[1]+1], ship: "", shipName: "", message: "" };
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
            res.shipName = this.oppShips[el].name;
            if (this.oppShips[el].hp == 0) {
                this.oppShips[el].isAlive = false;
                res.message += res.shipName + "を撃沈しました！";
            } else {
                res.message += res.shipName + "に攻撃しました。";
            }
        } else {
            res.message += "攻撃は外れました。";
        }
        const surr = await this.getOppSurrounding(pos);
        if (surr.length > 0) {
            res.message += "攻撃した場所は";
            surr.forEach((el) => {
                res.message += this.oppShips[el].name + "と";
            });
            let tmp = res.message.slice(0, -1);
            res.message = tmp + "の近くでした。";
        }
        await this.updateOwnField();
        await this.updateOwnShips();
        await this.updateBoard();
        await this.changeTurn();
        console.log("attack End")
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
            game.updateMessage(ship.name + "を配置する場所を選択してください。");
            while (true) {
                const el = await game.readUserClick();
                if (el.innerHTML == "") {
                    ship.x = parseInt(el.id[5]);
                    ship.y = parseInt(el.id[4]);
                    break;
                } else {
                    game.updateCaution("他の場所を選択してください。");
                }
            }
            await game.updateOwnField();
            await game.updateBoard();
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
        game.updateMessage("相手が艦を配置するのを待っています...");
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