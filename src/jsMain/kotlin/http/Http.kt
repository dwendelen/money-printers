package http

import observed.Publisher
import observed.Subscriber
import observed.create
import org.w3c.dom.events.Event
import org.w3c.xhr.XMLHttpRequest

fun <T> get(url: String): Publisher<T> {
    return create { subscriber ->
        val http = XMLHttpRequest()
        http.onreadystatechange = handleResponse(http, subscriber)
        http.open("GET", url, true)
        http.setRequestHeader("Accept", "application/json")
        http.send()
    }
}

fun <I, O> put(url: String, data: I): Publisher<O> {
    return create { subscriber ->
        val http = XMLHttpRequest()
        http.onreadystatechange = handleResponse(http, subscriber)
        http.open("PUT", url, true)
        http.setRequestHeader("Content-Type", "application/json")
        http.setRequestHeader("Accept", "application/json")
        http.send(JSON.stringify(data))
    }
}

fun <I, O> post(url: String, data: I): Publisher<O> {
    return create { subscriber ->
        val http = XMLHttpRequest()
        http.onreadystatechange = handleResponse(http, subscriber)
        http.open("POST", url, true)
        http.setRequestHeader("Content-Type", "application/json")
        http.setRequestHeader("Accept", "application/json")
        http.send(JSON.stringify(data))
    }
}

private fun <O> handleResponse(
    http: XMLHttpRequest,
    subscriber: Subscriber<O>
): (Event) -> Unit {
    return {
        if (http.readyState == 4.toShort()) {
            if (http.status < 400.toShort()) {
                val obj: O = JSON.parse(http.responseText)
                subscriber.onNext(obj)
                subscriber.onComplete()
            } else {
                subscriber.onError(Error("HTTP call failed: ${http.status}: ${http.responseText}"))
            }
        }
    }
}

