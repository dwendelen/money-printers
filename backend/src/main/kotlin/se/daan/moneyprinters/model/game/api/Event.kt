package se.daan.moneyprinters.model.game.api

sealed class Event

data class GameCreated(
        val gameMaster: PlayerInfo,
        val board: List<Space>
): Event()