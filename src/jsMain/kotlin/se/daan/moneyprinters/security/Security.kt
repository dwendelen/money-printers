package se.daan.moneyprinters.security

import rxjs.BehaviorSubject
import rxjs.Observable
import rxjs.operators.skip

class Security {
    private val _sessions = BehaviorSubject<Session>()

    val sessions: Observable<Session>
        get() = _sessions.pipe(
            skip(1)
        )


    fun login(id: String, token: String) {
        _sessions.next(Session(id, token))
    }
}

data class Session(
    val id: String,
    val token: String
)