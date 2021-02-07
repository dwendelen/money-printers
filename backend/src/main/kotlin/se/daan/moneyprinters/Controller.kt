package se.daan.moneyprinters

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import se.daan.moneyprinters.config.*
import se.daan.moneyprinters.web.api.*
import se.daan.moneyprinters.web.api.Ground
import se.daan.moneyprinters.web.api.Player
import java.io.FileInputStream
import java.util.concurrent.ConcurrentHashMap

@RestController
@RequestMapping("/api")
class Controller(
        private val securityProperties: SecurityProperties,
        gameProperties: GameProperties,
        objectMapper: ObjectMapper
) {
    private val gameConfig: GameConfig = objectMapper.readValue(FileInputStream(gameProperties.configFile))

    private val games = ConcurrentHashMap<String, Game>()

    @GetMapping("/config", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun getConfig(): Config {
        return Config(securityProperties.googleClientId)
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
                createGame.gameMaster.name,
                0,
                0
        )
        val board = gameConfig.board.map {
            when(it) {
                is se.daan.moneyprinters.config.ActionSpace -> ActionSpace(it.text)
                is se.daan.moneyprinters.config.FreeParking -> FreeParking(it.text)
                is se.daan.moneyprinters.config.Station -> Station(it.text)
                is se.daan.moneyprinters.config.Street -> Street(it.text, it.color)
                is se.daan.moneyprinters.config.Utility -> Utility(it.text)
            }
        }
        val game = Game(
                gameId,
                mutableMapOf(gameMaster.id to gameMaster),
                gameMaster,
                board
        )
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
        if(!game.players.containsKey(playerId)) {
            game.players[playerId] = se.daan.moneyprinters.Player(
                    playerId,
                    joinGame.name,
                    0,
                    0
            )
        }
    }

    private fun mapGame(game: Game) = GameInfo(
            game.id,
            game.players.values.map {
                Player(it.id, it.name, it.money, it.debt)
            },
            game.board.map {
                Ground(
                        it.text,
                        when (it) {
                            is Street -> it.color
                            is Station -> "lightgrey"
                            is ActionSpace -> null
                            is FreeParking -> null
                            is Utility -> null
                        }
                )
            },
            game.gameMaster.id
    )
}