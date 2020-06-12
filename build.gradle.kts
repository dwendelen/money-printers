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
    maven("https://repo.spring.io/plugins-release/")
}

kotlin {
    jvm {
        val main by compilations.getting {
            kotlinOptions {
                // Setup the Kotlin compiler options for the 'main' compilation:
                jvmTarget = "1.8"
            }
        }
    }
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
                //implementation("org.springframework:spring-webflux:5.2.7.RELEASE")
                //implementation("org.springframework:spring-context:5.2.7.RELEASE")
                implementation("io.projectreactor.kotlin:reactor-kotlin-extensions:1.0.0.RELEASE")
                implementation("io.projectreactor.netty:reactor-netty:0.9.8.RELEASE")


                implementation("ch.qos.logback:logback-classic:1.2.3")
                //implementation("com.fasterxml.jackson.core:jackson-annotations:2.2.1")
                implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.11.+")

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
                implementation(npm("uuid"))
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

tasks.getByName<ProcessResources>("jvmProcessResources") {
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