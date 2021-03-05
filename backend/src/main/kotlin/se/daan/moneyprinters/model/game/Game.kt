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
                is DemandRent -> on(cmd)
                is EndTurn -> on(cmd)
            }

            if (events.size != expectedVersion) {
                dataAvailable.signalAll()
            }
            return result
        }
    }

    private fun newEvent(event: Event) {
        println("New event $id $event")
        this.apply(event)
        this.events.add(event)
    }

    private fun apply(event: Event) {
        return when (event) {
            is GameCreated -> apply(event)
            is PlayerAdded -> apply(event)
            is GameStarted -> apply(event)
            is NewTurnStarted -> apply(event)
            is DiceRolled -> apply(event)
            is StartMoneyReceived -> apply(event)
            is LandedOn -> apply(event)
            is SpaceBought -> apply(event)
            is RentDemanded -> apply(event)
            is TurnEnded -> apply(event)
        }
    }

    private fun apply(event: GameCreated) {
        gameMaster = event.gameMaster
        board = event.board.map {
            when (it) {
                is ApiStreet -> Street(
                        it.id,
                        it.initialPrice,
                        it.color,
                        it.rent,
                        it.rentHouse,
                        it.rentHotel
                )
                is ApiActionSpace -> ActionSpace(it.id)
                is ApiFreeParking -> FreeParking(it.id)
                is ApiPrison -> Prison(it.id)
                is ApiStation -> Station(it.id, it.initialPrice, it.rent)
                is ApiUtility -> Utility(it.id, it.initialPrice, it.rent, it.rentAll)
            }
        }
        fixedStartMoney = event.fixedStartMoney
        interestRate = event.interestRate
        returnRate = event.returnRate
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

    private fun apply(event: PlayerAdded) {
        players.add(Player(
                event.id,
                event.color,
                board[0]
        ))
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

    private fun apply(event: GameStarted) {
        state = WaitingForTurn(emptyList(), emptyList())
    }

    private fun apply(event: NewTurnStarted) {
        val player = findPlayer(event.player)
        if (player != null) {
            state = state.apply(event, player)
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
            val diceEvent = events.size
            if (newPosition < idx) {
                val interest = floor(player.debt * interestRate).toInt()
                val economyMoney = ceil(economy * returnRate).toInt()
                val startMoney = fixedStartMoney + economyMoney - interest
                newEvent(StartMoneyReceived(player.id, startMoney))
            }
            newEvent(LandedOn(player.id, board[newPosition].id, diceEvent))
            true
        } else {
            false
        }
    }

    private fun apply(event: DiceRolled) {
        this.state.apply(event)
    }

    private fun apply(event: StartMoneyReceived) {
        val player = findPlayer(event.player)
        if (player != null) {
            player.apply(event)
            economy -= event.amount
        }
    }

    private fun apply(event: LandedOn) {
        val player = findPlayer(event.player)
        val space = findSpace(event.ground)
        val roll = events[event.diceEvent - 1] as? DiceRolled
        if (player != null && space != null && roll != null) {
            player.apply(event, space)
            val rent = getRent(space, roll.dice1 + roll.dice2)
            state.apply(event, events.size, player, space, rent ?:0)
        }
    }

    private fun getRent(space: Space, diceRoll: Int): Int? {
        return when(space) {
            is Street  -> space.getRent(isFullStreet(space))
            is Station -> space.owner ?.let { space.getRent(getNumberOfStations(it) )}
            is Utility -> space.owner ?.let {space.getRent(hasAllUtilities(it) , diceRoll)}
            else -> 0
        }
    }

    private fun isFullStreet(street: Street): Boolean {
        return board
                .filterIsInstance<Street>()
                .filter { it.color == street.color }
                .all { it.owner == street.owner }
    }

    private fun getNumberOfStations(owner: Player): Int {
        return board
                .filterIsInstance<Station>()
                .count { it.owner == owner }
    }


    private fun hasAllUtilities(owner: Player): Boolean {
        return board
                .filterIsInstance<Utility>()
                .all { it.owner == owner }
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

    private fun apply(event: SpaceBought) {
        val player = findPlayer(event.player)
        val space = findSpace(event.ground)

        if (player != null && space is Ownable) {
            player.apply(event)
            space.apply(event, player)

            economy += event.cash + event.borrowed
            this.state.apply(event)
        }
    }

    private fun apply(event: RentDemanded) {
        // TODO remove open demand + special state with ref to previous state
    }

    private fun on(cmd: DemandRent): Boolean {
        val owner = findPlayer(cmd.owner)
        val rentDemand = state.findOpenRentDemand(cmd.landEvent)

        return if (
                owner != null &&
                rentDemand != null
        ) {
            newEvent(RentDemanded(
                    rentDemand.owner.id,
                    rentDemand.player.id,
                    rentDemand.space.id,
                    rentDemand.rent,
                    rentDemand.id
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
                this.state.canEndTurn(player)
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

    private fun apply(event: TurnEnded) {
        state = state.apply(event)
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
        fun apply(event: NewTurnStarted, player: Player): GameState
        fun canRollDice(player: Player): Boolean
        fun apply(event: DiceRolled)
        fun apply(event: LandedOn, eventId: Int, player: Player, space: Space, rent: Int)
        fun canBuyThis(player: Player): Boolean
        fun apply(event: SpaceBought)
        fun findOpenRentDemand(landEvent: Int): RentDemand?
        fun canEndTurn(player: Player): Boolean
        fun apply(event: TurnEnded): GameState
    }

    private inner class WaitingForStart : GameState {
        override fun canAddPlayer() = true
        override fun canStartGame() = true
        override fun apply(event: NewTurnStarted, player: Player) = this
        override fun canRollDice(player: Player) = false
        override fun apply(event: DiceRolled) {}
        override fun apply(event: LandedOn, eventId: Int, player: Player, space: Space, rent: Int) {}
        override fun canBuyThis(player: Player) = false
        override fun findOpenRentDemand(landEvent: Int) = null
        override fun apply(event: SpaceBought) {}
        override fun canEndTurn(player: Player) = false
        override fun apply(event: TurnEnded) = this
    }

    private inner class WaitingForTurn(
            val previousPreviousRentDemands: List<RentDemand>,
            val previousRentDemands: List<RentDemand>
    ) : GameState {
        override fun canAddPlayer() = false
        override fun canStartGame() = false
        override fun apply(event: NewTurnStarted, player: Player): GameState {
            return Turn(player, previousPreviousRentDemands, previousRentDemands)
        }

        override fun canRollDice(player: Player) = false
        override fun apply(event: DiceRolled) {}
        override fun apply(event: LandedOn, eventId: Int, player: Player, space: Space, rent: Int) {}
        override fun canBuyThis(player: Player) = false
        override fun findOpenRentDemand(landEvent: Int): RentDemand? {
            return (previousPreviousRentDemands + previousRentDemands)
                    .find { it.id == landEvent }
        }

        override fun apply(event: SpaceBought) {}
        override fun canEndTurn(player: Player) = false
        override fun apply(event: TurnEnded) = this
    }

    private inner class Turn(
            val player: Player,
            val previousPreviousRentDemands: List<RentDemand>,
            val previousRentDemands: List<RentDemand>
    ) : GameState {
        var state: TurnState = WaitingForDiceRoll()
        var rentDemands: List<RentDemand> = emptyList()

        override fun canAddPlayer() = false
        override fun canStartGame() = false
        override fun apply(event: NewTurnStarted, player: Player): GameState {
            return this
        }

        override fun canRollDice(player: Player): Boolean {
            return this.player == player && state.canRollDice()
        }

        override fun apply(event: DiceRolled) {
            this.state = WaitingForDiceOutcome()
        }

        override fun apply(event: LandedOn, eventId: Int, player: Player, space: Space, rent: Int) {
            this.state = if (space.canBuy()) {
                LandedOnNewGround()
            } else {
                if (space is Ownable) {
                    val owner = space.owner
                    if (owner != null) {
                        rentDemands = rentDemands + RentDemand(eventId, player, space, owner, rent)
                    }
                }
                WaitingForEndTurn()
            }
        }

        override fun canBuyThis(player: Player): Boolean {
            return this.player == player && state.canBuyThis()
        }

        override fun findOpenRentDemand(landEvent: Int): RentDemand? {
            val validDemands = if (state.isBeforeDiceRoll()) {
                previousPreviousRentDemands + previousRentDemands + rentDemands
            } else {
                previousRentDemands + rentDemands
            }
            return validDemands.find { it.id == landEvent }
        }

        override fun apply(event: SpaceBought) {
            this.state = WaitingForEndTurn()
        }

        override fun canEndTurn(player: Player): Boolean {
            return this.player == player && state.canEndTurn()
        }

        override fun apply(event: TurnEnded): GameState {
            return WaitingForTurn(previousRentDemands, rentDemands)
        }
    }

    interface TurnState {
        fun canRollDice() = false
        fun canBuyThis() = false
        fun canEndTurn() = false
        fun isBeforeDiceRoll() = false
    }

    private inner class WaitingForDiceRoll : TurnState {
        override fun canRollDice() = true
        override fun isBeforeDiceRoll() = true
    }

    private inner class WaitingForDiceOutcome : TurnState {
    }

    private inner class LandedOnNewGround : TurnState {
        override fun canBuyThis() = true
    }

    private inner class WaitingForEndTurn : TurnState {
        override fun canEndTurn() = true
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

data class RentDemand(
        val id: Int,
        val player: Player,
        val space: Space,
        // Because the owner of a space changes over time
        val owner: Player,
        val rent: Int
)

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
        override val initialPrice: Int,
        val color: String,
        val rent: Int,
        val rentHouse: List<Int>,
        val rentHotel: Int,
        var houses: Int = 0,
        var hotel: Boolean = false
) : Space(), Ownable {
    override var owner: Player? = null

    override fun canBuy(): Boolean {
        return owner == null;
    }

    fun getRent(fullStreet: Boolean): Int {
        val houses = this.houses
        val hotel = this.hotel
        return when {
            hotel -> rentHotel
            houses != 0 -> rentHouse[houses - 1]
            fullStreet -> 2*rent
            else -> rent
        }
    }
}

class ActionSpace(
        override val id: String
) : Space() {
    override fun canBuy() = false
}

class Utility(
        override val id: String,
        override val initialPrice: Int,
        val rent: Int,
        val rentAll: Int
) : Space(), Ownable {
    override var owner: Player? = null

    override fun canBuy(): Boolean {
        return owner == null;
    }

    fun getRent(allUtilities: Boolean, diceRoll: Int): Int {
        val factor = if(allUtilities) {
            rentAll
        } else {
            rent
        }
        return factor * diceRoll
    }
}

class Station(
        override val id: String,
        override val initialPrice: Int,
        val rent: List<Int>
) : Space(), Ownable {
    override var owner: Player? = null

    override fun canBuy(): Boolean {
        return owner == null;
    }

    fun getRent(nbOfStations: Int): Int {
        return rent[nbOfStations - 1]
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
