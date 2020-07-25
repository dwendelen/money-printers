package se.daan.moneyprinters.view.engine

import org.w3c.dom.HTMLDivElement
import org.w3c.dom.HTMLElement
import org.w3c.dom.Node
import rxjs.Observable
import rxjs.Subject
import rxjs.operators.share
import rxjs.operators.shareReplay
import kotlin.browser.document
import kotlin.browser.window
import kotlin.dom.clear

private val hashObservable = Observable<String>{ sub ->
    sub.next(window.location.hash)
    window.onhashchange = {
        sub.next(window.location.hash)
    }
}.pipe(shareReplay(1))

fun hash(): Observable<String> {
    return hashObservable
}

fun changeHash(newhash: Observable<String>) {
    newhash.subscribe {
        window.location.hash = it
    }
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

/*
 * Can only be used once per element
 */
fun click(observer: Subject<Nothing?>): (HTMLElement) -> Unit {
    return { e ->
        e.onclick = { observer.next(null) }
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
        is Observable<*> -> {
            children.subscribe {
                elem.clear()
                addChildren(elem, it!!)
            }
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