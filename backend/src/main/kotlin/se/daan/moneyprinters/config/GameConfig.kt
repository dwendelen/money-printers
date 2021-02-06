package se.daan.moneyprinters.config

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConfigurationProperties("game")
@ConstructorBinding
data class GameConfig(
        val prison: String,
        val maxAmountOfHousesInGame: Int,
        val maxAmountOfHotelsInGame: Int,
        val maxAmountOfHousesOnStreet: Int,
        val defaultInterestRate: Double,
        val decks: Map<String, Deck>,
        //val decks: Decks,
        val board: List<Space>,
        val colors: Map<String, Color>
)
@ConstructorBinding
data class Decks(
        val algemeenfonds: Deck,
        val kanskaarten: Deck
)
@ConstructorBinding
data class Deck(
        val cards: List<Card>
)

@ConstructorBinding
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
            JsonSubTypes.Type(value = FreeParking::class, name = "FreeParking")
        ]
)
sealed class Space {
    abstract val id: String
    abstract val text: String
}

@ConstructorBinding
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

@ConstructorBinding
data class ActionSpace(
        override val id: String,
        override val text: String,
        val action: Action
) : Space()

@ConstructorBinding
data class Utility(
        override val id: String,
        override val text: String,
        val initialPrice: Int,
        val rentFactor: List<Int>
) : Space()

@ConstructorBinding
data class Station(
        override val id: String,
        override val text: String,
        val initialPrice: Int,
        val rent: List<Int>
) : Space()

@ConstructorBinding
data class FreeParking(
        override val id: String,
        override val text: String
) : Space()

@ConstructorBinding
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
            JsonSubTypes.Type(value = LeavePrison::class, name = "LeavePrison"),
            JsonSubTypes.Type(value = TakeCard::class, name = "TakeCard")
        ]
)
sealed class Action

@ConstructorBinding
data class Pay(
        val amount: Int
) : Action()

@ConstructorBinding
data class PayPerAsset(
        val house: Int,
        val hotel: Int
) : Action()

@ConstructorBinding
data class Receive(
        val amount: Int
) : Action()

@ConstructorBinding
data class ReceiveFromEveryPlayer(
        val amount: Int
) : Action()

@ConstructorBinding
data class GoForwardTo(
        val to: String
) : Action()

@ConstructorBinding
data class GoBackTo(
        val to: String
) : Action()

@ConstructorBinding
data class GoForward(
        val steps: Int
)

@ConstructorBinding
data class GoBack(
        val steps: Int
) : Action()

object GoToPrison : Action()

object LeavePrison : Action()

@ConstructorBinding
data class TakeCard(
        val deck: String
) : Action()
