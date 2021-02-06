package se.daan.moneyprinters.web.api

import org.springframework.boot.context.properties.ConstructorBinding

typealias UserId = String

data class CreateGame(
        val gameMaster: GameMaster
        //val interestRate: Int?, //default 20%
        //val returnRate: Int? //default interestRate / nbPlayers
)

data class GameMaster(
        val id: String,
        val name: String
)
