package observed

import kotlin.js.Promise

interface Subscriber<in T> {
    fun onNext(t: T)
    fun onError(t: Throwable)
    fun onComplete()
}

interface Publisher<out T> {
    fun subscribe(subscriber: Subscriber<T>)

    fun <O> map(fn: (T) -> O): Publisher<O> {
        return MapPublisher(this, fn).clean()
    }

    fun <O> flatMap(fn: (T) -> Publisher<O>): Publisher<O> {
        return FlatMapPublisher(this, fn).clean()
    }

    /**
     * !!! Subscribes immediately
     */
    fun cache(): Publisher<T> {
        return DefaultCachedPublisher(this)
    }

    fun distinct(): Publisher<T> {
        return DistinctPublisher(this).clean()
    }
}

interface Subject<T>: Publisher<T>, Subscriber<T>

private interface UncleanPublisher<out T> {
    fun subscribe(subscriber: Subscriber<T>)

    fun clean(): Publisher<T> {
        return CleaningPublisher(this)
    }
}

private class CleaningPublisher<T>(
    private val source: UncleanPublisher<T>
) : Publisher<T> {
    override fun subscribe(subscriber: Subscriber<T>) {
        var open = true
        source.subscribe(object : Subscriber<T> {
            override fun onNext(t: T) {
                if (open) {
                    try {
                        subscriber.onNext(t)
                    } catch (e: Throwable) {
                        this.onError(e)
                    }
                }
            }

            override fun onError(t: Throwable) {
                if (open) {
                    open = false
                    try {
                        subscriber.onError(t)
                    } catch (t: Throwable) {
                        // Eat
                    }
                }
            }

            override fun onComplete() {
                if (open) {
                    open = false
                    try {
                        subscriber.onComplete()
                    } catch (t: Throwable) {
                        //Eat
                    }
                }
            }
        })
    }
}

private class MapPublisher<I, out O>(
    private val source: Publisher<I>,
    private val fn: (I) -> O
) : UncleanPublisher<O> {
    override fun subscribe(subscriber: Subscriber<O>) {
        source.subscribe(object : Subscriber<I> {
            override fun onNext(t: I) {
                subscriber.onNext(fn(t))
            }

            override fun onError(t: Throwable) {
                subscriber.onError(t)
            }

            override fun onComplete() {
                subscriber.onComplete()
            }
        })
    }
}

private class FlatMapPublisher<T, O>(
    private val source: Publisher<T>,
    private val fn: (T) -> Publisher<O>
) : UncleanPublisher<O> {
    override fun subscribe(subscriber: Subscriber<O>) {
        source.subscribe(object : Subscriber<T> {
            var nbOpen = 1

            override fun onNext(t: T) {
                nbOpen++
                val obs = fn(t)
                obs.subscribe(object : Subscriber<O> {
                    override fun onNext(t: O) {
                        subscriber.onNext(t)
                    }

                    override fun onError(t: Throwable) {
                        nbOpen--
                        subscriber.onError(t)
                    }

                    override fun onComplete() {
                        nbOpen--
                        checkComplete()
                    }
                })
            }

            override fun onError(t: Throwable) {
                nbOpen--
                subscriber.onError(t)
            }

            override fun onComplete() {
                nbOpen--
                checkComplete()
            }

            private fun checkComplete() {
                if (nbOpen == 0) {
                    subscriber.onComplete()
                }
            }
        })
    }
}

