package se.daan.moneyprinters.web.config

import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import se.daan.moneyprinters.model.config.SecurityProperties
import se.daan.moneyprinters.web.config.api.Config

@RestController
@RequestMapping("/api/config")
class ConfigController(
        private val securityProperties: SecurityProperties,
) {
    @GetMapping("/config", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun getConfig(): Config {
        return Config(securityProperties.googleClientId)
    }
}