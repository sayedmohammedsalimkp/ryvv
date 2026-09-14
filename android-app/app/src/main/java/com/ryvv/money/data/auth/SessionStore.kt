package com.ryvv.money.data.auth

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore("ryvv_session")

class SessionStore(private val context: Context) {
    private val tokenKey = stringPreferencesKey("access_token")
    private val emailKey = stringPreferencesKey("email")

    val tokenFlow: Flow<String?> = context.dataStore.data.map { it[tokenKey] }

    suspend fun getToken(): String? = context.dataStore.data.first()[tokenKey]

    suspend fun getEmail(): String? = context.dataStore.data.first()[emailKey]

    suspend fun save(token: String, email: String?) {
        context.dataStore.edit {
            it[tokenKey] = token
            if (email != null) it[emailKey] = email
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