private class DefaultCachedPublisher<T>(
    source: Publisher<T>
) : Publisher<T> {
    private var hasResult = false
    private var lastValue: T? = null
    private var lastException: Throwable? = null
    private var complete = false

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

            override fun onError(t: Throwable) {
                lastException = t
                subscribers.forEach {
                    onError(it, t)
                }
                subscribers.clear()
            }

            override fun onComplete() {
                complete = true
                subscribers.forEach {
                    onComplete(it)
                }
                subscribers.clear()
            }
        })
    }

    override fun subscribe(subscriber: Subscriber<T>) {
        val le = lastException
        if (le != null) {
            onError(subscriber, le)
        } else if (complete) {
            onComplete(subscriber)
        } else {
            subscribers.add(subscriber)
            if (hasResult) {
                onNext(subscriber, lastValue!!)
            }
        }
    }

    private fun onNext(subscriber: Subscriber<T>, t: T) {
        try {
            subscriber.onNext(t)
        } catch (t: Throwable) {
            onError(subscriber, t)
        }
    }

    private fun onError(subscriber: Subscriber<T>, t: Throwable) {
        try {
            subscriber.onError(t)
        } catch (t: Throwable) {
            // Eat
        }
    }

    private fun onComplete(subscriber: Subscriber<T>) {
        try {
            subscriber.onComplete()
        } catch (t: Throwable) {
            // Eat
        }
    }
}

private class DistinctPublisher<T>(
    private val source: Publisher<T>
): UncleanPublisher<T> {
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

            override fun onError(t: Throwable) {
                subscriber.onError(t)
            }

            override fun onComplete() {
                subscriber.onComplete()
            }
        })
    }
}

fun <T> subject(): Subject<T> = DefaultSubject()

fun <T> create(fn: (Subscriber<T>) -> Unit): Publisher<T> {
    return object : UncleanPublisher<T> {
        override fun subscribe(subscriber: Subscriber<T>) {
            fn(subscriber)
        }
    }.clean()
}

fun <T> from(t: T): Publisher<T> {
    return object : UncleanPublisher<T> {
        override fun subscribe(subscriber: Subscriber<T>) {
            subscriber.onNext(t)
            subscriber.onComplete()
        }
    }.clean()
}

fun <T> from(factory: () -> T): Publisher<T> {
    return object : UncleanPublisher<T> {
        override fun subscribe(subscriber: Subscriber<T>) {
            val t = factory()
            subscriber.onNext(t)
            subscriber.onComplete()
        }
    }.clean()
}

fun <T> from(promise: Promise<T>): Publisher<T> {
    return object : UncleanPublisher<T> {
        override fun subscribe(subscriber: Subscriber<T>) {
            promise
                .then {
                    subscriber.onNext(it)
                    subscriber.onComplete()
                }
                .catch {
                    subscriber.onError(it)
                }
        }
    }.clean()
}

fun <A, B, C> combineLatest(
    o1: Publisher<A>,
    o2: Publisher<B>,
    fn: (A, B) -> C
): Publisher<C> {
    return object : UncleanPublisher<C> {
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

                override fun onError(t: Throwable) {
                    subscriber.onError(t)
                }

                override fun onComplete() {
                    subscriber.onComplete()
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

                override fun onError(t: Throwable) {
                    subscriber.onError(t)
                }

                override fun onComplete() {
                    subscriber.onComplete()
                }
            })
        }
    }.clean()
}


private class DefaultSubject<T> : Subject<T> {
    private var lastException: Throwable? = null
    private var complete = false

    private val subscribers = ArrayList<Subscriber<T>>()

    override fun subscribe(subscriber: Subscriber<T>) {
        val le = lastException
        if (le != null) {
            onError(subscriber, le)
        } else if (complete) {
            onComplete(subscriber)
        } else {
            subscribers.add(subscriber)
        }
    }

    override fun onNext(t: T) {
        subscribers.forEach {
            onNext(it, t)
        }
    }

    override fun onError(t: Throwable) {
        lastException = t
        subscribers.forEach {
            onError(it, t)
        }
    }

    override fun onComplete() {
        complete = true
        subscribers.forEach {
            onComplete(it)
        }
    }

    private fun onNext(subscriber: Subscriber<T>, t: T) {
        try {
            subscriber.onNext(t)
        } catch (t: Throwable) {
            onError(subscriber, t)
        }
    }

    private fun onError(subscriber: Subscriber<T>, t: Throwable) {
        try {
            subscriber.onError(t)
        } catch (t: Throwable) {
            // Eat
        }
    }

    private fun onComplete(subscriber: Subscriber<T>) {
        try {
            subscriber.onComplete()
        } catch (t: Throwable) {
            // Eat
        }
    }
}