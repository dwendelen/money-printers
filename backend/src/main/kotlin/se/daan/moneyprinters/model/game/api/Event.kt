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
            JsonSubTypes.Type(value = GameCreated::class, name = "GameCreated"),
            JsonSubTypes.Type(value = PlayerAdded::class, name = "PlayerAdded"),
            JsonSubTypes.Type(value = GameStarted::class, name = "GameStarted"),
            JsonSubTypes.Type(value = NewTurnStarted::class, name = "NewTurnStarted"),
            JsonSubTypes.Type(value = DiceRolled::class, name = "DiceRolled"),
            JsonSubTypes.Type(value = LandedOn::class, name = "LandedOn"),
            JsonSubTypes.Type(value = TurnEnded::class, name = "TurnEnded"),
        ]
)
sealed class Event

data class GameCreated(
        val gameMaster: String,
        val board: List<Space>
): Event()

data class PlayerAdded(
        val id: String,
        val name: String
): Event()

object GameStarted: Event()

data class NewTurnStarted(
        val player: String
): Event()

data class DiceRolled(
        val dice1: Int,
        val dice2: Int
): Event()

data class LandedOn(
        val ground: String
): Event()

object TurnEnded: Event()
