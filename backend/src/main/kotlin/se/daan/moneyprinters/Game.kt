package se.daan.moneyprinters


class Game(
        val id: String,
        val players: MutableMap<String, Player>,
        val gameMaster: Player,
        val board: List<Space>
) {
}

class Player(
        val id: String,
        val name: String,
        val money: Int,
        val debt: Int
)

sealed class Space {
    abstract val text: String
}

data class Street(
        override val text: String,
        val color: String
) : Space()

data class ActionSpace(
        override val text: String,
) : Space()

data class Utility(
        override val text: String,
) : Space()

data class Station(
        override val text: String
) : Space()

data class FreeParking(
        override val text: String
) : Space()
