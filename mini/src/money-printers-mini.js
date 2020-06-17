let players = []
let startMoney = 200;
let interestRate = 0.2;
let returnRate = 0;
let economy = 0;
let currentPlayer = null;

function setValues() {
    let start1 = document.getElementById("startMoneyInput").value;
    let start2 = parseFloat(start1);
    if(!isNaN(start2)) {
        startMoney = start2;
    }
    
    let interest1 = document.getElementById("interest").value;
    let interest2 = parseFloat(interest1);
    if(!isNaN(interest2)) {
        interestRate = interest2;
    }

    let return1 = document.getElementById("return").value;
    let return2 = parseFloat(return1);
    if(!isNaN(return2)) {
        returnRate = return2;
    }

    render();
}

function add() {
    let playerNameInput = document.getElementById("playerNameInput");
    let name = playerNameInput.value
    if(name === '') {
        alert("Empty name")
        return
    }

    let table = document.getElementById("playersTable");
    let row = table.insertRow(-1);
    let nameCell = row.insertCell(-1);
    let moneyCell = row.insertCell(-1);
    moneyCell.classList.add("amount");
    let assetCell = row.insertCell(-1);
    assetCell.classList.add("amount");
    let debtCell = row.insertCell(-1);
    debtCell.classList.add("amount");
    let startCell = row.insertCell(-1);
    startCell.classList.add("amount");
    
    let player = new Player(
        name,
        nameCell,
        moneyCell,
        assetCell,
        debtCell,
        startCell
    );

    row.addEventListener("click", () => {
        currentPlayer = player;
        render();
    });

    let opt1 = document.createElement('option');
    opt1.text = player.name;
    document.getElementById("receiveFrom").appendChild(opt1);

    let opt2 = document.createElement('option');
    opt2.text = player.name;
    document.getElementById("payTo").appendChild(opt2);

    let opt3 = document.createElement('option');
    opt3.text = player.name;
    document.getElementById("buyFrom").appendChild(opt3);
    
    players.push(player);
    
    render();
}

function receive() {
    if(!currentPlayer) {
        return;
    }

    let price = parseInt(document.getElementById("receivePrice").value);
    let idx = document.getElementById("receiveFrom").selectedIndex;

    if(isNaN(price)) {
        alert("Invalid price");
        return;
    }

    if(idx === 0) {
        economy -= price;
        currentPlayer.money += price;

        console.log(currentPlayer.name +
            " received " + price
        );
    } else {
        let other = players[idx - 1];

        other.money -= price;
        currentPlayer.money += price;

        console.log(currentPlayer.name +
            " received " + price +
            " from " + other.name
        );
    }


    render();
}

function pay() {
    if(!currentPlayer) {
        return;
    }

    let price = parseInt(document.getElementById("payPrice").value);
    let idx = document.getElementById("payTo").selectedIndex;

    if(isNaN(price)) {
        alert("Invalid price");
        return;
    }

    if(idx === 0) {
        economy += price;
        currentPlayer.money -= price;

        console.log(currentPlayer.name +
            " payed " + price
        );
    } else {
        let other = players[idx - 1];

        other.money += price;
        currentPlayer.money -= price;

        console.log(currentPlayer.name +
            " payed " + price +
            " to " + other.name
        );
    }

    render();
}

function buy() {
    if(!currentPlayer) {
        return;
    }

    let idx = document.getElementById("buyFrom").selectedIndex;
    let price = parseInt(document.getElementById("buyPrice").value)
    let borrow = parseInt(document.getElementById("buyBorrow").value)
    let value = parseInt(document.getElementById("buyValue").value)
    let original = parseInt(document.getElementById("buyOriginal").value)

    if(isNaN(price)) {
        alert("Invalid price");
        return;
    }

    if(isNaN(borrow)) {
        alert("Invalid borrow");
        return;
    }

    if(isNaN(value)) {
        alert("Invalid asset value");
        return;
    }

    if(idx !== 0 && isNaN(original)) {
        alert("Invalid original value");
        return;
    }

    if(idx === 0) {
        economy += price;
        currentPlayer.money -= price;
        currentPlayer.money += borrow;
        currentPlayer.debt += borrow;
        currentPlayer.assets += value;

        console.log(currentPlayer.name +
            " payed " + price +
            " of which he borrowed " + borrow +
            " for an asset of value " + value
        );
    } else {
        let other = players[idx - 1];

        other.money += price;
        currentPlayer.money -= price;
        currentPlayer.money += borrow;
        currentPlayer.debt += borrow;
        other.assets -= original;
        currentPlayer.assets += value;

        console.log(currentPlayer.name +
            " payed " + price +
            " of which he borrowed " + borrow +
            " for an asset of value " + value +
            " from " + other.name +
            " that had a value of " + original
        );
    }

    render();
}

function payBack() {
    if(!currentPlayer) {
        return;
    }

    let price = parseInt(document.getElementById("payBackPrice").value);
    if(isNaN(price)) {
        alert("Invalid price");
        return;
    }

    currentPlayer.money -= price;
    currentPlayer.debt -= price;

    console.log(currentPlayer.name +
        " payed back " + price
    );

    render();
}

function priceChange() {
    let price = document.getElementById("buyPrice").value;
    let elem1 = document.getElementById("buyBorrow");
    let elem2 = document.getElementById("buyValue");

    if(!price) {
        return;
    }
    if(!elem1.value) {
        elem1.value = price;
    }
    if(!elem2.value) {
        elem2.value = price;
    }
}

function render() {
    document.getElementById("economySpan").innerText = economy;

    players.forEach(p => p.render());

    document.getElementById("playerNameInput").value = "";

    if(currentPlayer) {
        document.getElementById("actionHeader").innerText = currentPlayer.name;
    }

    document.getElementById("receiveFrom").selectedIndex = 0;
    document.getElementById("receivePrice").value = "";

    document.getElementById("payTo").selectedIndex = 0;
    document.getElementById("payPrice").value = "";

    document.getElementById("buyFrom").selectedIndex = 0;
    document.getElementById("buyPrice").value = "";
    document.getElementById("buyBorrow").value = "";
    document.getElementById("buyValue").value = "";
    document.getElementById("buyOriginal").value = "";

    document.getElementById("payBackPrice").value = "";


    document.getElementById("startMoney").innerText = startMoney;
    document.getElementById("interestRate").innerText = interestRate;
    document.getElementById("returnRate").innerText = returnRate;

    document.getElementById("startMoneyInput").value = "";
    document.getElementById("interest").value = "";
    document.getElementById("return").value = "";
}

class Player {
    constructor(name, nameCell, moneyCell, assetCell, debtCell, startCell) {
        this.name = name;
        this.money = 0;
        this.assets = 0;
        this.debt = 0;
        
        this.nameCell = nameCell;
        this.moneyCell = moneyCell;
        this.assetCell = assetCell;
        this.debtCell = debtCell;
        this.startCell = startCell;
    }
    
    render() {
        this.nameCell.innerText = this.name;
        this.moneyCell.innerText = this.money;
        this.assetCell.innerText = this.assets;
        this.debtCell.innerText = this.debt;
        this.startCell.innerText = this.calcStart();
    }  
    
    calcStart() {
        let raw = startMoney + economy * returnRate - this.debt * interestRate;
        return Math.ceil(raw);
    }
}