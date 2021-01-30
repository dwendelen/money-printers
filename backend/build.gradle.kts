import org.jetbrains.kotlin.gradle.targets.js.webpack.KotlinWebpack

buildscript {
    repositories {
        jcenter()
    }
}

plugins {
    kotlin("jvm") version "1.3.72"
}

repositories {
    jcenter()
    mavenCentral()
    maven("https://repo.spring.io/plugins-release/")
}

dependencies {
    implementation(kotlin("stdlib-jdk8"))
    //implementation("org.springframework:spring-webflux:5.2.7.RELEASE")
    //implementation("org.springframework:spring-context:5.2.7.RELEASE")
    implementation("io.projectreactor.kotlin:reactor-kotlin-extensions:1.0.0.RELEASE")
    implementation("io.projectreactor.netty:reactor-netty:0.9.8.RELEASE")


    implementation("ch.qos.logback:logback-classic:1.2.3")
    //implementation("com.fasterxml.jackson.core:jackson-annotations:2.2.1")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.11.+")

    testImplementation(kotlin("test"))
}