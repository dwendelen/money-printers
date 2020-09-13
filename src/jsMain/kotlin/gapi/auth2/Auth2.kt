package gapi.auth2

external interface Auth2 {
    fun init(params: dynamic): GoogleAuth
    fun getAuthInstance(): GoogleAuth
}