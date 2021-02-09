package se.daan.moneyprinters.web.game

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import se.daan.moneyprinters.model.game.Game
import se.daan.moneyprinters.model.game.GameService
import se.daan.moneyprinters.model.game.api.PlayerInfo
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
        val game = gameService.getGame(gameId) ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        return mapGame(game)
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
                is ActionSpace -> se.daan.moneyprinters.model.game.api.ActionSpace(it.text)
                is FreeParking -> se.daan.moneyprinters.model.game.api.FreeParking(it.text)
                is Station -> se.daan.moneyprinters.model.game.api.Station(it.text)
                is Street -> se.daan.moneyprinters.model.game.api.Street(it.text, it.color)
                is Utility -> se.daan.moneyprinters.model.game.api.Utility(it.text)
                is Prison -> se.daan.moneyprinters.model.game.api.Prison(it.text)
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
        if(!result) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST)
        }
        return mapGame(gameService.getGame(gameId)!!)
    }

    private fun mapGame(game: Game): GameInfo {
        return GameInfo(
                game.events.map(this::mapEvent)
        )
    }

    private fun mapEvent(event: ApiEvent): Event {
        return when(event) {
            is ApiGameCreated -> {
                val board = event.board
                        .map {
                            Ground(
                                    it.text,
                                    when (it) {
                                        is ApiStreet -> it.color
                                        is ApiStation -> "lightgrey"
                                        is ApiActionSpace -> null
                                        is ApiFreeParking -> null
                                        is ApiUtility -> null
                                        is ApiPrison -> null
                                    }
                            )
                        }
                GameCreated(
                        GameMaster(
                                event.gameMaster.id,
                                event.gameMaster.name
                        ),
                        board
                )
            }
        }
    }
}