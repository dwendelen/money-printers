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
                is PayRent -> on(cmd)
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
            is GameStarted -> Unit
            is NewTurnStarted -> apply(event)
            is DiceRolled -> apply(event)
            is StartMoneyReceived -> apply(event)
            is LandedOn -> apply(event)
            is SpaceBought -> apply(event)
            is RentDemanded -> apply(event)
            is RentPaid -> apply(event)
            is TurnEnded -> Unit
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
                board[0].id
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

    private fun apply(event: NewTurnStarted) {
        state = state.apply(event)
    }

    private fun on(cmd: RollDice): Boolean {
        val player = findPlayer(cmd.player)
        return if (
                player != null &&
                this.state.canRollDice(cmd.player)
        ) {
            val dice1 = random.nextInt(1, 7)
            val dice2 = random.nextInt(1, 7)

            val idx = board.indexOfFirst { it.id == player.position }
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
            player.apply(event)
            val rent = getRent(space, roll.dice1 + roll.dice2)
            state.apply(event, events.size, space, rent ?: 0)
        }
    }

    private fun getRent(space: Space, diceRoll: Int): Int? {
        return when (space) {
            is Street -> space.getRent(isFullStreet(space))
            is Station -> space.owner?.let { space.getRent(getNumberOfStations(it)) }
            is Utility -> space.owner?.let { space.getRent(hasAllUtilities(it), diceRoll) }
            else -> 0
        }
    }

    private fun isFullStreet(street: Street): Boolean {
        return board
                .filterIsInstance<Street>()
                .filter { it.color == street.color }
                .all { it.owner == street.owner }
    }

    private fun getNumberOfStations(owner: String): Int {
        return board
                .filterIsInstance<Station>()
                .count { it.owner == owner }
    }


    private fun hasAllUtilities(owner: String): Boolean {
        return board
                .filterIsInstance<Utility>()
                .all { it.owner == owner }
    }

    private fun on(cmd: BuyThisSpace): Boolean {
        val player = findPlayer(cmd.player)
        val space = player?.let { findSpace(it.position) }
        return if (
                player != null &&
                space is Ownable &&
                player.canBuy(cmd.cash) &&
                space.canBuy(cmd.cash + cmd.borrowed) &&
                this.state.canBuyThis(cmd.player)
        ) {
            newEvent(SpaceBought(
                    player.position,
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
            space.apply(event)

            economy += event.cash + event.borrowed
            this.state.apply(event)
        }
    }

    private fun on(cmd: DemandRent): Boolean {
        val rentDemand = state.findOpenRentDemand(cmd.landEvent)

        return if (
                hasPlayer(cmd.owner) &&
                rentDemand != null
        ) {
            newEvent(RentDemanded(
                    rentDemand.owner,
                    rentDemand.player,
                    rentDemand.rent,
                    rentDemand.landEvent
            ))
            true
        } else {
            false
        }
    }

    private fun apply(event: RentDemanded) {
        val demand = RentDemand(
            events.size,
            event.player,
            event.owner,
            event.rent
        )
        this.state.apply(event)
        this.state = WaitingForRentPayment(demand, this.state)
    }

    private fun on(cmd: PayRent): Boolean {
        val rentDemand = this.state.findRentDemand(cmd.demandEvent)
        val player = findPlayer(cmd.player)
        return if (
                rentDemand != null &&
                player != null &&
                player.money >= rentDemand.rent &&
                state.canPayRent(rentDemand)
        ) {
            newEvent(RentPaid(
                    rentDemand.player,
                    rentDemand.owner,
                    rentDemand.rent,
                    rentDemand.demandEvent
            ))
            true
        } else {
            false
        }
    }

    private fun apply(event: RentPaid) {
        val owner = findPlayer(event.owner)
        val player = findPlayer(event.player)
        if (owner != null && player != null) {
            owner.applyOwner(event)
            player.applyPlayer(event)
            this.state = this.state.apply(event)
        }
    }

    private fun on(cmd: EndTurn): Boolean {
        val player = findPlayer(cmd.player)
        return if (
                player != null &&
                this.state.canEndTurn(cmd.player)
        ) {
            val idx = players.indexOf(player)
            val newPlayer = players[(idx + 1) % players.size]
            newEvent(TurnEnded(cmd.player))
            newEvent(NewTurnStarted(newPlayer.id))
            true
        } else {
            false
        }
    }

    private fun findPlayer(id: String): Player? {
        return players
                .find { it.id == id }
    }

    private fun hasPlayer(id: String): Boolean {
        return players
                .any { it.id == id }
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
        fun canAddPlayer(): Boolean = false
        fun canStartGame(): Boolean = false
        fun apply(event: NewTurnStarted): GameState = this
        fun canRollDice(player: String): Boolean = false
        fun apply(event: DiceRolled) {}
        fun apply(event: LandedOn, eventId: Int, space: Space, rent: Int) {}
        fun canBuyThis(player: String): Boolean = false
        fun apply(event: SpaceBought) {}
        fun findOpenRentDemand(landEvent: Int): OpenRentDemand? = null
        fun apply(event: RentDemanded) {}
        fun findRentDemand(demandEvent: Int): RentDemand? = null
        fun canPayRent(rentDemand: RentDemand) = false
        fun apply(event: RentPaid): GameState = this
        fun canEndTurn(player: String): Boolean = false
    }

    private class WaitingForStart : GameState {
        override fun canAddPlayer() = true
        override fun canStartGame() = true
        override fun apply(event: NewTurnStarted): GameState {
            return Turn(event.player, emptyList())
        }
    }

    private class Turn(
            val player: String,
            var openRentDemands: List<OpenRentDemand>
    ) : GameState {
        var state: TurnState = WaitingForDiceRoll()

        override fun canRollDice(player: String): Boolean {
            return this.player == player && state.canRollDice()
        }

        override fun apply(event: DiceRolled) {
            openRentDemands
                    .forEach { it.ttl-- }
            openRentDemands = openRentDemands
                    .filter { it.ttl > 0 }
            this.state = WaitingForDiceOutcome()
        }

        override fun apply(event: LandedOn, eventId: Int, space: Space, rent: Int) {
            this.state = if (space.canBuy()) {
                LandedOnNewGround()
            } else {
                if (space is Ownable) {
                    val owner = space.owner
                    if (owner != null && owner != event.player) {
                        openRentDemands = openRentDemands + OpenRentDemand(eventId, event.player, owner, rent, 2)
                    }
                }
                WaitingForEndTurn()
            }
        }

        override fun canBuyThis(player: String): Boolean {
            return this.player == player && state.canBuyThis()
        }

        override fun findOpenRentDemand(landEvent: Int): OpenRentDemand? {
            return openRentDemands.find { it.landEvent == landEvent }
        }

        override fun apply(event: SpaceBought) {
            this.state = WaitingForEndTurn()
        }

        override fun apply(event: RentDemanded) {
            val openDemand = findOpenRentDemand(event.landEvent)
            if (openDemand != null) {
                openRentDemands = openRentDemands
                        .filter { it.landEvent != event.landEvent }
            }
        }

        override fun findRentDemand(demandEvent: Int): RentDemand? {
            return this.state.findRentDemand(demandEvent)
        }

        override fun canPayRent(rentDemand: RentDemand): Boolean {
            return this.state.canPayRent(rentDemand)
        }

        override fun canEndTurn(player: String): Boolean {
            return this.player == player && state.canEndTurn()
        }

        override fun apply(event: NewTurnStarted): GameState {
            return Turn(event.player, openRentDemands)
        }
    }


    private class WaitingForRentPayment(
        val demand: RentDemand,
        val previousState: GameState
    ) : GameState {
        override fun canPayRent(rentDemand: RentDemand): Boolean {
            return rentDemand == demand
        }

        override fun findRentDemand(demandEvent: Int): RentDemand? {
            return if (demand.demandEvent == demandEvent) {
                demand
            } else {
                null
            }
        }

        override fun apply(event: RentPaid): GameState {
            return previousState
        }
    }

    private interface TurnState {
        fun canRollDice() = false
        fun canBuyThis() = false
        fun canPayRent(rentDemand: RentDemand) = false
        fun findRentDemand(demandEvent: Int): RentDemand? = null
        fun canEndTurn() = false
    }

    private class WaitingForDiceRoll : TurnState {
        override fun canRollDice() = true
    }

    private class WaitingForDiceOutcome : TurnState

    private class LandedOnNewGround : TurnState {
        override fun canBuyThis() = true
    }

    private class WaitingForEndTurn : TurnState {
        override fun canEndTurn() = true
    }
}

class Player(
        val id: String,
        val color: String,
        var position: String,
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

    fun apply(event: LandedOn) {
        position = event.ground
    }

    fun apply(event: SpaceBought) {
        money -= event.cash
        debt += event.borrowed
    }

    fun applyOwner(event: RentPaid) {
        money += event.rent
    }

    fun applyPlayer(event: RentPaid) {
        money -= event.rent
    }
}

data class OpenRentDemand(
        val landEvent: Int,
        val player: String,
        val owner: String,
        val rent: Int,
        var ttl: Int
)

data class RentDemand(
        val demandEvent: Int,
        val player: String,
        val owner: String,
        val rent: Int
)

sealed class Space {
    abstract val id: String
    abstract fun canBuy(): Boolean
}

interface Ownable {
    val initialPrice: Int
    var owner: String?

    fun canBuy(price: Int): Boolean {
        return owner == null &&
                initialPrice == price
    }

    fun apply(event: SpaceBought) {
        owner = event.player
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
    override var owner: String? = null

    override fun canBuy(): Boolean {
        return owner == null
    }

    fun getRent(fullStreet: Boolean): Int {
        val houses = this.houses
        val hotel = this.hotel
        return when {
            hotel -> rentHotel
            houses != 0 -> rentHouse[houses - 1]
            fullStreet -> 2 * rent
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
    override var owner: String? = null

    override fun canBuy(): Boolean {
        return owner == null
    }

    fun getRent(allUtilities: Boolean, diceRoll: Int): Int {
        val factor = if (allUtilities) {
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
    override var owner: String? = null

    override fun canBuy(): Boolean {
        return owner == null
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
