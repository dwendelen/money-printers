package se.daan.moneyprinters.view

import observed.Publisher
//import se.daan.moneyprinters.security.MaybeSession
//import se.daan.moneyprinters.view.pages.loginPage
//import se.daan.moneyprinters.security.signOut
import se.daan.moneyprinters.view.engine.button
import se.daan.moneyprinters.view.engine.clazz
import se.daan.moneyprinters.view.engine.click
import se.daan.moneyprinters.view.engine.div
import se.daan.moneyprinters.view.pages.errorPage
import se.daan.moneyprinters.view.pages.gamePage
import se.daan.moneyprinters.view.pages.gamesPage

/*
fun mainPage(routes: Publisher<Route>, sessions: Publisher<MaybeSession>) =
    div(listOf(clazz("money-printers")),
        content(routes).map { listOf(logout(), it) }
    )

private fun logout() =
    button(listOf(click(signOut)),"Log out")

private fun content(routes: Publisher<Route>) =
    routes.map { route ->
        when (route) {
            is Login -> loginPage()
            is Games -> gamesPage()
            is Game -> gamePage()
            ErrorPage -> errorPage()
        }
    }

 */