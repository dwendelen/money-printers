package gapi.auth2

import kotlin.js.Promise

external class GoogleAuth {
    val isSignedIn: Thing<Boolean>
    val currentUser: Thing<GoogleUser>
    fun signIn(options: dynamic = definedExternally): Promise<GoogleUser>
    fun signOut(): Promise<dynamic> // Don't know type
    fun disconnect()
    fun grantOfflineAccess(options: dynamic): Promise<dynamic> // Don't know type
    fun attachClickHandler(container: dynamic, options: dynamic, onsuccess: () -> Unit, onfailure: () -> Unit)
}

interface Thing<T> {
    fun get(): T
    @JsName("listen")
    fun listen(callback: (T) -> Unit)
}

external class GoogleUser {
    fun getId(): String
    fun isSignedIn(): Boolean
    fun getHostedDomain(): String
    fun getGrantedScopes(): String
    fun getBasicProfile(): BasicProfile
    fun getAuthResponse(includeAuthorizationData: Boolean = definedExternally): AuthResponse
    fun reloadAuthResponse(): Promise<AuthResponse>
    fun hasGrantedScopes(scopes: String): Boolean
    fun grant(options: dynamic)
    fun grantOfflineAccess(options: dynamic)
    fun disconnect()
}

external class BasicProfile {
    fun getId(): String
    fun getName(): String
    fun getGivenName(): String
    fun getFamilyName(): String
    fun getImageUrl(): String
    fun getEmail(): String
}

external class AuthResponse {
    val access_token: String
    val id_token: String
    val scope: String
    val expires_in: Number
    val first_issued_at: Number
    val expires_at: Number
}