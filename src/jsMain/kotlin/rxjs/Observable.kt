@file:JsModule("rxjs")
@file:JsNonModule
package rxjs

external fun <T> of(vararg item: T): Observable<T>
external fun throwError(error: dynamic): Observable<Nothing>

//there are many many forms of combineLatest
external fun <A, B, R> combineLatest(a: Observable<A>, b: Observable<B>, fn: (A, B) -> R): Observable<R>

open external class Observable<out T>: Subscribable<T> {
    //constructor(subscribe: (Subscriber<T>) -> Unsubscribable)
    //constructor(subscribe: (Subscriber<T>) -> (() -> Unit))
    constructor(subscribe: (Subscriber<T>) -> Unit)
    override fun subscribe(next: (value: T) -> Unit): Subscription
    override fun subscribe(next: ((value: T) -> Unit)?, error: (err: dynamic) -> Unit): Subscription
    override fun subscribe(next: ((value: T) -> Unit)?, error: ((err: dynamic) -> Unit)?, complete: () -> Unit): Subscription
    override fun subscribe(): Unsubscribable
    override fun subscribe(observer: PartialObserver<T>): Unsubscribable

    fun pipe(): Observable<T>
    fun <A> pipe(op1: OperatorFunction<T, A>): Observable<A>
    // incomplete
}

external interface Subscribable<out T> {
    fun subscribe(): Unsubscribable
    fun subscribe(next: (value: T) -> Unit): Subscription
    fun subscribe(next: ((value: T) -> Unit)?, error: (err: dynamic) -> Unit): Subscription
    fun subscribe(next: ((value: T) -> Unit)?, error: ((err: dynamic) -> Unit)?, complete: () -> Unit): Subscription
    fun subscribe(observer: PartialObserver<T>): Unsubscribable
}

external interface PartialObserver<in T>
external interface NextObserver<T> : PartialObserver<T> {
    fun next(value: T)
}
external interface ErrorObserver<T> : PartialObserver<T> {
    fun error(err: dynamic)
}
external interface CompletionObserver<T> : PartialObserver<T> {
    fun complete()
}
external class Subscriber<T>: Subscription, Observer<T> {
    override fun next(value: T)
    override fun error(err: dynamic)
    override fun complete()
    //incomplete
}

external interface Observer<in T> {
    fun next(value: T)
    fun error(err: dynamic)
    fun complete()
    // incomplete
}

open external class Subscription: SubscriptionLike {
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

external interface UnaryFunction<in T, out R> {
    //incomplete
}
external interface OperatorFunction<in T, out R> : UnaryFunction<Observable<T>, Observable<R>> {
    //incomplete (only invoke from parent)
}
external interface MonoTypeOperatorFunction<T> : OperatorFunction<T, T> {
    // incomplete (only invoke from parent)
}

open external class Subject<T> : Observable<T> , SubscriptionLike {
    override val closed: Boolean
    override fun unsubscribe()
    fun next()
    fun next(value: T)
    fun error(err: dynamic)
    fun complete()
    //incomplete
}

external class BehaviorSubject<T>(value: T): Subject<T> {
    //incomplete
}