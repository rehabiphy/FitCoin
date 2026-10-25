package com.fitcoin

import android.os.Bundle
import androidx.lifecycle.Lifecycle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * After a JS reload (Metro "r" / full refresh) React Native creates a new
   * ReactContext but, because this screen is already resumed, never gives it the
   * current activity. Native modules that open screens (e.g. Google Sign-In) then
   * fail with "Current activity is null". This hands the activity to every new context.
   */
  private val contextListener =
      object : ReactInstanceEventListener {
        override fun onReactContextInitialized(context: ReactContext) {
          runOnUiThread { attachToContext(context) }
        }
      }

  private fun attachToContext(context: ReactContext?) {
    if (context == null || isFinishing) return
    if (lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED) && context.currentActivity == null) {
      context.onHostResume(this)
    }
  }

  /**
   * Pass null so Android doesn't try to restore react-native-screens fragments
   * after the app is killed in the background (otherwise it crashes on resume).
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    reactHost?.addReactInstanceEventListener(contextListener)
  }

  override fun onResume() {
    super.onResume()
    attachToContext(reactHost?.currentReactContext)
  }

  override fun onDestroy() {
    reactHost?.removeReactInstanceEventListener(contextListener)
    super.onDestroy()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Fitcoin"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
