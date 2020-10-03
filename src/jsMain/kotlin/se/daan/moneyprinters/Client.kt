package se.daan.moneyprinters


import http.put
import se.daan.moneyprinters.web.api.CreateGame
import kotlin.js.Promise


fun createGame(uuid: String, createGame: CreateGame): Promise<Any> {
    return put("/games/$uuid", createGame)
}
