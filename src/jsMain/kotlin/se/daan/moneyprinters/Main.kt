package se.daan.moneyprinters

import rxjs.ajax.AjaxError
import se.daan.moneyprinters.security.Security
import se.daan.moneyprinters.web.api.CreateGame

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
}

