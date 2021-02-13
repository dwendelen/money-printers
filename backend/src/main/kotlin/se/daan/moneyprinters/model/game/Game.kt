package se.daan.moneyprinters.model.game

import se.daan.moneyprinters.model.game.api.*
import kotlin.collections.ArrayList
import kotlin.random.Random
import se.daan.moneyprinters.model.game.api.ActionSpace as ApiActionSpace
import se.daan.moneyprinters.model.game.api.FreeParking as ApiFreeParking
import se.daan.moneyprinters.model.game.api.Station as ApiStation
import se.daan.moneyprinters.model.game.api.Utility as ApiUtility
import se.daan.moneyprinters.model.game.api.Street as ApiStreet
import se.daan.moneyprinters.model.game.api.Prison as ApiPrison

class Game(
        createGame: CreateGame,
        private val random: Random
) {
    val events: MutableList<Event> = ArrayList()
    private val players: MutableList<Player> = ArrayList()
    private lateinit var gameMaster: String
    private var state: State = Waiting()
    private var currentPlayer: Player? = null
    private lateinit var board: List<Space>

    init {
        newEvent(GameCreated(
                createGame.gameMaster,
                createGame.board
        ))
    }

    @Synchronized
    fun execute(cmd: Command, expectedVersion: Int): Boolean {
        if (expectedVersion != events.size) {
            return false
        }

        return when (cmd) {
            is CreateGame -> false
            is AddPlayer -> this.state.on(cmd)
            is StartGame -> this.state.on(cmd)
            is RollDice -> this.state.on(cmd)
        }
    }

    private fun newEvent(event: Event) {
        this.events.add(event)
        this.apply(event)
    }

    fun apply(event: Event) {
        when (event) {
            is GameCreated -> apply(event)
            is PlayerAdded -> apply(event)
            is GameStarted -> apply(event)
            is NewRoundStarted -> apply(event)
            is DiceRolled -> apply(event)
        }
    }

    private fun apply(event: GameCreated) {
        this.gameMaster = event.gameMaster
        this.board = event.board.map {
            when(it) {
                is ApiStreet -> Street()
                is ApiActionSpace -> ActionSpace()
                is ApiFreeParking -> FreeParking()
                is ApiPrison -> Prison()
                is ApiStation -> Station()
                is ApiUtility -> Utility()
            }
        }
    }

    private fun apply(event: PlayerAdded) {
        players.add(Player(
                event.id
        ))
    }

    private fun apply(gameStarted: GameStarted) {
        this.state = Playing()
    }

    private fun apply(event: NewRoundStarted) {
        this.currentPlayer = this.players
                .find { it.id == event.player }
    }

    private fun apply(event: DiceRolled) {
        this.currentPlayer?.let {
            it.position = (it.position + event.dice1 + event.dice2) % this.board.size
        }
    }

    fun getNewEvents(skip: Int, limit: Int): List<Event> {
        return events
                .drop(skip)
                .take(limit)
    }

    private abstract class State {
        abstract fun on(cmd: AddPlayer): Boolean
        abstract fun on(cmd: StartGame): Boolean
        abstract fun on(cmd: RollDice): Boolean
    }

    private inner class Waiting : State() {
        override fun on(cmd: AddPlayer): Boolean {
            return if (players.all { it.id != cmd.id }) {
                newEvent(PlayerAdded(
                        cmd.id,
                        cmd.name
                ))
                true
            } else {
                false
            }
        }

        override fun on(cmd: StartGame): Boolean {
            return if(players.size >= 2) {
                newEvent(GameStarted)
                newEvent(NewRoundStarted(players[0].id))
                true
            } else {
                false
            }
        }

        override fun on(cmd: RollDice) = false
    }

    private inner class Playing: State() {
        override fun on(cmd: AddPlayer) = false
        override fun on(cmd: StartGame) = false

        override fun on(cmd: RollDice): Boolean {
            val dice1 = random.nextInt(1, 7)
            val dice2 = random.nextInt(1, 7)
            newEvent(DiceRolled(dice1, dice2))
            return true
        }
    }
}

class Player(
        val id: String,
        var money: Int = 0,
        var debt: Int = 0,
        var position: Int = 0
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

class Prison(
) : Space()
