package com.ryvv.money.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    @SerialName("full_name") val fullName: String = "RYVV user",
    val email: String? = null,
    val currency: String = "INR",
)

@Serializable
data class Contact(
    val id: String,
    val name: String,
    val phone: String? = null,
    val note: String? = null,
    @SerialName("balance_paise") val balancePaise: Long = 0,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class Account(
    val id: String,
    val name: String,
    val type: String,
    @SerialName("opening_balance_paise") val openingBalancePaise: Long = 0,
    @SerialName("balance_paise") val balancePaise: Long = 0,
)

@Serializable
data class OnHand(
    val name: String = "On hand",
    @SerialName("balance_paise") val balancePaise: Long = 0,
)

@Serializable
data class Transaction(
    val id: String,
    val type: String,
    @SerialName("amount_paise") val amountPaise: Long,
    @SerialName("amount_rupees") val amountRupees: Double,
    @SerialName("txn_date") val txnDate: String,
    val note: String? = null,
    @SerialName("contact_id") val contactId: String? = null,
    @SerialName("contact_name") val contactName: String? = null,
    @SerialName("account_id") val accountId: String? = null,
    @SerialName("account_name") val accountName: String? = null,
    @SerialName("settled_at") val settledAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class AccountBalance(
    val id: String,
    val name: String,
    val type: String,
    @SerialName("balance_paise") val balancePaise: Long,
)

@Serializable
data class Dashboard(
    @SerialName("total_balance_paise") val totalBalancePaise: Long = 0,
    @SerialName("on_hand_paise") val onHandPaise: Long = 0,
    @SerialName("accounts_balance_paise") val accountsBalancePaise: Long = 0,
    val accounts: List<AccountBalance> = emptyList(),
    @SerialName("month_income_paise") val monthIncomePaise: Long = 0,
    @SerialName("month_expense_paise") val monthExpensePaise: Long = 0,
    @SerialName("month_net_paise") val monthNetPaise: Long = 0,
    @SerialName("you_will_get_paise") val youWillGetPaise: Long = 0,
    @SerialName("you_will_give_paise") val youWillGivePaise: Long = 0,
    val contacts: List<Contact> = emptyList(),
)

@Serializable
data class ContactCreate(
    val name: String,
    val phone: String? = null,
    val note: String? = null,
)

@Serializable
data class AccountCreate(
    val name: String,
    val type: String = "upi",
    @SerialName("opening_balance_rupees") val openingBalanceRupees: Double = 0.0,
)

@Serializable
data class TransactionCreate(
    val type: String,
    @SerialName("amount_rupees") val amountRupees: Double,
    @SerialName("contact_id") val contactId: String? = null,
    val note: String? = null,
)

@Serializable
data class TelegramLinkStatus(
    val linked: Boolean = false,
    val configured: Boolean = false,
    @SerialName("bot_username") val botUsername: String? = null,
    @SerialName("telegram_username") val telegramUsername: String? = null,
)

@Serializable
data class TelegramLinkCode(
    val code: String,
    @SerialName("expires_in_minutes") val expiresInMinutes: Int = 15,
    @SerialName("deep_link") val deepLink: String? = null,
    @SerialName("bot_username") val botUsername: String? = null,
)

@Serializable
data class AuthTokenResponse(
    @SerialName("access_token") val accessToken: String? = null,
    @SerialName("token_type") val tokenType: String? = null,
    val user: AuthUser? = null,
)

@Serializable
data class AuthUser(
    val id: String? = null,
    val email: String? = null,
)

@Serializable
data class PasswordGrant(
    val email: String,
    val password: String,
)

@Serializable
data class SignUpBody(
    val email: String,
    val password: String,
    val data: Map<String, String> = emptyMap(),
)
