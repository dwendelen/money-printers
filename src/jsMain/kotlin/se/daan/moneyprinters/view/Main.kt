package se.daan.moneyprinters.view

import observed.Publisher
import se.daan.moneyprinters.view.pages.loginPage
import se.daan.moneyprinters.security.Security
import se.daan.moneyprinters.view.engine.clazz
import se.daan.moneyprinters.view.engine.div
import se.daan.moneyprinters.view.pages.errorPage
import se.daan.moneyprinters.view.pages.gamePage
import se.daan.moneyprinters.view.pages.gamesPage


fun mainPage(routes: Publisher<Route>, security: Security) =
    div(listOf(clazz("money-printers")),
        routes.map<Any> { route ->
            when (route) {
                is Login -> loginPage(security)
                is Games -> gamesPage()
                is Game -> gamePage()
                ErrorPage -> errorPage()
            }
        }
    )
