package com.ryvv.money.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ryvv.money.data.model.Account
import com.ryvv.money.data.model.OnHand
import com.ryvv.money.data.model.Transaction
import com.ryvv.money.data.repo.MoneyRepository
import com.ryvv.money.ui.util.formatInr
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun AccountsScreen(
    repo: MoneyRepository,
    onOpenOnHand: () -> Unit,
    onOpenAccount: (String) -> Unit,
) {
    var accounts by remember { mutableStateOf<List<Account>>(emptyList()) }
    var onHand by remember { mutableStateOf<OnHand?>(null) }
    var showAdd by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("upi") }
    var opening by remember { mutableStateOf("0") }
    val scope = rememberCoroutineScope()

    fun reload() {
        scope.launch {
            onHand = withContext(Dispatchers.IO) { repo.onHand() }
            accounts = withContext(Dispatchers.IO) { repo.accounts() }
        }
    }

    LaunchedEffect(Unit) { reload() }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Accounts", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Button(onClick = { showAdd = !showAdd }) { Text(if (showAdd) "Close" else "Add") }
        }
        Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onOpenOnHand)) {
            Column(Modifier.padding(16.dp)) {
                Text("ON HAND", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                Text(formatInr(onHand?.balancePaise ?: 0), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text("Tap for transactions", style = MaterialTheme.typography.bodySmall)
            }
        }
        if (showAdd) {
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("upi", "bank", "other").forEach { t ->
                    OutlinedButton(onClick = { type = t }) { Text(if (type == t) "✓ $t" else t) }
                }
            }
            OutlinedTextField(value = opening, onValueChange = { opening = it }, label = { Text("Opening ₹") }, modifier = Modifier.fillMaxWidth())
            Button(
                onClick = {
                    scope.launch {
                        withContext(Dispatchers.IO) {
                            repo.createAccount(name, type, opening.toDoubleOrNull() ?: 0.0)
                        }
                        name = ""; opening = "0"; showAdd = false; reload()
                    }
                },
                enabled = name.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Save account") }
        }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(accounts) { a ->
                Card(modifier = Modifier.fillMaxWidth().clickable { onOpenAccount(a.id) }) {
                    Column(Modifier.padding(14.dp)) {
                        Text(a.type.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                        Text(a.name, fontWeight = FontWeight.SemiBold)
                        Text(formatInr(a.balancePaise), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun OnHandScreen(repo: MoneyRepository, onBack: () -> Unit) {
    TxnListScreen(
        title = "On hand",
        onBack = onBack,
        loader = { repo.onHandTxns() },
        balanceLoader = { formatInr(repo.onHand().balancePaise) },
    )
}

@Composable
fun AccountDetailScreen(accountId: String, repo: MoneyRepository, onBack: () -> Unit) {
    var title by remember { mutableStateOf("Account") }
    LaunchedEffect(accountId) {
        val acc = withContext(Dispatchers.IO) { repo.accounts().find { it.id == accountId } }
        title = acc?.name ?: "Account"
    }
    TxnListScreen(
        title = title,
        onBack = onBack,
        loader = { repo.accountTxns(accountId) },
        balanceLoader = {
            val acc = repo.accounts().find { it.id == accountId }
            formatInr(acc?.balancePaise ?: 0)
        },
    )
}

@Composable
private fun TxnListScreen(
    title: String,
    onBack: () -> Unit,
    loader: suspend () -> List<Transaction>,
    balanceLoader: suspend () -> String,
) {
    var txns by remember { mutableStateOf<List<Transaction>>(emptyList()) }
    var bal by remember { mutableStateOf("…") }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(title) {
        loading = true
        bal = withContext(Dispatchers.IO) { balanceLoader() }
        txns = withContext(Dispatchers.IO) { loader() }
        loading = false
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedButton(onClick = onBack) { Text("← Back") }
        Spacer(Modifier.height(8.dp))
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(bal, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        if (loading) CircularProgressIndicator()
        else if (txns.isEmpty()) Text("No transactions yet.")
        else LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(txns) { t ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text("${t.type} · ${formatInr(t.amountPaise)}", fontWeight = FontWeight.Medium)
                        Text(listOfNotNull(t.contactName, t.note, t.txnDate).joinToString(" · "), style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

@Composable
fun TransactionsScreen(repo: MoneyRepository) {
    var txns by remember { mutableStateOf<List<Transaction>>(emptyList()) }
    LaunchedEffect(Unit) {
        txns = withContext(Dispatchers.IO) { repo.allTxns() }
    }
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Transactions", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(txns) { t ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text(
                            buildString {
                                append(t.type)
                                t.contactName?.let { append(" · "); append(it) }
                                append(" · ")
                                append(formatInr(t.amountPaise))
                            },
                            fontWeight = FontWeight.Medium,
                        )
                        Text(
                            listOfNotNull(t.txnDate, t.accountName ?: "On hand", t.note).joinToString(" · "),
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
    }
}
