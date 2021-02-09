package se.daan.moneyprinters.web.game.api

sealed class Event

data class GameCreated(
        val gameMaster: GameMaster,
        val board: List<Ground>
): Event()