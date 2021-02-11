package se.daan.moneyprinters.web.game.api

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes(
        value = [
            JsonSubTypes.Type(value = GameCreated::class, name = "GameCreated"),
            JsonSubTypes.Type(value = PlayerAdded::class, name = "PlayerAdded"),
        ]
)
sealed class Event

data class GameCreated(
        val gameMaster: GameMaster,
        val board: List<Ground>
): Event()

data class PlayerAdded(
        val id: String,
        val name: String
): Event()
