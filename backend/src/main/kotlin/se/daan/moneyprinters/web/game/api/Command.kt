package se.daan.moneyprinters.web.game.api

data class CreateGame(
        val gameMaster: GameMaster
        //val interestRate: Int?, //default 20%
        //val returnRate: Int? //default interestRate / nbPlayers
)
