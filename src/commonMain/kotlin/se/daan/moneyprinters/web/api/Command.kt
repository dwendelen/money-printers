package se.daan.moneyprinters.web.api

sealed class Command

data class CreateGame(
    val name: String
): Command()