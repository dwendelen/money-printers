package gapi

import gapi.auth2.Auth2
import gapi.signin2.Signin2
import observed.Publisher
import observed.create
import kotlin.browser.window

@JsName("gapi")
external val gapi: Gapi

external interface Gapi {
    val auth2: Auth2
    val signin2: Signin2
    fun load(api: String, callback: () -> Unit)
}