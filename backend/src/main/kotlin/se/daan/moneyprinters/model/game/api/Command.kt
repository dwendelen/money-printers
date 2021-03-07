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
            JsonSubTypes.Type(value = BuyThisSpace::class, name = "BuyThisSpace"),
            JsonSubTypes.Type(value = DemandRent::class, name = "DemandRent"),
            JsonSubTypes.Type(value = PayRent::class, name = "PayRent"),
            JsonSubTypes.Type(value = EndTurn::class, name = "EndTurn"),
        ]
)
sealed class Command

data class CreateGame(
        val gameMaster: String,
        val board: List<Space>,
        val fixedStartMoney: Int,
        val interestRate: Double,
        val returnRate: Double,
) : Command()

data class AddPlayer(
        val id: String,
        val name: String,
        val color: String
) : Command()

data class StartGame(
        val initiator: String
) : Command()

data class RollDice(
        val player: String
) : Command()

data class BuyThisSpace(
        val player: String,
        val cash: Int,
        val borrowed: Int
) : Command()

data class DemandRent(
    val owner: String,
    val demandId: Int
): Command()

data class PayRent(
    val player: String,
    val demandId: Int
): Command()

data class EndTurn(
        val player: String
) : Command()
