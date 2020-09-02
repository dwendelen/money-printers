package se.daan.moneyprinters.view.engine

import observed.Publisher
import observed.Subscriber
import observed.create
import org.w3c.dom.HTMLDivElement
import org.w3c.dom.HTMLElement
import org.w3c.dom.Node
import kotlin.browser.document
import kotlin.browser.window
import kotlin.dom.clear

private val hashObservable = create<String>{ sub ->
    sub.onNext(window.location.hash)
    window.onhashchange = {
        sub.onNext(window.location.hash)
    }
}.cache()

fun hash(): Publisher<String> {
    return hashObservable
}

fun changeHash(newhash: Publisher<String>) {
    newhash.subscribe(object : Subscriber<String>{
        override fun onNext(t: String) {
            window.location.hash = t
        }

        override fun onError(t: Throwable) {
            TODO("Not yet implemented")
        }

        override fun onComplete() {
            TODO("Not yet implemented")
        }
    })
}

fun render(children: Any) {
    addChildren(document.body!!, children)
}

fun id(id: String): (HTMLElement) -> Unit {
    return { e -> e.id = id }
}

fun clazz(className: String): (HTMLElement) -> Unit {
    return { e -> e.className = className }
}

fun data(key: String, value: String): (HTMLElement) -> Unit {
    return { e -> e.setAttribute("data-$key", value) }
}

/*
 * Can only be used once per element
 */
fun click(observer: Subscriber<Nothing?>): (HTMLElement) -> Unit {
    return { e ->
        e.onclick = { observer.onNext(null) }
    }
}

fun div(mods: Iterable<(HTMLElement) -> Unit>, children: Any): HTMLDivElement {
    val div = document.createElement("div") as HTMLDivElement
    mods.forEach { it(div) }
    addChildren(div, children)
    return div
}

private fun addChildren(elem: HTMLElement, children: Any) {
    when(children) {
        is Node -> {
            elem.appendChild(children)
        }
        is String -> {
            elem.textContent = children;
        }
        is Publisher<*> -> {
            children.subscribe(object: Subscriber<Any?> {
                override fun onNext(t: Any?) {
                        elem.clear()
                        addChildren(elem, t!!)
                }

                override fun onError(t: Throwable) {
                    TODO("Not yet implemented")
                }

                override fun onComplete() {
                    TODO("Not yet implemented")
                }
            })
        }
        is Iterable<*> -> {
            children.forEach {
                elem.appendChild(it as Node)
            }
        }
        else -> {
            throw RuntimeException("Child has bad type: " + children::class.simpleName)
        }
    }
}