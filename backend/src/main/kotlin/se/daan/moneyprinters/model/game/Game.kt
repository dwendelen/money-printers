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
    private var state: GameState = WaitingForStart()
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
                is AddPlayer -> on(cmd)
                is StartGame -> on(cmd)
                is RollDice -> on(cmd)
                is BuyThisSpace -> on(cmd)
                is EndTurn -> on(cmd)
            }

            if (events.size != expectedVersion) {
                dataAvailable.signalAll()
            }
            return result
        }
    }

    private fun on(cmd: AddPlayer): Boolean {
        return if (
                players.all { it.isCompatibleWithNewPlayer(cmd.id, cmd.color) } &&
                this.state.canAddPlayer()
        ) {
            newEvent(PlayerAdded(
                    cmd.id,
                    cmd.name,
                    cmd.color
            ))
            true
        } else {
            false
        }
    }

    private fun on(cmd: StartGame): Boolean {
        return if (
                cmd.initiator == gameMaster &&
                players.size >= 2 &&
                this.state.canStartGame()
        ) {
            newEvent(GameStarted)
            newEvent(NewTurnStarted(players[0].id))
            true
        } else {
            false
        }
    }

    private fun on(cmd: RollDice): Boolean {
        val player = findPlayer(cmd.player)
        return if (
                player != null &&
                this.state.canRollDice(player)
        ) {
            val dice1 = random.nextInt(1, 7)
            val dice2 = random.nextInt(1, 7)

            val idx = board.indexOf(player.position)
            val newPosition = (idx + dice1 + dice2) % board.size

            newEvent(DiceRolled(player.id, dice1, dice2))
            if (newPosition < idx) {
                val interest = floor(player.debt * interestRate).toInt()
                val economyMoney = ceil(economy * returnRate).toInt()
                val startMoney = fixedStartMoney + economyMoney - interest
                newEvent(StartMoneyReceived(player.id, startMoney))
            }
            newEvent(LandedOn(player.id, board[newPosition].id))
            true
        } else {
            false
        }
    }

    private fun on(cmd: BuyThisSpace): Boolean {
        val player = findPlayer(cmd.player)
        val space = player?.position
        return if (
                player != null &&
                space is Ownable &&
                player.canBuy(cmd.cash) &&
                space.canBuy(cmd.cash + cmd.borrowed) &&

                this.state.canBuyThis(player)
        ) {
            newEvent(SpaceBought(
                    player.position.id,
                    player.id,
                    cmd.cash,
                    cmd.borrowed
            ))
            true
        } else {
            false
        }
    }

    private fun on(cmd: EndTurn): Boolean {
        val player = findPlayer(cmd.player)
        return if (
                player != null &&
                this.state.canEndGame(player)
        ) {
            val idx = players.indexOf(player)
            val newPlayer = players[(idx + 1) % players.size]
            newEvent(TurnEnded)
            newEvent(NewTurnStarted(newPlayer.id))
            true
        } else {
            false
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
            is PlayerAdded -> apply(event)
            is GameStarted -> apply(event)
            is NewTurnStarted -> apply(event)
            is DiceRolled -> apply(event)
            is StartMoneyReceived -> apply(event)
            is LandedOn -> apply(event)
            is SpaceBought -> apply(event)
            is TurnEnded -> apply(event)
        }
    }

    private fun apply(event: GameCreated) {
        gameMaster = event.gameMaster
        board = event.board.map {
            when (it) {
                is ApiStreet -> Street(it.id, it.initialPrice)
                is ApiActionSpace -> ActionSpace(it.id)
                is ApiFreeParking -> FreeParking(it.id)
                is ApiPrison -> Prison(it.id)
                is ApiStation -> Station(it.id, it.initialPrice)
                is ApiUtility -> Utility(it.id, it.initialPrice)
            }
        }
        fixedStartMoney = event.fixedStartMoney
        interestRate = event.interestRate
        returnRate = event.returnRate
    }

    private fun apply(event: PlayerAdded) {
        players.add(Player(
                event.id,
                event.color,
                board[0]
        ))
    }

    private fun apply(event: GameStarted) {
        state = WaitingForTurn()
    }

    private fun apply(event: NewTurnStarted) {
        val player = findPlayer(event.player)
        if(player != null) {
            state = WaitingForDiceRoll(player)
        }
    }

    private fun apply(event: DiceRolled) {
        this.state = this.state.apply(event)
    }

    private fun apply(event: StartMoneyReceived) {
        val player = findPlayer(event.player)
        if(player != null) {
            player.apply(event)
            economy -= event.amount
        }
    }

    private fun apply(event: LandedOn) {
        val player = findPlayer(event.player)
        val space = findSpace(event.ground)
        if(player != null && space != null) {
            player.apply(event, space)
            state = state.apply(event, space.canBuy())
        }
    }

    private fun apply(event: SpaceBought) {
        val player = findPlayer(event.player)
        val space = findSpace(event.ground)

        if(player != null && space is Ownable) {
            player.apply(event)
            space.apply(event, player)
        }

        economy += event.cash + event.borrowed
        this.state = this.state.apply(event)
    }

    private fun apply(event: TurnEnded) {
        state = WaitingForTurn()
    }

    private fun findPlayer(id: String): Player? {
        return players
                .find { it.id == id }
    }

    private fun findSpace(id: String): Space? {
        return board
                .find { it.id == id }
    }

    fun getNewEvents(skip: Int, limit: Int, timeout: Int): List<Event> {
        val end = clock.millis() + timeout
        eventsLock.withLock {
            while (true) {
                val now = clock.millis()
                val newEvents = events
                        .drop(skip)
                        .take(limit)
                if (newEvents.isNotEmpty() || now >= end) {
                    return newEvents
                }
                dataAvailable.await(end - now, TimeUnit.MILLISECONDS)
            }
        }
    }

    private interface GameState {
        fun canAddPlayer(): Boolean
        fun canStartGame(): Boolean
        fun canRollDice(player: Player): Boolean
        fun apply(event: DiceRolled): GameState
        fun apply(event: LandedOn, canBuy: Boolean): GameState
        fun canBuyThis(player: Player): Boolean
        fun apply(event: SpaceBought): GameState
        fun canEndGame(player: Player): Boolean
    }

    private open class NothingGameState : GameState {
        override fun canAddPlayer() = false
        override fun canStartGame() = false
        override fun canRollDice(player: Player) = false
        override fun apply(event: DiceRolled): GameState = this
        override fun apply(event: LandedOn, canBuy: Boolean): GameState = this
        override fun canBuyThis(player: Player) = false
        override fun apply(event: SpaceBought): GameState = this
        override fun canEndGame(player: Player) = false
    }

    private inner class WaitingForStart : NothingGameState() {

        override fun canAddPlayer(): Boolean {
            return true
        }

        override fun canStartGame(): Boolean {
            return true
        }
    }

    private inner class WaitingForTurn : NothingGameState()

    private inner class WaitingForDiceRoll(
            val player: Player
    ) : NothingGameState() {
        override fun canRollDice(player: Player): Boolean {
            return this.player == player
        }

        override fun apply(event: DiceRolled): GameState {
            return WaitingForDiceOutcome(player)
        }
    }

    private inner class WaitingForDiceOutcome(
            val player: Player
    ) : NothingGameState() {
        override fun apply(event: LandedOn, canBuy: Boolean): GameState {
            return if (canBuy) {
                LandedOnNewGround(player)
            } else {
                WaitingForEndTurn(player)
            }
        }
    }

    private inner class LandedOnNewGround(
            val player: Player
    ) : NothingGameState() {
        override fun canBuyThis(player: Player): Boolean {
            return this.player == player
        }

        override fun apply(event: SpaceBought): GameState {
            return WaitingForEndTurn(player)
        }
    }

    private inner class WaitingForEndTurn(
            private val player: Player
    ) : NothingGameState() {
        override fun canEndGame(player: Player): Boolean {
            return this.player == player
        }
    }
}

class Player(
        val id: String,
        val color: String,
        var position: Space,
        var money: Int = 0,
        var debt: Int = 0
) {
    fun isCompatibleWithNewPlayer(
            id: String,
            color: String
    ): Boolean {
        return id != this.id && color != this.color
    }

    fun canBuy(cash: Int): Boolean {
        return money >= cash
    }

    fun apply(event: StartMoneyReceived) {
        money += event.amount
    }

    fun apply(event: LandedOn, space: Space) {
        position = space
    }

    fun apply(event: SpaceBought) {
        money -= event.cash
        debt += event.borrowed
    }
}

sealed class Space {
    abstract val id: String
    abstract fun canBuy(): Boolean
}

interface Ownable {
    val initialPrice: Int
    var owner: Player?

    fun canBuy(price: Int): Boolean {
        return owner == null &&
                initialPrice == price
    }

    fun apply(block: SpaceBought, player: Player) {
        owner = player
    }
}

class Street(
        override val id: String,
        override val initialPrice: Int
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
        override val id: String,
        override val initialPrice: Int
) : Space(), Ownable {
    override var owner: Player? = null

    override fun canBuy(): Boolean {
        return owner == null;
    }
}

class Station(
        override val id: String,
        override val initialPrice: Int
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
