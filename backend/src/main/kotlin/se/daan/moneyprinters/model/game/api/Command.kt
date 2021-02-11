package se.daan.moneyprinters.model.game.api

sealed class Command

data class CreateGame(
        val gameMaster: PlayerInfo,
        val board: List<Space>
): Command()

data class AddPlayer(
        val id: String,
        val name: String
): Command()
