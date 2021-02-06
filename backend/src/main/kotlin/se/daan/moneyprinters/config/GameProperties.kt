package se.daan.moneyprinters.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConfigurationProperties("game")
@ConstructorBinding
data class GameProperties(
        val configFile: String
)