package se.daan.moneyprinters

import se.daan.moneyprinters.security.NoSession
import se.daan.moneyprinters.security.Security
import se.daan.moneyprinters.security.Session

class MoneyPrinters(
    private val security: Security
) {
    @JsName("start")
    fun start() {
        security.sessions
            .subscribe {
                when(it) {
                    is Session -> {
                        println(it.id)
                        println(it.token)
                    }
                    is NoSession -> {
                        println("No session")
                    }
                }
            }
    }

    @JsName("login")
    fun login(id: String, token: String) {
        security.login(id, token)
    }
}