package se.daan.moneyprinters.web.api

typealias UserId = String

data class CreateGame(
    val gameMaster: UserId,
    val interestRate: Int?, //default 20%
    val returnRate: Int? //default interestRate / nbPlayers
)