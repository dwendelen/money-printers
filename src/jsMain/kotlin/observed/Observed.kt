package observed

import kotlin.js.Promise

interface Subscriber<in T> {
    fun onNext(t: T)
}

interface Publisher<out T> {
    fun subscribe(subscriber: Subscriber<T>)

    fun <O> map(fn: (T) -> O): Publisher<O> {
        return MapPublisher(this, fn)
    }

    fun <O> flatMap(fn: (T) -> Publisher<O>): Publisher<O> {
        return FlatMapPublisher(this, fn)
    }

    /**
     * !!! Subscribes immediately
     */
    fun cache(): Publisher<T> {
        return DefaultCachedPublisher(this)
    }

    fun distinct(): Publisher<T> {
        return DistinctPublisher(this)
    }
}

interface Subject<T>: Publisher<T>, Subscriber<T>


private class MapPublisher<I, out O>(
    private val source: Publisher<I>,
    private val fn: (I) -> O
) : Publisher<O> {
    override fun subscribe(subscriber: Subscriber<O>) {
        source.subscribe(object : Subscriber<I> {
            override fun onNext(t: I) {
                subscriber.onNext(fn(t))
            }
        })
    }
}

private class FlatMapPublisher<T, O>(
    private val source: Publisher<T>,
    private val fn: (T) -> Publisher<O>
) : Publisher<O> {
    override fun subscribe(subscriber: Subscriber<O>) {
        source.subscribe(object : Subscriber<T> {
            override fun onNext(t: T) {
                val obs = fn(t)
                obs.subscribe(object : Subscriber<O> {
                    override fun onNext(t: O) {
                        subscriber.onNext(t)
                    }
                })
            }
        })
    }
}

private class DefaultCachedPublisher<T>(
    source: Publisher<T>
) : Publisher<T> {
    private var hasResult = false
    private var lastValue: T? = null

    private val subscribers = ArrayList<Subscriber<T>>()

    init {
        source.subscribe(object : Subscriber<T> {
            override fun onNext(t: T) {
                if (!hasResult) {
                    hasResult = true
                }
                lastValue = t
                subscribers.forEach {
                    onNext(it, t)
                }
            }
        })
    }

    override fun subscribe(subscriber: Subscriber<T>) {
        subscribers.add(subscriber)
        if (hasResult) {
            onNext(subscriber, lastValue!!)
        }
    }

    private fun onNext(subscriber: Subscriber<T>, t: T) {
        subscriber.onNext(t)
    }
}

private class DistinctPublisher<T>(
    private val source: Publisher<T>
): Publisher<T> {
    override fun subscribe(subscriber: Subscriber<T>) {
        source.subscribe(object : Subscriber<T> {
            var hasValue = false
            var lastValue : T? = null

            override fun onNext(t: T) {
                if(!hasValue) {
                    hasValue = true
                    lastValue = t
                    subscriber.onNext(t)
                } else {
                    if(t != lastValue) {
                        lastValue = t
                        subscriber.onNext(t)
                    }
                }
            }
        })
    }
}

fun <T> subject(): Subject<T> = DefaultSubject()

fun <T> create(fn: (Subscriber<T>) -> Unit): Publisher<T> {
    return object : Publisher<T> {
        override fun subscribe(subscriber: Subscriber<T>) {
            fn(subscriber)
        }
    }
}

fun <T> from(t: T): Publisher<T> {
    return object : Publisher<T> {
        override fun subscribe(subscriber: Subscriber<T>) {
            subscriber.onNext(t)
        }
    }
}

fun <T> from(factory: () -> T): Publisher<T> {
    return object : Publisher<T> {
        override fun subscribe(subscriber: Subscriber<T>) {
            val t = factory()
            subscriber.onNext(t)
        }
    }
}

fun <T> from(promise: Promise<T>): Publisher<T> {
    return object: Publisher<T> {
        override fun subscribe(subscriber: Subscriber<T>) {
            promise
                .then {
                    subscriber.onNext(it)
                }
        }
    }
}

fun <A, B, C> combineLatest(
    o1: Publisher<A>,
    o2: Publisher<B>,
    fn: (A, B) -> C
): Publisher<C> {
    return object : Publisher<C> {
        override fun subscribe(subscriber: Subscriber<C>) {
            var has1 = false
            var last1: A? = null
            var has2 = false
            var last2: B? = null

            fun trigger() {
                if(has1 && has2) {
                    subscriber.onNext(fn(last1!!, last2!!))
                }
            }

            o1.subscribe(object : Subscriber<A> {
                override fun onNext(t: A) {
                    if(!has1) {
                        has1 = true
                    }
                    last1 = t
                    trigger()
                }
            })
            o2.subscribe(object: Subscriber<B> {
                override fun onNext(t: B) {
                    if(!has2) {
                        has2 = true
                    }
                    last2 = t
                    trigger()
                }
            })
        }
    }
}

fun <O> merge(vararg ps: Publisher<O>): Publisher<O> {
    return object: Publisher<O> {
        override fun subscribe(subscriber: Subscriber<O>) {
            for (p in ps) {
                p.subscribe(object: Subscriber<O> {
                    override fun onNext(t: O) {
                        subscriber.onNext(t)
                    }
                })
            }
        }
    }
}

private class DefaultSubject<T> : Subject<T> {
    private val subscribers = ArrayList<Subscriber<T>>()

    override fun subscribe(subscriber: Subscriber<T>) {
        subscribers.add(subscriber)
    }

    override fun onNext(t: T) {
        subscribers.forEach {
            onNext(it, t)
        }
    }

    private fun onNext(subscriber: Subscriber<T>, t: T) {
        subscriber.onNext(t)
    }
}