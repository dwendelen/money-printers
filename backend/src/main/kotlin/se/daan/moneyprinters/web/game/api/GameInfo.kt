package se.daan.moneyprinters.web.game.api

import se.daan.moneyprinters.model.game.api.Event

data class GameInfo(
        val id: String,
        val events: List<Event>
)