package se.daan.moneyprinters.web.api

data class GameInfo(
        val id: String,
        val players: Iterable<Player>,
        val board: List<Ground>,
        val gameMaster: String
)

data class Player(
        val id: String,
        val name: String,
        val money: Int,
        val debt: Int
)

data class Ground(
        val text: String,
        val color: String?
)
