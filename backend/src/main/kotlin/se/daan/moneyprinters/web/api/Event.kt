package se.daan.moneyprinters.web.api

sealed class Event

data class GameCreated(
    val name: String
): Event()