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
                is DeclineThisSpace -> on(cmd)
                is PassBid -> on(cmd)
                is PlaceBid -> on(cmd)
                is BuyWonBid -> on(cmd)
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
            is PromotedToGameMaster -> apply(event)
            is GameStarted -> Unit
            is NewTurnStarted -> apply(event)
            is DiceRolled -> apply(event)
            is StartMoneyReceived -> apply(event)
            is LandedOnSafeSpace -> apply(event)
            is LandedOnBuyableSpace -> apply(event)
            is SpaceBought -> apply(event)
            is BidStarted -> apply(event)
            is BidPlaced -> apply(event)
            is BidPassed -> apply(event)
            is BidWon -> apply(event)
            is LandedOnHostileSpace -> apply(event)
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
                players.all { it.validate(cmd) } &&
                this.state.validate(cmd)
        ) {
            newEvent(PlayerAdded(
                    cmd.id,
                    cmd.name,
                    cmd.color,
                0
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
                board[0].id,
                event.startDebt,
                event.startDebt
        ))
    }

    private fun apply(event: PromotedToGameMaster) {
        findPlayer(event.player)?.apply(event)
    }

    private fun on(cmd: StartGame): Boolean {
        return if (
                cmd.initiator == gameMaster &&
                players.size >= 2 &&
                this.state.validate(cmd)
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
                this.state.validate(cmd)
        ) {
            val dice1 = random.nextInt(1, 7)
            val dice2 = random.nextInt(1, 7)

            val idx = board.indexOfFirst { it.id == player.position }
            val newPosition = (idx + dice1 + dice2) % board.size

            newEvent(DiceRolled(player.id, dice1, dice2))
            if (newPosition < idx) {
                val interest = floor(player.debt * interestRate).toInt()
                val economyMoney = ceil(economy * returnRate).toInt()
                val startMoney = fixedStartMoney + economyMoney - interest
                newEvent(StartMoneyReceived(player.id, startMoney))
            }
            val space = board[newPosition]
            newEvent(if(space is Ownable) {
                when(val owner = space.owner) {
                    null -> LandedOnBuyableSpace(cmd.player, space.id)
                    cmd.player -> LandedOnSafeSpace(cmd.player, space.id)
                    else -> LandedOnHostileSpace(cmd.player, space.id, owner, events.size)
                }
            } else {
                LandedOnSafeSpace(cmd.player, space.id)
            })
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

    private fun apply(event: LandedOnSafeSpace) {
        val player = findPlayer(event.player)
        if (player != null) {
            player.apply(event)
            state.apply(event)
        }
    }

    private fun apply(event: LandedOnBuyableSpace) {
        val player = findPlayer(event.player)
        if (player != null) {
            player.apply(event)
            state.apply(event)
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
                player.validate(cmd) &&
                space.validate(cmd) &&
                this.state.validate(cmd)
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

    private fun on(cmd: DeclineThisSpace): Boolean {
        val player = findPlayer(cmd.player)
        val space = player?.let { findSpace(it.position) }
        return if(
            space != null &&
            this.state.validate(cmd)
        ) {
            newEvent(BidStarted(
                space.id,
                cmd.player
            ))
            true
        } else {
            false
        }
    }

    private fun apply(event: BidStarted) {
        this.state.apply(event, players.map(Player::id).toSet())
    }

    private fun on(cmd: PlaceBid): Boolean {
        return if(
            hasPlayer(cmd.player) &&
            this.state.validate(cmd)
        ) {
            newEvent(BidPlaced(
                cmd.player,
                cmd.bid
            ))
            true
        } else {
            false
        }
    }

    private fun apply(event: BidPlaced) {
        this.state.apply(event)
    }

    private fun on(cmd: PassBid): Boolean {
        return if(
            state.validate(cmd)
        ) {
            newEvent(BidPassed(
                cmd.player
            ))
            val winner = state.getBidWinner()
            val bid = state.getBestBid()
            if(winner != null && bid != null) {
                newEvent(BidWon(
                    winner,
                    bid
                ))
            }
            true
        } else {
            false
        }
    }

    private fun apply(event: BidPassed) {
        this.state.apply(event)
    }

    private fun apply(event: BidWon) {
        this.state.apply(event)
    }

    private fun on(cmd: BuyWonBid): Boolean {
        val space = this.state.getBidSpace()
        return if(
            space != null &&
            this.state.validate(cmd)
        ) {
            newEvent(SpaceBought(
                space,
                cmd.player,
                cmd.cash,
                cmd.borrowed
            ))
            true
        } else {
            false
        }
    }

    private fun apply(event: LandedOnHostileSpace) {
        val player = findPlayer(event.player)
        val space = findSpace(event.ground)
        val lastRoll = (state as? Turn)?.lastRoll
        if (player != null && space != null && lastRoll != null) {
            player.apply(event)
            val rent = getRent(space, lastRoll)
            state.apply(event, rent ?: 0)
        }
    }

    private fun on(cmd: DemandRent): Boolean {
        val rentDemand = state.findOpenRentDemand(cmd.demandId)

        return if (
                hasPlayer(cmd.owner) &&
                rentDemand != null
        ) {
            newEvent(RentDemanded(
                    rentDemand.owner,
                    rentDemand.player,
                    rentDemand.rent,
                    rentDemand.demandId
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
        val rentDemand = this.state.findRentDemand(cmd.demandId)
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
                    rentDemand.demandId
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
        return if (
                this.state.validate(cmd)
        ) {
            val idx = players.indexOfFirst { it.id == cmd.player }
            val newPlayer = players[(idx + 1) % players.size]
            newEvent(TurnEnded)
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
        fun validate(cmd: AddPlayer): Boolean = false
        fun validate(cmd: StartGame): Boolean = false
        fun apply(event: NewTurnStarted): GameState = this
        fun validate(cmd: RollDice): Boolean = false
        fun apply(event: DiceRolled) {}
        fun apply(event: LandedOnSafeSpace) {}
        fun apply(event: LandedOnBuyableSpace) {}
        fun validate(cmd: BuyThisSpace): Boolean = false
        fun apply(event: SpaceBought) {}
        fun validate(cmd: DeclineThisSpace): Boolean = false
        fun apply(event: BidStarted, players: Set<String>) {}
        fun apply(event: BidPlaced) {}
        fun apply(event: BidPassed) {}
        fun apply(event: BidWon) {}
        fun getBestBid(): Int? = null
        fun getBidWinner(): String? = null
        fun apply(event: LandedOnHostileSpace, rent: Int) {}
        fun findOpenRentDemand(demandId: Int): OpenRentDemand? = null
        fun apply(event: RentDemanded) {}
        fun findRentDemand(demandId: Int): RentDemand? = null
        fun canPayRent(rentDemand: RentDemand) = false
        fun apply(event: RentPaid): GameState = this
        fun validate(cmd: EndTurn): Boolean = false
        fun validate(cmd: PlaceBid): Boolean = false
        fun validate(cmd: PassBid): Boolean = false
        fun validate(cmd: BuyWonBid): Boolean = false
        fun getBidSpace(): String? = null
    }

    private class WaitingForStart : GameState {
        override fun validate(cmd: AddPlayer) = true
        override fun validate(cmd: StartGame) = true
        override fun apply(event: NewTurnStarted): GameState {
            return Turn(event.player, emptyList())
        }
    }

    private class Turn(
            val player: String,
            var openRentDemands: List<OpenRentDemand>
    ) : GameState {
        var state: TurnState = WaitingForDiceRoll()
        var lastRoll: Int? = null

        override fun validate(cmd: RollDice): Boolean {
            return this.player == player && state.validate(cmd)
        }

        override fun apply(event: DiceRolled) {
            openRentDemands
                    .forEach { it.ttl-- }
            openRentDemands = openRentDemands
                    .filter { it.ttl > 0 }
            lastRoll = event.dice1 + event.dice2
            this.state = WaitingForDiceOutcome()
        }

        override fun apply(event: LandedOnSafeSpace) {
            this.state = WaitingForEndTurn()
        }

        override fun apply(event: LandedOnBuyableSpace) {
            this.state = LandedOnNewGround()
        }

        override fun apply(event: LandedOnHostileSpace, rent: Int) {
            openRentDemands = openRentDemands + OpenRentDemand(event.demandId, event.player, event.owner, rent, 2)
            this.state = WaitingForEndTurn()
        }

        override fun validate(cmd: BuyThisSpace): Boolean {
            return this.player == player && state.validate(cmd)
        }

        override fun validate(cmd: DeclineThisSpace): Boolean {
            return this.player == player && state.validate(cmd)
        }

        override fun findOpenRentDemand(demandId: Int): OpenRentDemand? {
            return openRentDemands.find { it.demandId == demandId }
        }

        override fun apply(event: SpaceBought) {
            this.state = WaitingForEndTurn()
        }

        override fun apply(event: BidStarted, players: Set<String>) {
            this.state = BidForGround(event.ground, event.defaultWinner, players)
        }

        override fun apply(event: BidPlaced) {
            this.state.apply(event)
        }

        override fun apply(event: BidPassed) {
            this.state.apply(event)
        }

        override fun apply(event: BidWon) {
            this.state = this.state.apply(event)
        }

        override fun getBestBid(): Int? {
            return this.state.getBestBid()
        }

        override fun getBidWinner(): String? {
            return this.state.getBidWinner()
        }

        override fun apply(event: RentDemanded) {
            openRentDemands = openRentDemands
                    .filter { it.demandId != event.demandId }
        }

        override fun canPayRent(rentDemand: RentDemand): Boolean {
            return this.state.canPayRent(rentDemand)
        }

        override fun validate(cmd: EndTurn): Boolean {
            return this.player == player && state.validate(cmd)
        }

        override fun apply(event: NewTurnStarted): GameState {
            return Turn(event.player, openRentDemands)
        }

        override fun validate(cmd: PlaceBid): Boolean {
            return this.state.validate(cmd)
        }

        override fun validate(cmd: PassBid): Boolean {
            return this.state.validate(cmd)
        }

        override fun validate(cmd: BuyWonBid): Boolean {
            return this.state.validate(cmd)
        }

        override fun getBidSpace(): String? {
            return this.state.getBidSpace()
        }
    }

    private class WaitingForRentPayment(
        val demand: RentDemand,
        val previousState: GameState
    ) : GameState {
        override fun canPayRent(rentDemand: RentDemand): Boolean {
            return rentDemand == demand
        }

        override fun findRentDemand(demandId: Int): RentDemand? {
            return if (demand.demandId == demandId) {
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
        fun validate(cmd: RollDice) = false
        fun validate(cmd: BuyThisSpace) = false
        fun validate(cmd: DeclineThisSpace) = false
        fun getBestBid(): Int? = null
        fun apply(event: BidPlaced) {}
        fun apply(event: BidPassed) {}
        fun apply(event: BidWon): TurnState = this
        fun getBidWinner(): String? = null
        fun canPayRent(rentDemand: RentDemand) = false
        fun validate(cmd: EndTurn) = false
        fun validate(cmd: PlaceBid): Boolean = false
        fun validate(cmd: PassBid): Boolean = false
        fun validate(cmd: BuyWonBid): Boolean = false
        fun getBidSpace(): String? = null
    }

    private class WaitingForDiceRoll : TurnState {
        override fun validate(cmd: RollDice) = true
    }

    private class WaitingForDiceOutcome : TurnState

    private class LandedOnNewGround : TurnState {
        override fun validate(cmd: BuyThisSpace) = true
        override fun validate(cmd: DeclineThisSpace) = true
    }

    private class BidForGround(
        val space: String,
        var bestPlayer: String,
        var players: Set<String>
    ): TurnState {
        var bid = 0

        override fun getBestBid(): Int {
            return bid
        }

        override fun validate(cmd: PlaceBid): Boolean {
            return cmd.bid > bid
        }

        override fun apply(event: BidPlaced) {
            bestPlayer = event.player
            bid = event.bid
            players = players + event.player
        }

        override fun validate(cmd: PassBid): Boolean {
            return players.contains(cmd.player) && bestPlayer != cmd.player
        }

        override fun apply(event: BidPassed) {
            players = players - event.player
        }

        override fun getBidWinner(): String? {
            return if(players.size == 1) {
                players.first()
            } else {
                null
            }
        }

        override fun apply(event: BidWon): TurnState {
            return BidJustWon(bestPlayer, space, event.bid)
        }
    }

    private class BidJustWon(
        val player: String,
        val space: String,
        val price: Int
    ): TurnState {
        override fun getBidWinner(): String? {
            return null
        }

        override fun validate(cmd: BuyWonBid): Boolean {
            return cmd.player == player &&
                    price == cmd.borrowed + cmd.cash
        }

        override fun getBidSpace(): String {
            return space
        }

    }

    private class WaitingForEndTurn : TurnState {
        override fun validate(cmd: EndTurn) = true
    }
}

class Player(
        val id: String,
        val color: String,
        var position: String,
        var money: Int,
        var debt: Int,
        var gameMaster: Boolean = false
) {
    fun validate(cmd: AddPlayer): Boolean {
        return cmd.id != this.id && cmd.color != this.color
    }

    fun apply(event: PromotedToGameMaster) {
        gameMaster = true
    }

    fun validate(cmd: BuyThisSpace): Boolean {
        return money >= cmd.cash
    }

    fun apply(event: StartMoneyReceived) {
        money += event.amount
    }

    fun apply(event: LandedOnSafeSpace) {
        position = event.ground
    }

    fun apply(event: LandedOnBuyableSpace) {
        position = event.ground
    }

    fun apply(event: LandedOnHostileSpace) {
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
    val demandId: Int,
    val player: String,
    val owner: String,
    val rent: Int,
    var ttl: Int
)

data class RentDemand(
    val demandId: Int,
    val player: String,
    val owner: String,
    val rent: Int
)

sealed class Space {
    abstract val id: String
}

interface Ownable {
    val initialPrice: Int
    var owner: String?

    fun validate(cmd: BuyThisSpace): Boolean {
        return owner == null &&
                initialPrice == cmd.borrowed + cmd.cash
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
}

class Utility(
        override val id: String,
        override val initialPrice: Int,
        val rent: Int,
        val rentAll: Int
) : Space(), Ownable {
    override var owner: String? = null

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

    fun getRent(nbOfStations: Int): Int {
        return rent[nbOfStations - 1]
    }
}

class FreeParking(
        override val id: String
) : Space() {
}

class Prison(
        override val id: String
) : Space() {
}
