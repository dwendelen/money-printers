package se.daan.moneyprinters.security

import rxjs.BehaviorSubject
import rxjs.Observable

class Security {
    private val _sessions = BehaviorSubject<MaybeSession>(NoSession)

    val sessions: Observable<MaybeSession> = _sessions

    fun login(id: String, token: String) {
        _sessions.next(Session(id, token))
    }
}

sealed class MaybeSession
object NoSession: MaybeSession()
data class Session(
    val id: String,
    val token: String
): MaybeSession()