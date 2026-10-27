package com.fitcoin

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.fitcoin.steps.StepCounterPackage
import com.fitcoin.steps.StepEngine

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(StepCounterPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Any time the process starts (app, service, alarm or boot), get back onto the step sensor
    StepEngine.start(this)
    loadReactNative(this)
  }
}
