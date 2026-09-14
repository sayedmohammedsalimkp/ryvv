package com.ryvv.money.data.api

import com.ryvv.money.BuildConfig
import com.ryvv.money.data.auth.SessionStore
import com.ryvv.money.data.model.Account
import com.ryvv.money.data.model.AccountCreate
import com.ryvv.money.data.model.AuthTokenResponse
import com.ryvv.money.data.model.Contact
import com.ryvv.money.data.model.ContactCreate
import com.ryvv.money.data.model.Dashboard
import com.ryvv.money.data.model.OnHand
import com.ryvv.money.data.model.PasswordGrant
import com.ryvv.money.data.model.SignUpBody
import com.ryvv.money.data.model.TelegramLinkCode
import com.ryvv.money.data.model.TelegramLinkStatus
import com.ryvv.money.data.model.Transaction
import com.ryvv.money.data.model.TransactionCreate
import com.ryvv.money.data.model.User
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

interface SupabaseAuthApi {
    @POST("auth/v1/token")
    suspend fun login(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Query("grant_type") grantType: String = "password",
        @Body body: PasswordGrant,
    ): AuthTokenResponse

    @POST("auth/v1/signup")
    suspend fun signup(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Body body: SignUpBody,
    ): AuthTokenResponse
}

interface RyvvApi {
    @GET("auth/me")
    suspend fun me(): User

    @GET("dashboard/summary")
    suspend fun dashboard(): Dashboard

    @GET("contacts")
    suspend fun contacts(@Query("q") q: String? = null): List<Contact>

    @GET("contacts/{id}")
    suspend fun contact(@Path("id") id: String): Contact

    @POST("contacts")
    suspend fun createContact(@Body body: ContactCreate): Contact

    @POST("contacts/{id}/settle")
    suspend fun settleContact(@Path("id") id: String): Contact

    @DELETE("contacts/{id}")
    suspend fun deleteContact(@Path("id") id: String)

    @GET("transactions")
    suspend fun transactions(
        @Query("contact_id") contactId: String? = null,
        @Query("account_id") accountId: String? = null,
        @Query("on_hand") onHand: Boolean? = null,
    ): List<Transaction>

    @POST("transactions")
    suspend fun createTransaction(@Body body: TransactionCreate): Transaction

    @GET("accounts")
    suspend fun accounts(): List<Account>

    @GET("accounts/on-hand")
    suspend fun onHand(): OnHand

    @POST("accounts")
    suspend fun createAccount(@Body body: AccountCreate): Account

    @DELETE("accounts/{id}")
    suspend fun deleteAccount(@Path("id") id: String)

    @GET("telegram/link")
    suspend fun telegramLink(): TelegramLinkStatus

    @POST("telegram/link/code")
    suspend fun telegramCode(): TelegramLinkCode
}

class ApiFactory(sessionStore: SessionStore) {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
    }

    private val jsonHeaders = Interceptor { chain ->
        chain.proceed(
            chain.request().newBuilder()
                .header("Accept", "application/json")
                .build(),
        )
    }

    private val userAuthInterceptor = Interceptor { chain ->
        val token = runBlocking { sessionStore.getToken() }
        val req = if (!token.isNullOrBlank()) {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        chain.proceed(req)
    }

    /** Auth client: publishable key only — never overwrite with a stale user JWT. */
    private val authClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(jsonHeaders)
        .addInterceptor(logging)
        .build()

    private val apiClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(jsonHeaders)
        .addInterceptor(userAuthInterceptor)
        .addInterceptor(logging)
        .build()

    private val media = "application/json".toMediaType()

    val authApi: SupabaseAuthApi = Retrofit.Builder()
        .baseUrl(BuildConfig.SUPABASE_URL.trimEnd('/') + "/")
        .client(authClient)
        .addConverterFactory(json.asConverterFactory(media))
        .build()
        .create(SupabaseAuthApi::class.java)

    val ryvvApi: RyvvApi = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
        .client(apiClient)
        .addConverterFactory(json.asConverterFactory(media))
        .build()
        .create(RyvvApi::class.java)
}
