package se.daan.moneyprinters.view.pages

import gapi.auth2.GoogleUser
import org.w3c.dom.HTMLDivElement
import se.daan.moneyprinters.security.Security
import se.daan.moneyprinters.view.Login
import se.daan.moneyprinters.view.engine.clazz
import se.daan.moneyprinters.view.engine.data
import se.daan.moneyprinters.view.engine.div
import kotlin.browser.window

lateinit var security: Security

fun loginPage(sec: Security): HTMLDivElement {
    security = sec
    window.asDynamic()["onLogin"] = ::onLogin
    return div(listOf(clazz("g-signin2"), data("onsuccess", "onLogin")), listOf<Any>())
}

private fun onLogin(user: GoogleUser) {
    security.login(user.getId(), user.getAuthResponse().id_token)
}