package se.daan.moneyprinters.view

import loginPage
import rxjs.Observable
import rxjs.operators.map
import se.daan.moneyprinters.view.engine.clazz
import se.daan.moneyprinters.view.engine.div
import se.daan.moneyprinters.view.pages.errorPage
import se.daan.moneyprinters.view.pages.gamePage


fun mainPage(routes: Observable<Route>) =
    div(listOf(clazz("money-printers")),
        routes.pipe(map<Route, Any> { route ->
            when (route) {
                is Login -> loginPage()
                is Game -> gamePage()
                ErrorPage -> errorPage()
            }
        })
    )
