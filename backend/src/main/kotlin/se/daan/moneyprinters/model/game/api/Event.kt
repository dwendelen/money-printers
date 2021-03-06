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
            JsonSubTypes.Type(value = PromotedToGameMaster::class, name = "PromotedToGameMaster"),
            JsonSubTypes.Type(value = GameStarted::class, name = "GameStarted"),
            JsonSubTypes.Type(value = NewTurnStarted::class, name = "NewTurnStarted"),
            JsonSubTypes.Type(value = DiceRolled::class, name = "DiceRolled"),
            JsonSubTypes.Type(value = StartMoneyReceived::class, name = "StartMoneyReceived"),
            JsonSubTypes.Type(value = LandedOnSafeSpace::class, name = "LandedOnSafeSpace"),
            JsonSubTypes.Type(value = LandedOnBuyableSpace::class, name = "LandedOnBuyableSpace"),
            JsonSubTypes.Type(value = SpaceBought::class, name = "SpaceBought"),
            JsonSubTypes.Type(value = BidStarted::class, name = "BidStarted"),
            JsonSubTypes.Type(value = BidPlaced::class, name = "BidPlaced"),
            JsonSubTypes.Type(value = BidPassed::class, name = "BidPassed"),
            JsonSubTypes.Type(value = BidWon::class, name = "BidWon"),
            JsonSubTypes.Type(value = LandedOnHostileSpace::class, name = "LandedOnHostileSpace"),
            JsonSubTypes.Type(value = RentDemanded::class, name = "RentDemanded"),
            JsonSubTypes.Type(value = RentPaid::class, name = "RentPaid"),
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
        val color: String,
        val startDebt: Int
): Event()

data class PromotedToGameMaster(
    val player: String
): Event()

object GameStarted: Event()

data class NewTurnStarted(
        val player: String
): Event()

data class DiceRolled(
        val player: String,
        val dice1: Int,
        val dice2: Int
): Event()

data class StartMoneyReceived(
        val player: String,
        val amount: Int
): Event()

data class LandedOnSafeSpace(
    val player: String,
    val ground: String
): Event()

data class LandedOnBuyableSpace(
        val player: String,
        val ground: String
): Event()

data class SpaceBought(
    val ground: String,
    val player: String,
    val cash: Int,
    val borrowed: Int,
): Event()

data class BidStarted(
    val ground: Int,
    val defaultWinner: String
): Event()

data class BidPlaced(
    val player: String,
    val bid: Int
): Event()

data class BidPassed(
    val player: String
): Event()

data class BidWon(
    val player: String,
    val bid: Int
): Event()

data class LandedOnHostileSpace(
        val player: String,
        val ground: String,
        val owner: String,
        val demandId: Int
): Event()

data class RentDemanded(
        val owner: String,
        val player: String,
        val rent: Int,
        val demandId: Int
): Event()

data class RentPaid(
    val player: String,
    val owner: String,
    val rent: Int,
    val demandId: Int
): Event()

object TurnEnded: Event()
