package se.daan.moneyprinters.model.game.config
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

data class GameConfig(
        val defaultInterestRate: Double,
        val fixedStartMoney: Int,
        val decks: Map<String, Deck>,
        val board: List<Space>,
        val colors: Map<String, Color>
)

data class Deck(
        val cards: List<Card>
)

data class Card(
        val text: String,
        val actions: List<Action>
)

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes(
        value = [
            JsonSubTypes.Type(value = Street::class, name = "Street"),
            JsonSubTypes.Type(value = Station::class, name = "Station"),
            JsonSubTypes.Type(value = Utility::class, name = "Utility"),
            JsonSubTypes.Type(value = ActionSpace::class, name = "Action"),
            JsonSubTypes.Type(value = FreeParking::class, name = "FreeParking"),
            JsonSubTypes.Type(value = Prison::class, name = "Prison")
        ]
)
sealed class Space {
    abstract val id: String
    abstract val text: String
}

data class Street(
        override val id: String,
        override val text: String,
        val color: String,
        val initialPrice: Int,
        val rent: Int,
        val rentHouse: List<Int>,
        val rentHotel: Int,
        val priceHouse: Int,
        val priceHotel: Int
) : Space()

data class ActionSpace(
        override val id: String,
        override val text: String,
        val action: Action
) : Space()

data class Utility(
        override val id: String,
        override val text: String,
        val initialPrice: Int,
        val rentFactor: List<Int>
) : Space()

data class Station(
        override val id: String,
        override val text: String,
        val initialPrice: Int,
        val rent: List<Int>
) : Space()

data class FreeParking(
        override val id: String,
        override val text: String
) : Space()

data class Prison(
        override val id: String,
        override val text: String
) : Space()

data class Color(
        val color: String
)

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes(
        value = [
            JsonSubTypes.Type(value = Pay::class, name = "Pay"),
            JsonSubTypes.Type(value = PayPerAsset::class, name = "PayPerAsset"),
            JsonSubTypes.Type(value = Receive::class, name = "Receive"),
            JsonSubTypes.Type(value = ReceiveFromEveryPlayer::class, name = "ReceiveFromEveryPlayer"),
            JsonSubTypes.Type(value = GoForwardTo::class, name = "GoForwardTo"),
            JsonSubTypes.Type(value = GoBackTo::class, name = "GoBackTo"),
            JsonSubTypes.Type(value = GoForward::class, name = "GoForward"),
            JsonSubTypes.Type(value = GoBack::class, name = "GoBack"),
            JsonSubTypes.Type(value = GoToPrison::class, name = "GoToPrison"),
            JsonSubTypes.Type(value = LeavePrisonCard::class, name = "LeavePrisonCard"),
            JsonSubTypes.Type(value = TakeCard::class, name = "TakeCard")
        ]
)
sealed class Action

data class Pay(
        val amount: Int
) : Action()

data class PayPerAsset(
        val house: Int,
        val hotel: Int
) : Action()

data class Receive(
        val amount: Int
) : Action()

data class ReceiveFromEveryPlayer(
        val amount: Int
) : Action()

data class GoForwardTo(
        val to: String
) : Action()

data class GoBackTo(
        val to: String
) : Action()

data class GoForward(
        val steps: Int
)

data class GoBack(
        val steps: Int
) : Action()

data class GoToPrison(
        val prison: String
) : Action()

object LeavePrisonCard : Action()

data class TakeCard(
        val deck: String
) : Action()
