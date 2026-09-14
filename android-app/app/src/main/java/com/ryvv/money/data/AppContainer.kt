package com.ryvv.money.data

import android.content.Context
import com.ryvv.money.data.api.ApiFactory
import com.ryvv.money.data.api.RyvvApi
import com.ryvv.money.data.api.SupabaseAuthApi
import com.ryvv.money.data.auth.SessionStore
import com.ryvv.money.data.repo.AuthRepository
import com.ryvv.money.data.repo.MoneyRepository

class AppContainer(context: Context) {
    val sessionStore = SessionStore(context.applicationContext)
    private val clients = ApiFactory(sessionStore)
    val authApi: SupabaseAuthApi = clients.authApi
    val ryvvApi: RyvvApi = clients.ryvvApi
    val authRepository = AuthRepository(authApi, sessionStore)
    val moneyRepository = MoneyRepository(ryvvApi)
}
