package se.daan.moneyprinters.model.game.api

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo


@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes(
        value = [
            JsonSubTypes.Type(value = CreateGame::class, name = "CreateGame"),
            JsonSubTypes.Type(value = AddPlayer::class, name = "AddPlayer"),
            JsonSubTypes.Type(value = StartGame::class, name = "StartGame"),
            JsonSubTypes.Type(value = RollDice::class, name = "RollDice"),
        ]
)
sealed class Command

data class CreateGame(
        val gameMaster: String,
        val board: List<Space>
): Command()

data class AddPlayer(
        val id: String,
        val name: String
): Command()

object StartGame: Command()

object RollDice: Command()

object EndTurn:  Command()