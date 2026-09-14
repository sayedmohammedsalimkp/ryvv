package com.ryvv.money

import android.app.Application
import com.ryvv.money.data.AppContainer

class RyvvApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
