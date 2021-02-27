package se.daan.moneyprinters.model.game

import se.daan.moneyprinters.model.game.api.*
import java.time.Clock
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock
import kotlin.collections.ArrayList
import kotlin.concurrent.withLock
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.random.Random
import se.daan.moneyprinters.model.game.api.ActionSpace as ApiActionSpace
import se.daan.moneyprinters.model.game.api.FreeParking as ApiFreeParking
import se.daan.moneyprinters.model.game.api.Station as ApiStation
import se.daan.moneyprinters.model.game.api.Utility as ApiUtility
import se.daan.moneyprinters.model.game.api.Street as ApiStreet
import se.daan.moneyprinters.model.game.api.Prison as ApiPrison

class Game(
        createGame: CreateGame,
        private val id: String,
        private val random: Random,
        private val clock: Clock
) {
    private val eventsLock = ReentrantLock()
    private val dataAvailable = eventsLock.newCondition()
    private val events: MutableList<Event> = ArrayList()
    private val players: MutableList<Player> = ArrayList()
    private lateinit var gameMaster: String
    private var state: State = WaitingForStart()
    private lateinit var board: List<Space>
    private var fixedStartMoney = 0
    private var interestRate = 0.0
    private var returnRate = 0.0
    private var economy = 0

    init {
        newEvent(GameCreated(
                createGame.gameMaster,
                createGame.board,
                createGame.fixedStartMoney,
                createGame.interestRate,
                createGame.returnRate
        ))
    }

    fun execute(cmd: Command, expectedVersion: Int): Boolean {
        eventsLock.withLock {
            if (expectedVersion != events.size) {
                return false
            }

            val result = when (cmd) {
                is CreateGame -> false
                is AddPlayer -> this.state.on(cmd)
                is StartGame -> this.state.on(cmd)
                is RollDice -> this.state.on(cmd)
                is BuyThisSpace -> this.state.on(cmd)
                is EndTurn -> this.state.on(cmd)
            }

            if(events.size != expectedVersion) {
                dataAvailable.signalAll()
            }
            return result
        }
    }

    private fun newEvent(event: Event) {
        this.events.add(event)
        println("New event $id $event")
        this.apply(event)
    }

    private fun apply(event: Event) {
        when (event) {
            is GameCreated -> apply(event)
            is PlayerAdded -> this.state.apply(event)
            is GameStarted -> this.state.apply(event)
            is NewTurnStarted -> this.state.apply(event)
            is DiceRolled -> this.state.apply(event)
            is StartMoneyReceived -> this.state.apply(event)
            is LandedOn -> this.state.apply(event)
            is SpaceBought -> this.state.apply(event)
            is TurnEnded -> this.state.apply(event)
        }
    }

    private fun apply(event: GameCreated) {
        gameMaster = event.gameMaster
        board = event.board.map {
            when (it) {
                is ApiStreet -> Street(it.id)
                is ApiActionSpace -> ActionSpace(it.id)
                is ApiFreeParking -> FreeParking(it.id)
                is ApiPrison -> Prison(it.id)
                is ApiStation -> Station(it.id)
                is ApiUtility -> Utility(it.id)
            }
        }
        fixedStartMoney = event.fixedStartMoney
        interestRate = event.interestRate
        returnRate = event.returnRate
    }

    fun getNewEvents(skip: Int, limit: Int, timeout: Int): List<Event> {
        val end = clock.millis() + timeout
        eventsLock.withLock {
            while(true) {
                val now = clock.millis()
                val newEvents = events
                        .drop(skip)
                        .take(limit)
                if(newEvents.isNotEmpty() || now >= end) {
                    return newEvents
                }
                dataAvailable.await(end - now, TimeUnit.MILLISECONDS)
            }
        }
    }

    private interface State {
        fun on(cmd: AddPlayer): Boolean
        fun apply(event: PlayerAdded)
        fun on(cmd: StartGame): Boolean
        fun apply(event: GameStarted)
        fun apply(event: NewTurnStarted)
        fun on(cmd: RollDice): Boolean
        fun apply(event: DiceRolled)
        fun apply(event: StartMoneyReceived)
        fun apply(event: LandedOn)
        fun on(cmd: BuyThisSpace): Boolean
        fun apply(event: SpaceBought)
        fun on(cmd: EndTurn): Boolean
        fun apply(event: TurnEnded)
    }

    private open class NothingState : State {
        override fun on(cmd: AddPlayer) = false
        override fun apply(event: PlayerAdded) {}
        override fun on(cmd: StartGame) = false
        override fun apply(event: GameStarted) {}
        override fun apply(event: NewTurnStarted) {}
        override fun on(cmd: RollDice) = false
        override fun apply(event: DiceRolled) {}
        override fun apply(event: StartMoneyReceived) {}
        override fun apply(event: LandedOn) {}
        override fun on(cmd: BuyThisSpace) = false
        override fun apply(event: SpaceBought) {}
        override fun on(cmd: EndTurn) = false
        override fun apply(event: TurnEnded) {}
    }

    private inner class WaitingForStart : NothingState() {
        override fun on(cmd: AddPlayer): Boolean {
            return if (players.all { it.id != cmd.id }) {
                newEvent(PlayerAdded(
                        cmd.id,
                        cmd.name,
                        cmd.color
                ))
                true
            } else {
                false //TODO check color unique
            }
        }

        override fun apply(event: PlayerAdded) {
            players.add(Player(
                    event.id,
                    board[0]
            ))
        }

        override fun on(cmd: StartGame): Boolean {
            return if (players.size >= 2) {
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
    ) : NothingState() {
        override fun on(cmd: RollDice): Boolean {
            val dice1 = random.nextInt(1, 7)
            val dice2 = random.nextInt(1, 7)
            val idx = board.indexOf(player.position)
            val newPosition = (idx + dice1 + dice2) % board.size

            newEvent(DiceRolled(dice1, dice2))
            if(newPosition < idx) {
                val interest = floor(player.debt * interestRate).toInt()
                val economyMoney = ceil(economy * returnRate).toInt()
                val startMoney = fixedStartMoney + economyMoney - interest
                newEvent(StartMoneyReceived(player.id, startMoney)) //TODO calc start money
            }
            newEvent(LandedOn(board[newPosition].id))
            return true
        }

        override fun apply(event: DiceRolled) {
            state = WaitingForDiceOutcome(player)
        }
    }

    private inner class WaitingForDiceOutcome(
            val player: Player
    ) : NothingState() {
        override fun apply(event: StartMoneyReceived) {
            val receiver = players.filter { p -> p.id === event.player }[0]
            receiver.money += event.amount
            economy -= event.amount
        }

        override fun apply(event: LandedOn) {
            player.position = board
                    .filter { it.id === event.ground }[0]
            state = if(player.position.canBuy()) {
                LandedOnNewGround(player)
            } else {
                WaitingForEndTurn(player)
            }
        }
    }

    private inner class LandedOnNewGround(
            val player: Player
    ): NothingState() {
        override fun on(cmd: BuyThisSpace): Boolean {
            //TODO validation money etc
            newEvent(SpaceBought(
                    player.position.id,
                    player.id,
                    cmd.cash,
                    cmd.borrowed
            ))
            return true
        }

        override fun apply(event: SpaceBought) {
            //TODO other players could also have bought
            (player.position as? Ownable)?.owner = player
            player.money -= event.cash
            player.debt += event.borrowed
            economy += event.cash + event.borrowed
            state = WaitingForEndTurn(player)
        }
    }

    private inner class WaitingForEndTurn(
            private val player: Player
    ) : NothingState() {
        override fun on(cmd: EndTurn): Boolean {
            val idx = players.indexOf(player)
            val newPlayer = players[(idx + 1) % players.size]
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
        var position: Space,
        var money: Int = 0,
        var debt: Int = 0
)

sealed class Space {
    abstract val id: String
    abstract fun canBuy(): Boolean
}

interface Ownable {
    var owner: Player?
}

class Street(
        override val id: String
) : Space(), Ownable {
    override var owner: Player? = null

    override fun canBuy(): Boolean {
        return owner == null;
    }
}

class ActionSpace(
        override val id: String
) : Space() {
    override fun canBuy() = false
}

class Utility(
        override val id: String
) : Space(), Ownable {
    override var owner: Player? = null

    override fun canBuy(): Boolean {
        return owner == null;
    }
}

class Station(
        override val id: String
) : Space(), Ownable {
    override var owner: Player? = null

    override fun canBuy(): Boolean {
        return owner == null;
    }
}

class FreeParking(
        override val id: String
) : Space() {
    override fun canBuy() = false
}

class Prison(
        override val id: String
) : Space() {
    override fun canBuy() = false
}
