package se.daan.moneyprinters.model.game

import se.daan.moneyprinters.model.game.api.*

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

    @Synchronized
    fun execute(cmd: Command, expectedVersion: Int): Boolean {
        if(expectedVersion != events.size) {
            return false
        }

        return when(cmd) {
            is CreateGame -> false
            is AddPlayer -> {
                if(players.any { it.id == cmd.id }) {
                    false
                } else {
                    newEvent(PlayerAdded(
                            cmd.id,
                            cmd.name
                    ))
                    true
                }
            }
        }
    }

    private fun apply(event: Event) {
        when(event) {
            is GameCreated -> {
                val gameMaster = Player(
                        event.gameMaster.id,
                        event.gameMaster.name
                )
                this.players.add(gameMaster)
                this.gameMaster = gameMaster
            }
            is PlayerAdded -> {
                players.add(Player(
                        event.id,
                        event.name
                ))
            }
        }
    }
}

class Player(
        val id: String,
        val name: String,
        val money: Int = 0,
        val debt: Int = 0,
        val position: Int = 0
)

sealed class Space {
}

class Street(
) : Space()

class ActionSpace(
) : Space()

class Utility(
) : Space()

class Station(
) : Space()

class FreeParking(
) : Space()
