@file:JsModule("rxjs")
@file:JsNonModule
package rxjs

external fun <T> of(vararg item: T): Observable<T>
external fun throwError(error: Any): Observable<Nothing>

external class Observable<out T>: Subscribable<T> {
    override fun subscribe(next: (value: T) -> Unit): Subscription
    override fun subscribe(next: ((value: T) -> Unit)?, error: (err: Any) -> Unit): Subscription
    override fun subscribe(next: ((value: T) -> Unit)?, error: ((err: Any) -> Unit)?, complete: () -> Unit): Subscription
    override fun subscribe(): Unsubscribable
    override fun subscribe(observer: PartialObserver<T>): Unsubscribable
    // incomplete
}

external interface Subscribable<out T> {
    fun subscribe(): Unsubscribable
    fun subscribe(next: (value: T) -> Unit): Subscription
    fun subscribe(next: ((value: T) -> Unit)?, error: (err: Any) -> Unit): Subscription
    fun subscribe(next: ((value: T) -> Unit)?, error: ((err: Any) -> Unit)?, complete: () -> Unit): Subscription
    fun subscribe(observer: PartialObserver<T>): Unsubscribable
}

external interface PartialObserver<in T>
external interface NextObserver<T> : PartialObserver<T> {
    fun next(value: T)
}
external interface ErrorObserver<T> : PartialObserver<T> {
    fun error(err: Any)
}
external interface CompletionObserver<T> : PartialObserver<T> {
    fun complete()
}
external class Subscription: SubscriptionLike {
    constructor()
    constructor(unsubscribe: () -> Unit)
    companion object {
        val EMPTY: Subscription
    }
    override val closed: Boolean
    override fun unsubscribe()
    // incomplete
}
external interface SubscriptionLike : Unsubscribable {
    val closed: Boolean
}
external interface Unsubscribable {
    fun unsubscribe()
}