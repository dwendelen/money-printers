package se.daan.moneyprinters

import se.daan.moneyprinters.security.Security
import se.daan.moneyprinters.security.SecurityFactory

class Application(
    private val securityFactory: SecurityFactory
) {
    var state: AppState = Loading

    fun start() {
        securityFactory.create()
            .then {
                state = ApplicationLoaded(it)
            }
    }
}

sealed class AppState
object Loading: AppState()
data class ApplicationLoaded(
    val security: Security
): AppState()