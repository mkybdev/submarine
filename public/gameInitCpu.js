import { getDoc, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { Game, Ship } from "./gameInit.js";

class GameCpu extends Game {

    constructor() {
        super(0, null);
        this.hand = {};
    }

    async updateOwnField() {
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
        console.log("updateOwnField OK");
    }

    async updateOppField() {
        Object.keys(this.oppField).forEach((key) => {
            for (let i = 0; i < 5; i++) {
                this.oppField[key][i] = "";
            }
        });
        Object.keys(this.oppShips).forEach((key) => {
            const ship = this.oppShips[key];
            if (ship.x != undefined && ship.isAlive) {
                this.oppField[ship.y][ship.x] = ship.type;
            }
        });
        console.log("updateOppField OK");
    }

    async updateOwnShips() {
        return true;
    }

    async changeTurn() {
        return true;
    }

    async loadOppField() {
        return true;
    }

    async loadOppShips() {
        return true;
    }

    async getOwnSurrounding(pos) {
        await this.updateOwnField();
        let res = [];
        for (let x = pos[0]-1; x <= pos[0]+1; x++) {
            for (let y = pos[1]-1; y <= pos[1]+1; y++) {
                if (x == pos[0] && y == pos[1]) {
                    continue;
                }
                const el = await this.getOwn([x, y]);
                if (el != "" && el != undefined) {
                    if (this.ownShips[el].isAlive) {
                        res.push(el);
                    }
                }
            }
        }
        return res;
    }

    async getOppSurrounding(pos) {
        await this.updateOppField();
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

    async getOpp(pos) {
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

    async attack() {
        this.state = "attack";
        console.log("attack Start");
        this.updateMessage("攻撃する場所を選択してください。");
        const canAttack = (pos) => {
            let res = false;
            Object.keys(this.oppShips).forEach((key) => {
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
        let res = { handType: "A", pos: pos, ship: "", shipName: "", message: "" };
        const el = await this.getOpp(pos);
        if (el != "") {
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
        this.updateBoard();
        console.log("attack End");
        return new Promise((resolve) => {
            resolve(res);
        });
    }

    async moveCpu() {
        this.state = "moveCpu";
        console.log("moveCpu Start");
        this.updateOppField();
        let rd = Math.floor(Math.random() * 3);
        while (!this.oppShips[Object.keys(this.oppShips)[rd]].isAlive) {
            rd = Math.floor(Math.random() * 3);
        }
        const ship = this.oppShips[Object.keys(this.oppShips)[rd]];
        let moveTo = [ship.x, ship.y];
        while (await this.getOpp(moveTo) != "") {
            moveTo = [ship.x, ship.y];
            const xy = Math.floor(Math.random() * 2);
            const cd = Math.floor(Math.random() * 5);
            moveTo[xy] = cd;
        }
        let res = { handType: "M", shipType: ship.type, shipName: ship.name, direction: "", distance: 0, message: "" };
        if (moveTo[0] - ship.x != 0) {
            res.direction = "x";
            res.distance = moveTo[0] - ship.x;
        } else {
            res.direction = "y";
            res.distance = moveTo[1] - ship.y;
        }
        ship.x = moveTo[0];
        ship.y = moveTo[1];
        this.updateOppField();
        let tmp;
        if (res.direction == "x") {
            tmp = (res.distance > 0) ? "右" : "左";
        } else {
            tmp = (res.distance > 0) ? "下" : "上";
        }
        res.message = ship.name + "を" + tmp + "に" + Math.abs(res.distance) + "マス移動しました。";
        console.log("moveCpu End");
        return new Promise((resolve) => {
            resolve(res);
        });
    }

    async attackCpu() {
        this.state = "attack";
        console.log("attackCpu Start");
        const canAttack = (pos) => {
            let res = false;
            Object.keys(this.oppShips).forEach((key) => {
                let xdif = Math.abs(pos[0] - this.oppShips[key].x);
                let ydif = Math.abs(pos[1] - this.oppShips[key].y);
                if (xdif < 2 && ydif < 2 && this.oppShips[key].isAlive) {
                    res = true;
                }
            });
            return res;
        }
        let pos = [Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)];
        while (!canAttack(pos)) {
            pos = [Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)];
        }
        let res = { handType: "A", pos: pos, ship: "", shipName: "", "message": "" };
        const el = await this.getOwn(pos);
        if (el != "") {
            this.ownShips[el].hp--;
            res.ship = el;
            res.shipName = this.ownShips[el].name;
            if (this.ownShips[el].hp == 0) {
                this.ownShips[el].isAlive = false;
                res.message += res.shipName + "を撃沈しました！";
            } else {
                res.message += res.shipName + "に攻撃しました。";
            }
        } else {
            res.message += "攻撃は外れました。";
        }
        const surr = await this.getOwnSurrounding(pos);
        if (surr.length > 0) {
            res.message += "攻撃した場所は";
            surr.forEach((el) => {
                res.message += this.ownShips[el].name + "、";
            });
            let tmp = res.message.slice(0, -1);
            res.message = tmp + "の近くでした。";
        }
        this.updateBoard();
        console.log("attackCpu End");
        return new Promise((resolve) => {
            resolve(res);
        });
    }

}

export default async function gameInitCpu() {

    const game = new GameCpu();

    const fieldInitial = () => {
        let tmp = {};
        for (let i = 0; i < 5; i++) {
            tmp[i] = ["", "", "", "", ""];
        }
        return tmp;
    }
    game.ownField = fieldInitial();
    game.oppField = fieldInitial();

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
        game.updateBoard();
        await game.updateOwnField();
        console.log("setShip OK");
    }

    async function setShipCpu(ship) {
        let x = -1;
        let y;
        while (await game.getOpp([x, y]) != "" || x < 0) {
            x = Math.floor(Math.random() * 5);
            y = Math.floor(Math.random() * 5);
        }
        ship.x = x;
        ship.y = y;
        await game.updateOppField();
        console.log("setShipCpu OK");
    }

    async function setInitialState() {
        game.state = "setInitialState";
        console.log("setInitialState Start");
        await setShip(game.ownShips["W"]);
        await setShip(game.ownShips["C"]);
        await setShip(game.ownShips["S"]);
        await setShipCpu(game.oppShips["W"]);
        await setShipCpu(game.oppShips["C"]);
        await setShipCpu(game.oppShips["S"]);
        turnPlay(game);
        console.log("setInitialState End");
    }

    game.initBoard();
    setInitialState();

}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function turnPlay(game) {
    /*console.log(game.ownShips);
    console.log(game.ownField);*/
    console.log(game.oppShips);
    console.log(game.oppField);
    console.log("turnPlay Start");
    const hd = game.hand;
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
            game.updateMessage("相手が" + hd.shipName + "を" + tmp + "に" + Math.abs(hd.distance) + "マス動かしました。移動するか攻撃するかを選択してください。");
        } else if (hd.handType == "A") {
            if (hd.ship != "") {
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
                        const mes = "相手が(" + hd.pos + ")を攻撃し、" + hd.shipName + "が撃沈しました。あなたの負けです。";
                        gameLose(game, mes);
                        return;
                    } else { 
                        game.updateMessage("相手が(" + hd.pos + ")を攻撃し、" + hd.shipName + "が撃沈しました。移動するか攻撃するかを選択してください。");
                    }
                } else {
                    game.updateBoard();
                    game.updateMessage("相手が(" + hd.pos + ")を攻撃し、" + hd.shipName + "に命中しました。移動するか攻撃するかを選択してください。");
                }
            } else { 
                game.updateMessage("相手が(" + hd.pos + ")を攻撃しました。移動するか攻撃するかを選択してください。");
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
    game.hand = res;
    console.log("turnPlay End");
    turnWait(game, res.message); 
}

async function turnWait(game, mes) {
    console.log("turnWait Start");
    game.updateOppField();
    let isAllSunk = true;
    Object.keys(game.oppShips).forEach((key) => {
        if (game.oppShips[key].isAlive) {
            isAllSunk = false;
        }
    });
    if (isAllSunk) {
        const m = mes + "あなたは相手の艦を全て撃沈しました。あなたの勝ちです。";
        gameWin(game, m);
        return;
    } else {
        game.updateMessage(mes + "相手を待っています…");
        await sleep(2000);
        const tmp = Math.floor(Math.random() * 2);
        let res;
        if (tmp == 0) {
            res = await game.moveCpu();
        } else {
            res = await game.attackCpu();
        }
        game.hand = res;
        console.log("turnWait End");
        await game.updateOppField();
        turnPlay(game);
    }
}

async function gameWin(game, mes) {
    console.log("gameWin Start");
    game.updateMessage(mes);
    await sleep(5000);
    window.location.reload();
    console.log("gameWin End");
}

async function gameLose(game, mes) {
    console.log("gameEnd Start");
    game.updateMessage(mes);
    await sleep(5000);
    window.location.reload();
    console.log("gameEnd End");
}