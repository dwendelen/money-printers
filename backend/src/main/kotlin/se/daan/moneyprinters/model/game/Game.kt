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
    private var state: State = WaitingForStart()
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
            is EndTurn -> this.state.on(cmd)
        }
    }

    private fun newEvent(event: Event) {
        this.events.add(event)
        println("New event $event")
        this.apply(event)
    }

    private fun apply(event: Event) {
        when (event) {
            is GameCreated -> apply(event)
            is PlayerAdded -> this.state.apply(event)
            is GameStarted -> this.state.apply(event)
            is NewTurnStarted -> this.state.apply(event)
            is DiceRolled -> this.state.apply(event)
            is TurnEnded -> this.state.apply(event)
        }
    }

    private fun apply(event: GameCreated) {
        gameMaster = event.gameMaster
        board = event.board.map {
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

    fun getNewEvents(skip: Int, limit: Int): List<Event> {
        return events
                .drop(skip)
                .take(limit)
    }

    private interface State {
        fun on(cmd: AddPlayer): Boolean
        fun apply(event: PlayerAdded)
        fun on(cmd: StartGame): Boolean
        fun apply(event: GameStarted)
        fun apply(event: NewTurnStarted)
        fun on(cmd: RollDice): Boolean
        fun apply(event: DiceRolled)
        fun on(cmd: EndTurn): Boolean
        fun apply(event: TurnEnded)
    }

    private open class NothingState: State {
        override fun on(cmd: AddPlayer) = false
        override fun apply(event: PlayerAdded) {}
        override fun on(cmd: StartGame) = false
        override fun apply(event: GameStarted) {}
        override fun apply(event: NewTurnStarted) {}
        override fun on(cmd: RollDice) = false
        override fun apply(event: DiceRolled) { }
        override fun on(cmd: EndTurn) = false
        override fun apply(event: TurnEnded) {}
    }

    private inner class WaitingForStart : NothingState() {
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

        override fun apply(event: PlayerAdded) {
            players.add(Player(
                    event.id
            ))
        }

        override fun on(cmd: StartGame): Boolean {
            return if(players.size >= 2) {
                newEvent(GameStarted)
                newEvent(NewTurnStarted(players[0].id))
                true
            } else {
                false
            }
        }

        override fun apply(event: GameStarted) {
            state = WaitingForTurn()
        }
    }

    private inner class WaitingForTurn : NothingState() {
        override fun apply(event: NewTurnStarted) {
            val player = players
                    .find { it.id == event.player }!!
            state = WaitingForDiceRoll(player)
        }
    }

    private inner class WaitingForDiceRoll(
            val player: Player
    ): NothingState() {
        override fun on(cmd: RollDice): Boolean {
            val dice1 = random.nextInt(1, 7)
            val dice2 = random.nextInt(1, 7)
            newEvent(DiceRolled(dice1, dice2))
            return true
        }

        override fun apply(event: DiceRolled) {
            player.position = (player.position + event.dice1 + event.dice2) % board.size
            state = WaitingForEndTurn(player)
        }
    }

    private inner class WaitingForEndTurn(
            private val player: Player
    ): NothingState() {
        override fun on(cmd: EndTurn): Boolean {
            val idx = players.indexOf(player)
            val newPlayer = players[(idx+1)%players.size]
            newEvent(TurnEnded)
            newEvent(NewTurnStarted(newPlayer.id))
            return true
        }

        override fun apply(event: TurnEnded) {
            state = WaitingForTurn()
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
