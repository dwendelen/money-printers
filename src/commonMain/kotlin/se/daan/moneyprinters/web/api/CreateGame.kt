package se.daan.moneyprinters.web.api

data class CreateGame(
    val interestRate: Int?, //default 20%
    val returnRate: Int? //default interestRate / nbPlayers
)