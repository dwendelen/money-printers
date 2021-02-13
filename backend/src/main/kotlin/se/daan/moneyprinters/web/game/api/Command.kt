package se.daan.moneyprinters.web.game.api

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

data class CreateGame(
        val gameMaster: String
        //val interestRate: Int?, //default 20%
        //val returnRate: Int? //default interestRate / nbPlayers
)
