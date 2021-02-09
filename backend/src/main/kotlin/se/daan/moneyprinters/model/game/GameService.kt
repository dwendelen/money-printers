package se.daan.moneyprinters.model.game;

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Component
import se.daan.moneyprinters.model.game.config.GameConfig
import se.daan.moneyprinters.model.game.api.Command
import se.daan.moneyprinters.model.game.api.CreateGame
import java.io.FileInputStream
import java.util.concurrent.ConcurrentHashMap

@Component
class GameService(
        gameProperties: GameProperties,
        objectMapper: ObjectMapper
) {
    val gameConfig: GameConfig = objectMapper.readValue(FileInputStream(gameProperties.configFile))

    private val games = ConcurrentHashMap<String, Game>()

    fun execute(gameId: String, cmd: Command, version: Int): Boolean {
        return if(cmd is CreateGame && version == 0) {
            games.putIfAbsent(gameId,Game(cmd)) == null
        } else {
            games[gameId]
                    ?.execute(cmd, version)
                    ?:false
        }
    }

    fun getGame(gameId: String): Game? {
        return games[gameId]
    }
}
