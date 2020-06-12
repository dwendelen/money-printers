package se.daan.moneyprinters

import se.daan.moneyprinters.security.Security

class MoneyPrinters(
    private val security: Security
) {
    @JsName("start")
    fun start() {
        security.sessions
            .subscribe {
                println(it.id)
                println(it.token)
            }
    }

    @JsName("login")
    fun login(id: String, token: String) {
        security.login(id, token)
    }
}