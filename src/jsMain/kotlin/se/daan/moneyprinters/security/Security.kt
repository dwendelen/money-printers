package se.daan.moneyprinters.security

import gapi.Gapi
import gapi.auth2.Auth2
import http.get
import observed.*
import se.daan.moneyprinters.web.api.Config
import kotlin.browser.window
import gapi.gapi as gapigapi

private val gapi: Publisher<Gapi> = create { sub ->
    window.asDynamic()["onGapiLoad"] = {
        sub.onNext(gapigapi)
        sub.onComplete()
    }
}
private val config: Publisher<Config> = get("/config")

val signIn = subject<Any>()
val signOut = subject<Any>()
val sessions = combineLatest(gapi, config) { g, c ->
        sessions(g, c.googleClientId, signIn, signOut)
    }.flatMap { it }
    .cache()

fun sessions(gapi: Gapi, clientId: String, signIn: Publisher<Any>, signOut: Publisher<Any>): Publisher<MaybeSession> {
    val googleAuth = create<Auth2> { sub ->
        gapi.load("auth2") {
            sub.onNext(gapi.auth2)
            sub.onComplete()
        }
    }.map { c ->
        val params: dynamic = object {}
        params["client_id"] = clientId
        c.init(params)
    }.cache()

    val signedIn = combineLatest(googleAuth, signIn) { ga, _ -> ga }
        .flatMap { from(it.signIn()) }
        .map { Session(it.getId(), it.getAuthResponse().id_token) }

    val signedOut = combineLatest(googleAuth, signOut) { ga, _ -> ga }
        .flatMap { from(it.signOut()) }
        .map { NoSession }

    return merge(from(NoSession), signedIn, signedOut).distinct()
}

sealed class MaybeSession
object NoSession : MaybeSession()
data class Session(
    val id: String,
    val token: String
) : MaybeSession()