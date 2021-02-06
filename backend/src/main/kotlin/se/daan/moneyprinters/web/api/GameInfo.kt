package se.daan.moneyprinters.web.api

data class GameInfo(
        val id: String,
        val players: Iterable<Player>
)

data class Player(
        val id: String,
        val name: String
)
