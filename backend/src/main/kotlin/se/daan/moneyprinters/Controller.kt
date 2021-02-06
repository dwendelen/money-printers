package se.daan.moneyprinters

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import se.daan.moneyprinters.config.GameConfig
import se.daan.moneyprinters.config.SecurityConfig
import se.daan.moneyprinters.web.api.*
import se.daan.moneyprinters.web.api.Player
import java.util.concurrent.ConcurrentHashMap

@RestController
@RequestMapping("/api")
class Controller(
        private val gameConfig: GameConfig,
        private val securityConfig: SecurityConfig
) {
    private val games = ConcurrentHashMap<String, Game>()

    @GetMapping("/config", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun getConfig(): Config {
        return Config(securityConfig.googleClientId)
    }

    @GetMapping("/games/{gameId}")
    fun getGame(
            @PathVariable("gameId") gameId: String
    ): GameInfo {
        val game = games[gameId] ?: throw ResponseStatusException(HttpStatus.NOT_FOUND);
        return mapGame(game)
    }

    @PutMapping("/games/{gameId}")
    fun createGame(
            @PathVariable("gameId") gameId: String,
            @RequestBody createGame: CreateGame
    ): GameInfo {
        val gameMaster = se.daan.moneyprinters.Player(
                createGame.gameMaster.id,
                createGame.gameMaster.name
        )
        val game = Game(gameId, mutableMapOf(gameMaster.id to gameMaster), gameMaster)
        games[gameId] = game

        return mapGame(game)
    }

    @PutMapping("/games/{gameId}/players/{playerId}")
    fun joinGame(
            @PathVariable("gameId") gameId: String,
            @PathVariable("playerId") playerId: String,
            @RequestBody joinGame: JoinGame
    ) {
        val game = games[gameId] ?: throw ResponseStatusException(HttpStatus.NOT_FOUND);
        game.players[playerId] = se.daan.moneyprinters.Player(
                playerId,
                joinGame.name
        )
    }

    private fun mapGame(game: Game) = GameInfo(
            game.id,
            game.players.values.map {
                Player(it.id, it.name)
            }
    )
}