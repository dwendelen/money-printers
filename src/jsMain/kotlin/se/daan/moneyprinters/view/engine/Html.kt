package se.daan.moneyprinters.view.engine


import org.w3c.dom.HTMLButtonElement
import org.w3c.dom.HTMLDivElement
import org.w3c.dom.HTMLElement
import org.w3c.dom.Node
import kotlin.browser.document
import kotlin.browser.window

fun bla() {
    window.onhashchange = {
        window.location.hash
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

