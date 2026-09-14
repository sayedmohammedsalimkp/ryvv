package com.ryvv.money.data.repo

import com.ryvv.money.data.api.RyvvApi
import com.ryvv.money.data.model.AccountCreate
import com.ryvv.money.data.model.ContactCreate
import com.ryvv.money.data.model.TransactionCreate

class MoneyRepository(private val api: RyvvApi) {
    suspend fun me() = api.me()
    suspend fun dashboard() = api.dashboard()
    suspend fun contacts(q: String? = null) = api.contacts(q)
    suspend fun contact(id: String) = api.contact(id)
    suspend fun createContact(name: String, phone: String?, note: String?) =
        api.createContact(ContactCreate(name, phone, note))

    suspend fun settle(id: String) = api.settleContact(id)
    suspend fun deleteContact(id: String) = api.deleteContact(id)

    suspend fun contactTxns(contactId: String) = api.transactions(contactId = contactId)
    suspend fun onHandTxns() = api.transactions(onHand = true)
    suspend fun accountTxns(accountId: String) = api.transactions(accountId = accountId)
    suspend fun allTxns() = api.transactions()

    suspend fun createTxn(type: String, amountRupees: Double, contactId: String?, note: String?) =
        api.createTransaction(TransactionCreate(type, amountRupees, contactId, note))

    suspend fun accounts() = api.accounts()
    suspend fun onHand() = api.onHand()
    suspend fun createAccount(name: String, type: String, opening: Double) =
        api.createAccount(AccountCreate(name, type, opening))

    suspend fun deleteAccount(id: String) = api.deleteAccount(id)

    suspend fun telegramLink() = api.telegramLink()
    suspend fun telegramCode() = api.telegramCode()
}
