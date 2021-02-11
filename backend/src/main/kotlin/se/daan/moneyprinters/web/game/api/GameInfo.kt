package se.daan.moneyprinters.web.game.api


data class GameInfo(
        val id: String,
        val events: List<Event>
)