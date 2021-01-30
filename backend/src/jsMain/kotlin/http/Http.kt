package http

import org.w3c.dom.events.Event
import org.w3c.xhr.XMLHttpRequest
import kotlin.js.Promise

fun <T> get(url: String): Promise<T> {
    return Promise { res, rej ->
        val http = XMLHttpRequest()
        http.onreadystatechange = handleResponse(http, res, rej)
        http.open("GET", url, true)
        http.setRequestHeader("Accept", "application/json")
        http.send()
    }
}

fun <I, O> put(url: String, data: I): Promise<O> {
    return Promise { res, rej ->
        val http = XMLHttpRequest()
        http.onreadystatechange = handleResponse(http, res, rej)
        http.open("PUT", url, true)
        http.setRequestHeader("Content-Type", "application/json")
        http.setRequestHeader("Accept", "application/json")
        http.send(JSON.stringify(data))
    }
}

fun <I, O> post(url: String, data: I): Promise<O> {
    return Promise { res, rej ->
        val http = XMLHttpRequest()
        http.onreadystatechange = handleResponse(http, res, rej)
        http.open("POST", url, true)
        http.setRequestHeader("Content-Type", "application/json")
        http.setRequestHeader("Accept", "application/json")
        http.send(JSON.stringify(data))
    }
}

private fun <O> handleResponse(
    http: XMLHttpRequest,
    resolve: (O) -> Unit,
    reject: (Throwable) -> Unit
): (Event) -> Unit {
    return {
        if (http.readyState == 4.toShort()) {
            if (http.status < 400.toShort()) {
                val obj: O = JSON.parse(http.responseText)
                resolve(obj)
            } else {
                reject(Error("HTTP call failed: ${http.status}: ${http.responseText}"))
            }
        }
    }
}

