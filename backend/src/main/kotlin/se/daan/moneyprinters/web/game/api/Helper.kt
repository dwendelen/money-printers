package se.daan.moneyprinters.web.game.api

data class GameMaster(
        val id: String,
        val name: String
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
