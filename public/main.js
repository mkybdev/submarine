import { getDoc, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export default async function main(db, roomID, user) {

    const docRef = doc(db, "rooms", roomID);

    init();

    let Game = class {
        constructor(user) {
            this.user = user;
            this.ownfield;
            this.oppfield;
            this.turn;
            init();
        }
        async updateOwnField() {
            const querySnapshot = await getDoc(docRef);
            const field = querySnapshot.data().ownfield;
            this.ownfield = field;
        }
        async updateOppField() {
            const querySnapshot = await getDoc(docRef);
            const field = querySnapshot.data().oppfield;
            this.oppfield = field;
        }
        async updateTurn() {
            const querySnapshot = await getDoc(docRef);
            const turn = querySnapshot.data().turn;
            this.turn = turn;
        }
        async writeField(val, cd) {
            this.updateOwnField();
            this.ownfield[cd[0]][cd[1]] = val;
            await updateDoc(docRef, {
                ownfield: this.ownfield,
            });
        }
        updateBoard() {
            updateOwnField();
            const board = document.getElementById("board");
            board.innerHTML = "";
            for (let i = 0; i < 5; i++) {
                let tr = document.createElement('tr');
                this.ownfield[i].forEach((col) => {
                    let td = document.createElement('td');
                    td.style.width = "40px";
                    td.style.height = "40px";
                    td.innerHTML = "<div class=\"cell\" style=\"width=100%; height: 100%; display: flex; justify-content: center; align-items: center;\">" + col + "</div>";
                    tr.appendChild(td);
                });
                board.appendChild(tr);
            }
        }
    }
    
    async function init() {

        let flag = 0;

        async function setInitialState() {
            loadField();
            updateBoard();
            async function cellClickHandler(ship) {
                document.getElementById("gameMessage").textContent = "Select Where to Place " + ship + " Ship";
                let cells = document.getElementsByClassName("cell");
                try {
                    for (let i = 0; i < cells.length; i++) {
                        cells[i].addEventListener('click', async function setCell() {
                            this.innerHTML = ship;
                            writeField(ship, [Math.floor(i / 5), i % 5]);
                            cells[i].removeEventListener('click', setCell);
                        });
                    }
                } catch (e) {
                    console.error("Error placing a ship: ", e);
                }
            }
            cellClickHandler("W").then(() => {
                cellClickHandler("C").then(() => {
                    cellClickHandler("S").then(async () => {
                        try {
                            getTurn();
                            const opp = 1 - turn;
                            await updateDoc(docRef, {
                                turn: opp,
                            });
                            updateBoard();
                            flag += 1;
                            if (flag != 2) {
                                waitInitialState();
                            } else {
                                return "end";
                            }
                        } catch (e) {
                            console.error("Error updating document: ", e);
                        };
                    }).then((res) => {
                        if (res == "end") {
                            game();
                        }
                    });;
                });
            });
        }

        async function waitInitialState() {
            document.getElementById("gameMessage").textContent = "Waiting for the opponent...";
            const waitInput = await onSnapshot(docRef, () => {
                getTurn();
                updateBoard();
                if (turn == user) {
                    waitInput();
                    flag += 1;
                    if (flag != 2) {
                        setInitialState();
                    } else {
                        game();
                    }
                }
            });
        }

        getTurn();
        if (user == turn) {
            setInitialState();
        } else {
            waitInitialState();
        }

    }
    
    function game() {
        if (user == turn) {
            document.getElementById("gameMessage").textContent = "Your Turn!";
        } else {
            document.getElementById("gameMessage").textContent = "Waiting for the opponent...";
        }
    }

    init();

}