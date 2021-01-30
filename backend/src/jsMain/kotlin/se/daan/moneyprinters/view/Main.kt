package se.daan.moneyprinters.view

//import se.daan.moneyprinters.security.MaybeSession
//import se.daan.moneyprinters.view.pages.loginPage
//import se.daan.moneyprinters.security.signOut

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