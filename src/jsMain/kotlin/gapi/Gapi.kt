package gapi

import gapi.auth2.Auth2
import gapi.signin2.Signin2

@JsName("gapi")
external val gapi: Gapi

external interface Gapi {
    val auth2: Auth2
    val signin2: Signin2
    fun load(api: String, callback: () -> Unit)
}