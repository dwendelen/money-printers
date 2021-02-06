package se.daan.moneyprinters

import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder
import org.springframework.scheduling.annotation.EnableScheduling
import java.time.Clock
import java.time.ZoneId

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan
class MoneyPrinters {
    @Bean
    fun clock(@Value("\${clock.zone}") zone: String): Clock =
            Clock.system(ZoneId.of(zone))

    @Bean
    fun objectMapperBuilder(): Jackson2ObjectMapperBuilder =
            Jackson2ObjectMapperBuilder()
                    .modulesToInstall(KotlinModule())
}

fun main(args: Array<String>) {
    runApplication<MoneyPrinters>(*args)
}
