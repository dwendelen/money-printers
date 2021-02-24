package se.daan.moneyprinters.web.game.api

import se.daan.moneyprinters.model.game.api.Event

data class CommandResult(
        val success: Boolean,
        val events: List<Event>
)
