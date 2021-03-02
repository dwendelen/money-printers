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
            JsonSubTypes.Type(value = Street::class, name = "Street"),
            JsonSubTypes.Type(value = ActionSpace::class, name = "ActionSpace"),
            JsonSubTypes.Type(value = Utility::class, name = "Utility"),
            JsonSubTypes.Type(value = Station::class, name = "Station"),
            JsonSubTypes.Type(value = FreeParking::class, name = "FreeParking"),
            JsonSubTypes.Type(value = Prison::class, name = "Prison"),
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
) : Space()

data class Utility(
        override val id: String,
        override val text: String,
        val initialPrice: Int,
        val rent: Int,
        val rentAll: Int
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