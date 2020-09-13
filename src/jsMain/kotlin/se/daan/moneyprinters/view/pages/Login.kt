package se.daan.moneyprinters.view.pages

import se.daan.moneyprinters.security.signIn
import se.daan.moneyprinters.view.engine.*

fun loginPage() =
    button(listOf(click(signIn)),"Log in with Google")
