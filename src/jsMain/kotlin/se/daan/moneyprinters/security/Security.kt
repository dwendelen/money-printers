package se.daan.moneyprinters.security

import gapi.Gapi
import gapi.auth2.Auth2
import gapi.auth2.GoogleAuth
import gapi.auth2.GoogleUser
import http.get
import observed.*
import se.daan.moneyprinters.web.api.Config
import kotlin.browser.window
import gapi.gapi as gapigapi

private val gapi: Publisher<Gapi> = create { sub ->
    window.asDynamic()["onGapiLoad"] = {
        sub.onNext(gapigapi)
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
        }
    }.map { c ->
        val params: dynamic = object {}
        params["client_id"] = clientId
        c.init(params)
    }.cache()

    val session = googleAuth
        .flatMap { go ->
            create<GoogleUser> { sub ->
                go.currentUser.listen {
                    sub.onNext(it)
                }
            }
        }
        .map { user ->
            if(user.isSignedIn()) {
                Session(user.getId(), user.getAuthResponse().id_token)
            } else {
                NoSession
            }
        }

    combineLatest(googleAuth, signIn) { ga, _ -> ga }
        .subscribe(object: Subscriber<GoogleAuth> {
            override fun onNext(t: GoogleAuth) {
                t.signIn()
            }
        })

    combineLatest(googleAuth, signOut) { ga, _ -> ga }
        .subscribe(object: Subscriber<GoogleAuth> {
            override fun onNext(t: GoogleAuth) {
                t.signOut()
            }
        })

    return merge(from(NoSession), session).distinct()
}

sealed class MaybeSession
object NoSession : MaybeSession()
data class Session(
    val id: String,
    val token: String
) : MaybeSession()