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
            JsonSubTypes.Type(value = DeclineThisSpace::class, name = "DeclineThisSpace"),
            JsonSubTypes.Type(value = PlaceBid::class, name = "PlaceBid"),
            JsonSubTypes.Type(value = PassBid::class, name = "PassBid"),
            JsonSubTypes.Type(value = BuyWonBid::class, name = "BuyWonBid"),
            JsonSubTypes.Type(value = DemandRent::class, name = "DemandRent"),
            JsonSubTypes.Type(value = PayRent::class, name = "PayRent"),
            JsonSubTypes.Type(value = EndTurn::class, name = "EndTurn"),
            JsonSubTypes.Type(value = AddOffer::class, name = "AddOffer"),
            JsonSubTypes.Type(value = UpdateOfferValue::class, name = "UpdateOfferValue"),
            JsonSubTypes.Type(value = RemoveOffer::class, name = "RemoveOffer"),
            JsonSubTypes.Type(value = AcceptTrade::class, name = "AcceptTrade"),
            JsonSubTypes.Type(value = RevokeTradeAcceptance::class, name = "RevokeTradeAcceptance"),
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
) :Command()

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
): Command()

data class DeclineThisSpace(
    val player: String
): Command()

data class PlaceBid(
    val player: String,
    val bid: Int
): Command()

data class PassBid(
    val player: String
): Command()

data class BuyWonBid(
    val player: String,
    val cash: Int,
    val borrowed: Int
): Command()

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
): Command()

data class AddOffer(
    val from: String,
    val to: String,
    val ownable: String,
    val value: Int
): Command()

data class UpdateOfferValue(
    val from: String,
    val to: String,
    val ownable: String,
    val value: Int
): Command()

data class RemoveOffer(
    val from: String,
    val to: String,
    val ownable: String
): Command()

data class AcceptTrade(
        val by: String,
        val other: String,
        val cashDelta: Int,
        val debtDelta: Int
): Command()

data class RevokeTradeAcceptance(
        val by: String,
        val other: String
): Command()
