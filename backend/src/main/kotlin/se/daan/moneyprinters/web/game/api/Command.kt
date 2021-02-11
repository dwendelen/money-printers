package se.daan.moneyprinters.web.game.api

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

data class CreateGame(
        val gameMaster: GameMaster
        //val interestRate: Int?, //default 20%
        //val returnRate: Int? //default interestRate / nbPlayers
)

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes(
        value = [
            JsonSubTypes.Type(value = AddPlayer::class, name = "AddPlayer"),
        ]
)
sealed class Command

data class AddPlayer(
        val id: String,
        val name: String
): Command()
