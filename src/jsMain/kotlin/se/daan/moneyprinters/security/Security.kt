package se.daan.moneyprinters.security

import gapi.auth2.GoogleAuth
import gapi.auth2.GoogleUser
import http.get
import observed.*
import org.w3c.dom.HTMLDivElement
import se.daan.moneyprinters.view.engine.clazz
import se.daan.moneyprinters.view.engine.data
import se.daan.moneyprinters.view.engine.div
import se.daan.moneyprinters.view.pages.security
import se.daan.moneyprinters.web.api.Config
import kotlin.browser.window

private val gapiLoaded: Publisher<Any> = create { sub ->
    window.asDynamic()["onGapiLoad"] = {
        sub.onNext("")
    }
}

private fun loadAuth2(): Publisher<Any> = create { sub ->
    gapi.load("auth2") { sub.onNext("") }
}

private fun initAuth2(clientId: String): GoogleAuth {
    val params: dynamic = object {}
    params["clientId"] = clientId
    return gapi.auth2.init(params)
}

private val auth2Initialised = gapiLoaded
    .flatMap { loadAuth2() }

private val config: Publisher<Config> = get("/config")

private val auth2: Publisher<GoogleAuth> =
    combineLatest(auth2Initialised, config) { _, c ->
        initAuth2(c.googleClientId)
    }
        .cache()

fun signIn(googleAuth: GoogleAuth): Publisher<GoogleUser> {
    return from(googleAuth.signIn())
}

fun signOut(googleAuth: GoogleAuth): Publisher<dynamic> {
    return from(googleAuth.signOut())
}


/*
gapi.load("auth2") {

            val googleAuth = gapi.auth2.init(params)
            googleAuth.
        }
 */


fun loginPage(sec: Security): HTMLDivElement {
    security = sec

    return div(listOf(clazz("g-signin2"), data("onsuccess", "onLogin")), listOf<Any>())
}

private fun onLogin(user: GoogleUser) {
    security.login(user.getId(), user.getAuthResponse().id_token)
}


class Security {
    private val _sessions: Subject<MaybeSession> = subject()
    val sessions: Publisher<MaybeSession> = _sessions.cache()

    init {
        _sessions.onNext(NoSession)
    }

    fun login(id: String, token: String) {
        _sessions.onNext(Session(id, token))
    }
}

sealed class MaybeSession
object NoSession : MaybeSession()
data class Session(
    val id: String,
    val token: String
) : MaybeSession()