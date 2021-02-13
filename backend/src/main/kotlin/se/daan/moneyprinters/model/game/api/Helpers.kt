package se.daan.moneyprinters.model.game.api

sealed class Space {
    abstract val text: String
}

class Street(
        override val text: String,
        val color: String
) : Space()

class ActionSpace(
        override val text: String,
) : Space()

class Utility(
        override val text: String,
) : Space()

class Station(
        override val text: String
) : Space()

class FreeParking(
        override val text: String
) : Space()

class Prison(
        override val text: String
) : Space()