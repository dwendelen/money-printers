package se.daan.moneyprinters.web.game.api

data class GameMaster(
        val id: String,
        val name: String
)

data class Ground(
        val text: String,
        val color: String?
)
