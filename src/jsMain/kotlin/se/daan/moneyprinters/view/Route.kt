package se.daan.moneyprinters.view

import se.daan.moneyprinters.security.MaybeSession
import se.daan.moneyprinters.security.NoSession
import se.daan.moneyprinters.security.Session


sealed class Route {
    abstract fun hash(): List<String>
}
data class Login(val goTo: List<String>): Route() {
    override fun hash() = listOf("login") + goTo
}
data class Games(val session: Session): Route() {
    override fun hash() = listOf("games")
}
data class Game(val id: String, val session: Session): Route() {
    override fun hash() = listOf("games") + id
}
object ErrorPage: Route() {
    override fun hash() = listOf("error")
}

fun route(session: MaybeSession, hash: String): Route {
    val withoutHash = if (hash.startsWith("#")) {
        hash.substring(1)
    } else {
        hash
    }
    val splitHash = withoutHash.split("/")

    return route(session, splitHash)
}

private fun route(
    session: MaybeSession,
    splitHash: List<String>
): Route {
    return when {
        splitHash.isEmpty() || splitHash[0] == "" -> {
            when(session) {
                is NoSession -> Login(emptyList())
                is Session -> Games(session)
            }
        }
        splitHash[0] == "login" -> {
            val goTo = splitHash.drop(1)
            when(session) {
                is NoSession -> Login(goTo)
                is Session -> route(session, goTo)
            }
        }
        splitHash[0] == "error" -> {
            ErrorPage
        }
        splitHash[0] == "games" && splitHash.size == 1 -> {
            when (session) {
                is Session -> Games(session)
                is NoSession -> Login(splitHash)
            }
        }
        splitHash[0] == "games" && splitHash.size == 2 -> {
            when (session) {
                is Session -> Game(splitHash[1], session)
                is NoSession -> Login(splitHash)
            }
        }
        else -> {
            ErrorPage
        }
    }
}