package se.daan.moneyprinters.model.game.api

sealed class Space {
    abstract val id: String
    abstract val text: String
}

class Street(
        override val id: String,
        override val text: String,
        val color: String
) : Space()

class ActionSpace(
        override val id: String,
        override val text: String,
) : Space()

class Utility(
        override val id: String,
        override val text: String,
) : Space()

class Station(
        override val id: String,
        override val text: String
) : Space()

class FreeParking(
        override val id: String,
        override val text: String
) : Space()

class Prison(
        override val id: String,
        override val text: String
) : Space()