package se.daan.moneyprinters

import rxjs.Observable
import rxjs.ajax.ajax
import rxjs.operators.map
import se.daan.moneyprinters.web.api.CreateGame


fun createGame(uuid: String, createGame: CreateGame): Observable<Any> {
    return ajax.put<Any>("/games/$uuid", createGame).pipe(
        map { vl -> vl.response}
    )
}
