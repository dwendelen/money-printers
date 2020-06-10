package se.daan.moneyprinters

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import io.netty.buffer.ByteBuf
import io.netty.buffer.Unpooled
import org.slf4j.LoggerFactory
import reactor.core.publisher.Mono
import reactor.core.scheduler.Schedulers
import reactor.kotlin.core.publisher.toMono
import reactor.netty.http.server.HttpServer
import reactor.netty.http.server.HttpServerResponse
import se.daan.moneyprinters.config.Config
import java.io.FileInputStream
import java.time.Duration
import java.util.*

fun main(args: Array<String>) {
    val logger = LoggerFactory.getLogger("Main")
    val objectMapper = ObjectMapper()
    objectMapper.registerKotlinModule()
    val config = objectMapper.readValue<Config>(FileInputStream(args[0]))

    HttpServer.create()
        .port(config.port)
        .route { routes ->
            routes
                .get("/") { _, res ->
                    respondWithResource("/static/index.html", res)
                }
                .get("/static/.*") { req, res ->
                    val path = req.path()
                    respondWithResource(path, res)
                }
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

private fun respondWithResource(
    path: String,
    res: HttpServerResponse
): Mono<Void>? {
    return readResource(path)
        .flatMap {
            if (it.isPresent) {
                res.send(it.get().toMono()).toMono()
            } else {
                res.sendNotFound()
            }
        }
}

private fun readResource(path: String): Mono<Optional<ByteBuf>> {
    return Mono.defer {
        val fixedPath =
            if (path.startsWith("/"))
                path
            else
                "/$path"
        val resource = object {}.javaClass.getResource(fixedPath)
        val buf = Optional.ofNullable(resource)
            .map {
                val data = it.readBytes()
                Unpooled.wrappedBuffer(data)
            }
        Mono.just(buf)
    }.subscribeOn(Schedulers.boundedElastic())
}