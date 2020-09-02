package se.daan.moneyprinters


import observed.combineLatest
import se.daan.moneyprinters.security.MaybeSession
import se.daan.moneyprinters.security.Security
import se.daan.moneyprinters.view.engine.changeHash
import se.daan.moneyprinters.view.engine.hash
import se.daan.moneyprinters.web.api.CreateGame
import se.daan.moneyprinters.view.mainPage
import se.daan.moneyprinters.view.engine.render
import se.daan.moneyprinters.view.route
import kotlin.browser.document

/*
fun createAndStart(): MoneyPrinters {
    val security = Security()
    val moneyPrinters = MoneyPrinters(security)
    moneyPrinters.start()
    return moneyPrinters
}

fun start() {
    createGame("test", CreateGame("a", null, null))
        .subscribe({v ->
            println(v)
        }, { err: AjaxError<dynamic> ->
            println(err.status)
            println(err.response)
        })
}*/

fun main() {

    val security = Security()

    document.addEventListener("DOMContentLoaded", {
        val sessions = security.sessions
        val routed = combineLatest(sessions, hash()) { s, h ->
            route(s, h)
        }.distinct()

        changeHash(routed.map{r -> r.hash().joinToString("/")})
        render(mainPage(routed, security))
    })
}

