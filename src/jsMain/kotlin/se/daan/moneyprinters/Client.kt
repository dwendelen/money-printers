package se.daan.moneyprinters


import http.put
import observed.Publisher
import se.daan.moneyprinters.web.api.CreateGame


fun createGame(uuid: String, createGame: CreateGame): Publisher<Any> {
    return put("/games/$uuid", createGame)
}
