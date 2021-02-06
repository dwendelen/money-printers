package se.daan.moneyprinters

class Game(
        val id: String,
        val players: MutableMap<String, Player>,
        val gameMaster: Player
) {
}

data class Player(
        val id: String,
        val name: String
)