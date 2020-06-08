import org.jetbrains.kotlin.gradle.targets.js.webpack.KotlinWebpack

buildscript {
    repositories {
        jcenter()
    }
}

plugins {
    kotlin("multiplatform") version "1.3.72"
}

repositories {
    jcenter()
    mavenCentral()
}

kotlin {
    jvm()
    js {
        browser {
        }
    }
    sourceSets {
        commonMain {
            dependencies {
                implementation(kotlin("stdlib-common"))
            }
        }
        commonTest {
            dependencies {
                implementation(kotlin("test-common"))
                implementation(kotlin("test-annotations-common"))
            }
        }
        val jvmMain by getting {
            dependencies {
                implementation(kotlin("stdlib-jdk8"))
                implementation("ch.qos.logback:logback-classic:1.2.3")
            }
        }
        val jvmTest by getting {
            dependencies {
                implementation(kotlin("test"))
                implementation(kotlin("test-junit"))
            }
        }
        val jsMain by getting {
            dependencies {
                implementation(npm("rxjs"))
                implementation(kotlin("stdlib-js"))
            }
        }
        val jsTest by getting {
            dependencies {
                implementation(kotlin("test-js"))
            }
        }
    }
}

tasks.getByName<Jar>("jvmJar") {
    val webpackTask = tasks.getByName<KotlinWebpack>("jsBrowserDevelopmentWebpack")
    dependsOn(webpackTask)
    from(webpackTask.destinationDirectory!!) {
        into("/static")
    }
}
/*
jvmJar {
    dependsOn(jsBrowserProductionWebpack)
    from(new File(jsBrowserProductionWebpack.entry.name, jsBrowserProductionWebpack.outputPath))
}*/