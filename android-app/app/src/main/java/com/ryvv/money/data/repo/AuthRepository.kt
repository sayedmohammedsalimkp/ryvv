package com.ryvv.money.data.repo

import com.ryvv.money.BuildConfig
import com.ryvv.money.data.api.SupabaseAuthApi
import com.ryvv.money.data.auth.SessionStore
import com.ryvv.money.data.model.PasswordGrant
import com.ryvv.money.data.model.SignUpBody
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException

class AuthRepository(
    private val authApi: SupabaseAuthApi,
    private val sessionStore: SessionStore,
) {
    private val key get() = BuildConfig.SUPABASE_PUBLISHABLE_KEY
    private val bearer get() = "Bearer $key"
    private val errJson = Json { ignoreUnknownKeys = true }

    suspend fun login(email: String, password: String) {
        try {
            val res = authApi.login(
                apiKey = key,
                auth = bearer,
                grantType = "password",
                body = PasswordGrant(email.trim(), password),
            )
            val token = res.accessToken
            if (token.isNullOrBlank()) {
                error("Login failed — no access token. Confirm email in Supabase if needed.")
            }
            sessionStore.save(token, res.user?.email ?: email.trim())
        } catch (e: HttpException) {
            throw Exception(parseAuthError(e), e)
        }
    }

    suspend fun signup(email: String, password: String, fullName: String) {
        try {
            val res = authApi.signup(
                key,
                bearer,
                SignUpBody(
                    email = email.trim(),
                    password = password,
                    data = mapOf("full_name" to fullName.trim()),
                ),
            )
            if (res.accessToken.isNullOrBlank()) {
                error("Check email to confirm signup, then log in.")
            }
            sessionStore.save(res.accessToken!!, res.user?.email ?: email.trim())
        } catch (e: HttpException) {
            throw Exception(parseAuthError(e), e)
        }
    }

    suspend fun logout() = sessionStore.clear()

    suspend fun hasSession(): Boolean = !sessionStore.getToken().isNullOrBlank()

    private fun parseAuthError(e: HttpException): String {
        val raw = e.response()?.errorBody()?.string().orEmpty()
        if (raw.isNotBlank()) {
            runCatching {
                val obj = errJson.parseToJsonElement(raw).jsonObject
                val msg = obj["msg"]?.jsonPrimitive?.content
                    ?: obj["error_description"]?.jsonPrimitive?.content
                    ?: obj["error"]?.jsonPrimitive?.content
                    ?: obj["message"]?.jsonPrimitive?.content
                if (!msg.isNullOrBlank()) return msg
            }
            if (raw.length < 200) return raw
        }
        return when (e.code()) {
            400 -> "Wrong email/password, or email not confirmed"
            401 -> "Unauthorized — check Supabase key"
            422 -> "Invalid email or weak password"
            else -> "Login failed (HTTP ${e.code()})"
        }
    }
}
