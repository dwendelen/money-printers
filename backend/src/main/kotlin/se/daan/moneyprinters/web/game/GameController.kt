package se.daan.moneyprinters.web.game

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import se.daan.moneyprinters.model.game.Game
import se.daan.moneyprinters.model.game.GameService
import se.daan.moneyprinters.model.game.api.Command
import se.daan.moneyprinters.model.game.config.*
import se.daan.moneyprinters.web.game.api.CreateGame
import se.daan.moneyprinters.web.game.api.Events
import se.daan.moneyprinters.web.game.api.GameInfo
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
    ): GameInfo {
        val game = gameService.getGame(gameId)
                ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        return mapGame(gameId, game)
    }

    @GetMapping("/{gameId}/events")
    fun getEvents(
            @PathVariable("gameId") gameId: String,
            @RequestParam("skip") skip: Int,
            @RequestParam("limit") limit: Int
    ): Events {
        val game = gameService.getGame(gameId)
                ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val newEvents = game.getNewEvents(skip, limit)
        return Events(newEvents)
    }



    @PutMapping("/{gameId}/commands")
    fun getEvents(
            @PathVariable("gameId") gameId: String,
            @RequestParam("version") version: Int,
            @RequestBody cmd: Command
    ) {
        val game = gameService.getGame(gameId)
                ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

        game.execute(cmd, version)
    }


    @PutMapping("/{gameId}")
    fun createGame(
            @PathVariable("gameId") gameId: String,
            @RequestBody createGame: CreateGame
    ): GameInfo {
        val gameConfig = gameService.gameConfig
        val board = gameConfig.board.map {
            when (it) {
                is ActionSpace -> ApiActionSpace(it.id, it.text)
                is FreeParking -> ApiFreeParking(it.id, it.text)
                is Station -> ApiStation(it.id, it.text)
                is Street -> ApiStreet(it.id, it.text, it.color)
                is Utility -> ApiUtility(it.id, it.text)
                is Prison -> ApiPrison(it.id, it.text)
            }
        }
        val result = gameService.execute(
                gameId,
                ApiCreateGame(
                        createGame.gameMaster,
                        board,
                        gameConfig.fixedStartMoney
                ),
                0
        )
        if (!result) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST)
        }
        return mapGame(gameId, gameService.getGame(gameId)!!)
    }

    private fun mapGame(gameId: String, game: Game): GameInfo {
        return GameInfo(
                gameId,
                game.events
        )
    }
}
