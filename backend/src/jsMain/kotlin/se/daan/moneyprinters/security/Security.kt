package se.daan.moneyprinters.security

import gapi.auth2.Auth2
import gapi.auth2.GoogleAuth
import http.get
import se.daan.moneyprinters.web.api.Config
import kotlin.browser.window
import kotlin.js.Promise


private val config: Promise<Config> = get("/config")

class Security(private val auth: GoogleAuth) {
    var state: LoginState = LoggedOut

    fun init() {
        auth.currentUser.listen { user ->
            state = if(user.isSignedIn()) {
                LoggedIn(user.getId(), user.getAuthResponse().id_token)
            } else {
                LoggedOut
            }
        }

        state = LoggedOut
    }

    fun login() {
        auth.signIn()
    }

    fun logout() {
        auth.signOut()
    }
}

sealed class LoginState
object LoggedOut: LoginState()
data class LoggedIn(
    val id: String,
    val token: String
): LoginState()


class SecurityFactory {
    fun create(): Promise<Security> {
        return Promise.all(arrayOf(config, loadAuth2()))
            .then {
                val config: Config = it[0] as Config
                val auth2: Auth2 = it[1] as Auth2

                val params: dynamic = object {}
                params["client_id"] = config.googleClientId

                val newAuth = auth2.init(params)
                Security(newAuth)
            }
    }

    private fun loadAuth2(): Promise<Auth2> {
        return Promise {res, _ ->
            window.asDynamic()["onGapiLoad"] = {
                gapi.gapi.load("auth2") {
                    res(gapi.gapi.auth2)
                }
            }
        }
    }
}