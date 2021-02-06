package se.daan.moneyprinters

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import io.netty.buffer.Unpooled
import org.slf4j.LoggerFactory
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.netty.http.server.HttpServer
import se.daan.moneyprinters.config.Config
import java.io.FileInputStream
import java.time.Duration

fun main(args: Array<String>) {
    val logger = LoggerFactory.getLogger("Main")
    val objectMapper = ObjectMapper()
    objectMapper.registerKotlinModule()
    val config = objectMapper.readValue<Config>(FileInputStream(args[0]))

//    val indexHtml = Unpooled.wrappedBuffer(loadIndexPage(config.security.googleClientId))
//    val javascript = Unpooled.wrappedBuffer(load("/static/money-printers.js"))

    HttpServer.create()
        .port(config.port)
        .route { routes ->
            routes
//                .get("/") { _, res ->
//                    res.send(Flux.just(indexHtml.retain()))
//                }
                .get("/config") {_, res ->
                    val config1 = se.daan.moneyprinters.web.api.Config(config.security.googleClientId)
                    val json = objectMapper.writeValueAsBytes(config1)
                    res.send(Flux.just(Unpooled.wrappedBuffer(json)))
                }
//                .get("/money-printers.js") { _, res ->
//                    res.send(Flux.just(javascript.retain()))
//                }
                .put("/games/{id}") { req, res ->
                    res.status(200)
                    res.send()
                }
                .ws("/games/{id}/players/{pid}") { wsi, wso ->
                    Mono.empty()
                }
        }
        .bindUntilJavaShutdown(Duration.ofSeconds(30)) {
            logger.info("Started on port ${config.port}")
        }
}

private val resourceLoader = object {}.javaClass

private fun loadIndexPage(googleClientId: String): ByteArray {
    return String(load("/static/index.html"))
        .replace("\${googleClientId}", googleClientId)
        .toByteArray()
}

private fun load(asset: String): ByteArray {
    return resourceLoader.getResource(asset).readBytes()
}