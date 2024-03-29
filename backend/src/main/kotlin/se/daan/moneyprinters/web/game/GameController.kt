package se.daan.moneyprinters.web.game

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import se.daan.moneyprinters.model.game.Game
import se.daan.moneyprinters.model.game.GameService
import se.daan.moneyprinters.model.game.api.Command
import se.daan.moneyprinters.model.game.config.*
import se.daan.moneyprinters.web.game.api.CommandResult
import se.daan.moneyprinters.web.game.api.CreateGame
import se.daan.moneyprinters.web.game.api.Events
import se.daan.moneyprinters.model.game.api.ActionSpace as ApiActionSpace
import se.daan.moneyprinters.model.game.api.CreateGame as ApiCreateGame
import se.daan.moneyprinters.model.game.api.FreeParking as ApiFreeParking
import se.daan.moneyprinters.model.game.api.Prison as ApiPrison
import se.daan.moneyprinters.model.game.api.Station as ApiStation
import se.daan.moneyprinters.model.game.api.Street as ApiStreet
import se.daan.moneyprinters.model.game.api.Utility as ApiUtility

@RestController
@RequestMapping("/api/games")
class GameController(
        private val gameService: GameService
) {
    @GetMapping("/{gameId}")
    fun getGame(
            @PathVariable("gameId") gameId: String
    ) {
        gameService.getGame(gameId) ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
    }

    @GetMapping("/{gameId}/events")
    fun getEvents(
            @PathVariable("gameId") gameId: String,
            @RequestParam("skip") skip: Int,
            @RequestParam("limit") limit: Int,
            @RequestParam("timeout") timeout: Int
    ): Events {
        val game = gameService.getGame(gameId)
                ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val newEvents = game.getNewEvents(skip, limit, timeout)
        return Events(newEvents)
    }

    @PutMapping("/{gameId}/commands")
    fun executeCommand(
            @PathVariable("gameId") gameId: String,
            @RequestParam("version") version: Int,
            @RequestParam("limit") limit: Int,
            @RequestBody cmd: Command
    ): CommandResult {
        val game = gameService.getGame(gameId)
                ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

        val result = game.execute(cmd, version)
        return if(result) {
            val newEvents = game.getNewEvents(version, limit, 0)
            CommandResult(true, newEvents)
        } else {
            CommandResult(false, emptyList())
        }
    }


    @PutMapping("/{gameId}")
    fun createGame(
            @PathVariable("gameId") gameId: String,
            @RequestBody createGame: CreateGame
    ) {
        val gameConfig = gameService.gameConfig
        val board = gameConfig.board.map {
            when (it) {
                is ActionSpace -> ApiActionSpace(it.id, it.text)
                is FreeParking -> ApiFreeParking(it.id, it.text)
                is Station -> ApiStation(
                        it.id,
                        it.text,
                        it.initialPrice,
                        it.rent
                )
                is Street -> ApiStreet(
                        it.id,
                        it.text,
                        it.color,
                        it.initialPrice,
                        it.rent,
                        it.rentHouse,
                        it.rentHotel,
                        it.priceHouse,
                        it.priceHotel
                )
                is Utility -> ApiUtility(
                        it.id,
                        it.text,
                        it.initialPrice,
                        it.rent,
                        it.rentAll
                )
                is Prison -> ApiPrison(it.id, it.text)
            }
        }
        val result = gameService.execute(
                gameId,
                ApiCreateGame(
                        createGame.gameMaster,
                        board,
                        gameConfig.fixedStartMoney,
                        gameConfig.interestRate,
                        gameConfig.returnRate
                ),
                0,
                0
        )
        if (!result) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST)
        }
    }
}
