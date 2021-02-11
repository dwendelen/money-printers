package se.daan.moneyprinters.web.game

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import se.daan.moneyprinters.model.game.Game
import se.daan.moneyprinters.model.game.GameService
import se.daan.moneyprinters.model.game.api.PlayerInfo
import se.daan.moneyprinters.model.game.api.Space
import se.daan.moneyprinters.model.game.config.*
import se.daan.moneyprinters.model.game.api.ActionSpace as ApiActionSpace
import se.daan.moneyprinters.model.game.api.CreateGame as ApiCreateGame
import se.daan.moneyprinters.model.game.api.Event as ApiEvent
import se.daan.moneyprinters.model.game.api.FreeParking as ApiFreeParking
import se.daan.moneyprinters.model.game.api.GameCreated as ApiGameCreated
import se.daan.moneyprinters.model.game.api.Prison as ApiPrison
import se.daan.moneyprinters.model.game.api.Station as ApiStation
import se.daan.moneyprinters.model.game.api.Street as ApiStreet
import se.daan.moneyprinters.model.game.api.Utility as ApiUtility
import se.daan.moneyprinters.model.game.api.PlayerAdded as ApiPlayerAdded
import se.daan.moneyprinters.model.game.api.AddPlayer as ApiAddPlayer
import se.daan.moneyprinters.web.game.api.*

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
        val newEvents = game.events
                .drop(skip)
                .take(limit)
        return Events(mapEvents(newEvents))
    }

    @PutMapping("/{gameId}/commands")
    fun getEvents(
            @PathVariable("gameId") gameId: String,
            @RequestParam("version") version: Int,
            @RequestBody cmd: Command
    ) {
        val game = gameService.getGame(gameId)
                ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val apiCmd = when(cmd) {
            is AddPlayer -> ApiAddPlayer(
                    cmd.id,
                    cmd.name
            )
        }
        game.execute(apiCmd, version)
    }


    @PutMapping("/{gameId}")
    fun createGame(
            @PathVariable("gameId") gameId: String,
            @RequestBody createGame: CreateGame
    ): GameInfo {
        val gameConfig = gameService.gameConfig
        val gameMaster = PlayerInfo(
                createGame.gameMaster.id,
                createGame.gameMaster.name
        )
        val board = gameConfig.board.map {
            when (it) {
                is ActionSpace -> ApiActionSpace(it.text)
                is FreeParking -> ApiFreeParking(it.text)
                is Station -> ApiStation(it.text)
                is Street -> ApiStreet(it.text, it.color)
                is Utility -> ApiUtility(it.text)
                is Prison -> ApiPrison(it.text)
            }
        }
        val result = gameService.execute(
                gameId,
                ApiCreateGame(
                        gameMaster,
                        board
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
                mapEvents(game.events)
        )
    }

    private fun mapEvents(events: List<ApiEvent>) =
            events.map {
                when (it) {
                    is ApiGameCreated -> mapGameCreated(it)
                    is ApiPlayerAdded -> PlayerAdded(it.id, it.name)
                }
            }

    private fun mapGameCreated(gameCreated: ApiGameCreated): GameCreated {
        val board = gameCreated.board
                .map(this::mapGround)
        return GameCreated(
                GameMaster(
                        gameCreated.gameMaster.id,
                        gameCreated.gameMaster.name
                ),
                board
        )
    }

    private fun mapGround(space: Space) =
            Ground(
                    space.text,
                    when (space) {
                        is ApiStreet -> space.color
                        is ApiStation -> "lightgrey"
                        is ApiActionSpace -> null
                        is ApiFreeParking -> null
                        is ApiUtility -> null
                        is ApiPrison -> null
                    }
            )
}
