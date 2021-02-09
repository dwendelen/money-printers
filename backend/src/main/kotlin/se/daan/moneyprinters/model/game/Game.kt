package se.daan.moneyprinters.model.game

import se.daan.moneyprinters.model.game.api.Command
import se.daan.moneyprinters.model.game.api.Event
import se.daan.moneyprinters.model.game.api.GameCreated
import se.daan.moneyprinters.model.game.api.CreateGame

class Game(
        createGame: CreateGame
) {
    val events: MutableList<Event> = ArrayList()
    private val players: MutableList<Player> = ArrayList()
    private lateinit var gameMaster: Player

    init {
        newEvent(GameCreated(
                createGame.gameMaster,
                createGame.board
        ))
    }

    private fun newEvent(event: Event) {
        this.events.add(event)
        this.apply(event)
    }

    fun execute(cmd: Command, expectedVersion: Int): Boolean {
        if(expectedVersion != events.size) {
            return false
        }

        return when(cmd) {
            is CreateGame -> false
        }
    }

    fun apply(event: Event) {
        when(event) {
            is GameCreated -> {
                val gameMaster = Player(
                        event.gameMaster.id,
                        event.gameMaster.name,
                        0,
                        0,
                        0
                )
                this.players.add(gameMaster)
                this.gameMaster = gameMaster
            }
        }
    }
}

class Player(
        val id: String,
        val name: String,
        val money: Int,
        val debt: Int,
        val position: Int
)

sealed class Space {
    abstract val text: String
}

class Street(
        override val text: String,
        val color: String
) : Space()

class ActionSpace(
        override val text: String,
) : Space()

class Utility(
        override val text: String,
) : Space()

class Station(
        override val text: String
) : Space()

class FreeParking(
        override val text: String
) : Space()
