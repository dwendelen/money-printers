package se.daan.moneyprinters.config;

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConfigurationProperties("security")
@ConstructorBinding
data class SecurityProperties(
        val googleClientId: String
)
