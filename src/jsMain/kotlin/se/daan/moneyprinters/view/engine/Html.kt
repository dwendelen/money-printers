package se.daan.moneyprinters.view.engine

import observed.Publisher
import observed.Subscriber
import observed.create
import org.w3c.dom.HTMLButtonElement
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
            console.error(t)
            //TODO("Not yet implemented")
        }

        override fun onComplete() {
            //TODO("Not yet implemented")
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
fun click(onClick: () -> Unit): (HTMLElement) -> Unit {
    return { e ->
        e.onclick = { onClick() }
    }
}
/*
 * Can only be used once per element
 */
fun click(onClick: Subscriber<Any>): (HTMLElement) -> Unit {
    return { e ->
        e.onclick = { onClick.onNext("") }
    }
}

fun div(mods: Iterable<(HTMLElement) -> Unit>, children: Any): HTMLDivElement {
    val div = document.createElement("div") as HTMLDivElement
    mods.forEach { it(div) }
    addChildren(div, children)
    return div
}

fun button(mods: Iterable<(HTMLElement) -> Unit>, text: String): HTMLButtonElement {
    val button = document.createElement("button") as HTMLButtonElement
    mods.forEach { it(button) }
    button.textContent = text
    return button
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
                    console.error(t)
                    //TODO("Not yet implemented")
                }

                override fun onComplete() {
                    //TODO("Not yet implemented")
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

class Element<I>(
    mods: Iterable<Attribute<I>>,
    children: Iterable<ChildElement<I, *>>,
    elem: HTMLElement
)

class ChildElement<I, O>(
    fn: (I) -> O
)

class Attribute<I>(
    fn: (I) -> String,
    value: String
)
