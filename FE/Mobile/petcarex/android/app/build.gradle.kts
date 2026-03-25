import java.io.ByteArrayOutputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // START: FlutterFire Configuration
    id("com.google.gms.google-services")
    // END: FlutterFire Configuration
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.petcarex"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.example.petcarex"
        minSdk = flutter.minSdkVersion 
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("sharedDebug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("sharedDebug")
        }
        release {
            signingConfig = signingConfigs.getByName("sharedDebug")
        }
    }
}

flutter {
    source = "../.."
}

tasks.register("autoAdbReverseDebug") {
    group = "petcarex"
    description = "Auto-run adb reverse tcp:3000 tcp:3000 for connected Android devices in debug builds"

    doLast {
        val osName = System.getProperty("os.name").orEmpty().lowercase()
        val adbFileName = if (osName.contains("win")) "adb.exe" else "adb"

        fun adbFromSdkDir(sdkDir: String?): String? {
            if (sdkDir.isNullOrBlank()) return null
            val adbPath = file("$sdkDir/platform-tools/$adbFileName")
            return adbPath.takeIf { it.exists() }?.absolutePath
        }

        val localProperties = rootProject.file("local.properties")
        val properties = Properties()
        val sdkFromLocalProperties = if (localProperties.exists()) {
            localProperties.inputStream().use(properties::load)
            properties.getProperty("sdk.dir")
        } else {
            null
        }

        val adbExecutable = listOf(
            adbFromSdkDir(System.getenv("ANDROID_SDK_ROOT")),
            adbFromSdkDir(System.getenv("ANDROID_HOME")),
            adbFromSdkDir(sdkFromLocalProperties),
            adbFileName,
        ).firstOrNull { !it.isNullOrBlank() }

        if (adbExecutable == null) {
            logger.lifecycle("[petcarex] adb not found, skip auto reverse")
            return@doLast
        }

        val devicesOutput = ByteArrayOutputStream()
        val devicesExitCode = runCatching {
            exec {
                isIgnoreExitValue = true
                commandLine(adbExecutable, "devices")
                standardOutput = devicesOutput
                errorOutput = devicesOutput
            }.exitValue
        }.getOrElse {
            logger.lifecycle("[petcarex] cannot execute adb devices, skip auto reverse: ${it.message}")
            return@doLast
        }

        if (devicesExitCode != 0) {
            logger.lifecycle("[petcarex] adb devices failed (exit $devicesExitCode), skip auto reverse")
            return@doLast
        }

        val deviceSerials = devicesOutput.toString()
            .lineSequence()
            .drop(1)
            .map { it.trim() }
            .filter { it.endsWith("\tdevice") }
            .map { it.substringBefore('\t') }
            .filter { it.isNotBlank() }
            .toList()

        if (deviceSerials.isEmpty()) {
            logger.lifecycle("[petcarex] no connected Android devices, skip auto reverse")
            return@doLast
        }

        deviceSerials.forEach { serial ->
            val reverseOutput = ByteArrayOutputStream()
            val reverseExitCode = runCatching {
                exec {
                    isIgnoreExitValue = true
                    commandLine(adbExecutable, "-s", serial, "reverse", "tcp:3000", "tcp:3000")
                    standardOutput = reverseOutput
                    errorOutput = reverseOutput
                }.exitValue
            }.getOrElse {
                logger.lifecycle("[petcarex] adb reverse failed for $serial: ${it.message}")
                return@forEach
            }

            if (reverseExitCode == 0) {
                logger.lifecycle("[petcarex] adb reverse ready for device $serial (tcp:3000)")
            } else {
                val message = reverseOutput.toString().trim()
                logger.lifecycle(
                    "[petcarex] adb reverse failed for device $serial (exit $reverseExitCode)${if (message.isNotEmpty()) ": $message" else ""}",
                )
            }
        }
    }
}

tasks.matching { it.name == "preDebugBuild" }.configureEach {
    dependsOn("autoAdbReverseDebug")
}
