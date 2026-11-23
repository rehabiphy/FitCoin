package com.rehabiphy.axiyo.invite

import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Reads the Google Play install referrer: the `referrer` query of the Play
 * Store link the app was installed from. Invite pages link to
 * play.google.com/...&referrer=invite_code%3DAXYIO-XXXX, so a friend who installs
 * from an invite gets the code filled in on the sign-up screen.
 *
 * Resolves the raw referrer string, or null when there is none (sideloaded
 * installs, Play Store not available, or any error). Never rejects.
 */
class InstallReferrerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AxyioInstallReferrer"

    @ReactMethod
    fun getReferrer(promise: Promise) {
        val settled = AtomicBoolean(false)
        fun settle(value: String?, client: InstallReferrerClient?) {
            if (settled.compareAndSet(false, true)) {
                promise.resolve(value)
                try {
                    client?.endConnection()
                } catch (_: Exception) {
                }
            }
        }

        val client = try {
            InstallReferrerClient.newBuilder(reactContext).build()
        } catch (_: Exception) {
            settle(null, null)
            return
        }
        try {
            client.startConnection(object : InstallReferrerStateListener {
                override fun onInstallReferrerSetupFinished(responseCode: Int) {
                    if (responseCode != InstallReferrerClient.InstallReferrerResponse.OK) {
                        settle(null, client)
                        return
                    }
                    val referrer = try {
                        client.installReferrer?.installReferrer
                    } catch (_: Exception) {
                        null
                    }
                    settle(referrer, client)
                }

                override fun onInstallReferrerServiceDisconnected() {
                    settle(null, client)
                }
            })
        } catch (_: Exception) {
            settle(null, client)
        }
    }
}
