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
            JsonSubTypes.Type(value = StartMoneyReceived::class, name = "StartMoneyReceived"),
            JsonSubTypes.Type(value = LandedOn::class, name = "LandedOn"),
            JsonSubTypes.Type(value = SpaceBought::class, name = "SpaceBought"),
            JsonSubTypes.Type(value = TurnEnded::class, name = "TurnEnded"),
        ]
)
sealed class Event

data class GameCreated(
        val gameMaster: String,
        val board: List<Space>,
        val fixedStartMoney: Int,
        val interestRate: Double,
        val returnRate: Double
): Event()

data class PlayerAdded(
        val id: String,
        val name: String,
        val color: String
): Event()

object GameStarted: Event()

data class NewTurnStarted(
        val player: String
): Event()

data class DiceRolled(
        val dice1: Int,
        val dice2: Int
): Event()

data class StartMoneyReceived(
        val player: String,
        val amount: Int
): Event()

data class LandedOn(
        val ground: String
): Event()

data class SpaceBought(
    val ground: String,
    val player: String,
    val cash: Int,
    val borrowed: Int,
): Event()

object TurnEnded: Event()
