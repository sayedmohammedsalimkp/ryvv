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
import com.ryvv.money.data.model.Contact
import com.ryvv.money.data.repo.MoneyRepository
import com.ryvv.money.ui.theme.RyvvGreen
import com.ryvv.money.ui.theme.RyvvRose
import com.ryvv.money.ui.util.balanceLabel
import com.ryvv.money.ui.util.formatInr
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun ContactsScreen(
    repo: MoneyRepository,
    onOpen: (String) -> Unit,
) {
    var rows by remember { mutableStateOf<List<Contact>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var showAdd by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    fun reload() {
        scope.launch {
            loading = true
            rows = withContext(Dispatchers.IO) { repo.contacts() }
            loading = false
        }
    }

    LaunchedEffect(Unit) { reload() }

    val willGet = rows.filter { it.balancePaise > 0 }.sumOf { it.balancePaise }
    val willGive = rows.filter { it.balancePaise < 0 }.sumOf { kotlin.math.abs(it.balancePaise) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Contacts", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Button(onClick = { showAdd = !showAdd }) { Text(if (showAdd) "Close" else "Add") }
        }
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            Card(Modifier.weight(1f)) {
                Column(Modifier.padding(12.dp)) {
                    Text("You will get", color = RyvvGreen, style = MaterialTheme.typography.labelMedium)
                    Text(formatInr(willGet), fontWeight = FontWeight.Bold, color = RyvvGreen)
                }
            }
            Card(Modifier.weight(1f)) {
                Column(Modifier.padding(12.dp)) {
                    Text("You will give", color = RyvvRose, style = MaterialTheme.typography.labelMedium)
                    Text(formatInr(willGive), fontWeight = FontWeight.Bold, color = RyvvRose)
                }
            }
        }
        if (showAdd) {
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone") }, modifier = Modifier.fillMaxWidth())
            Button(
                onClick = {
                    scope.launch {
                        withContext(Dispatchers.IO) { repo.createContact(name, phone.ifBlank { null }, null) }
                        name = ""; phone = ""; showAdd = false; reload()
                    }
                },
                enabled = name.isNotBlank(),
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            ) { Text("Save contact") }
        }
        Spacer(Modifier.height(12.dp))
        if (loading) CircularProgressIndicator()
        else LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(rows) { c ->
                Card(Modifier.fillMaxWidth().clickable { onOpen(c.id) }) {
                    Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(c.name, fontWeight = FontWeight.Medium)
                        Text(
                            balanceLabel(c.balancePaise),
                            color = when {
                                c.balancePaise > 0 -> RyvvGreen
                                c.balancePaise < 0 -> RyvvRose
                                else -> MaterialTheme.colorScheme.onSurface.copy(0.5f)
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ContactDetailScreen(
    contactId: String,
    repo: MoneyRepository,
    onBack: () -> Unit,
) {
    var contact by remember { mutableStateOf<Contact?>(null) }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var msg by remember { mutableStateOf<String?>(null) }
    var confirmSettle by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun reload() {
        scope.launch {
            contact = withContext(Dispatchers.IO) { repo.contact(contactId) }
        }
    }

    LaunchedEffect(contactId) { reload() }

    val c = contact
    if (c == null) {
        CircularProgressIndicator(Modifier.padding(24.dp))
        return
    }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        OutlinedButton(onClick = onBack) { Text("← Back") }
        Text(c.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(
            balanceLabel(c.balancePaise),
            color = when {
                c.balancePaise > 0 -> RyvvGreen
                c.balancePaise < 0 -> RyvvRose
                else -> MaterialTheme.colorScheme.onSurface.copy(0.6f)
            },
            fontWeight = FontWeight.SemiBold,
        )
        OutlinedTextField(
            value = amount,
            onValueChange = { amount = it },
            label = { Text("Amount (₹)") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = note,
            onValueChange = { note = it },
            label = { Text("Note") },
            modifier = Modifier.fillMaxWidth(),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = {
                    scope.launch {
                        val rupees = amount.toDoubleOrNull()
                            ?: if (c.balancePaise < 0) kotlin.math.abs(c.balancePaise) / 100.0 else null
                        if (rupees == null || rupees <= 0) {
                            msg = "Enter amount (or use give balance)"
                            return@launch
                        }
                        withContext(Dispatchers.IO) {
                            repo.createTxn("gave", rupees, contactId, note.ifBlank { null })
                        }
                        amount = ""; note = ""; msg = "Saved Gave"; reload()
                    }
                },
                modifier = Modifier.weight(1f),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = RyvvRose),
            ) { Text("Gave") }
            Button(
                onClick = {
                    scope.launch {
                        val rupees = amount.toDoubleOrNull()
                            ?: if (c.balancePaise > 0) c.balancePaise / 100.0 else null
                        if (rupees == null || rupees <= 0) {
                            msg = "Enter amount (or use get balance)"
                            return@launch
                        }
                        withContext(Dispatchers.IO) {
                            repo.createTxn("received", rupees, contactId, note.ifBlank { null })
                        }
                        amount = ""; note = ""; msg = "Saved Got"; reload()
                    }
                },
                modifier = Modifier.weight(1f),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = RyvvGreen),
            ) { Text("Got") }
            OutlinedButton(
                onClick = { confirmSettle = true },
                enabled = c.balancePaise != 0L,
                modifier = Modifier.weight(1f),
            ) { Text("Settle") }
        }
        if (confirmSettle) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Settle = balance ₹0?", fontWeight = FontWeight.Bold)
                    Text("Clear ${formatInr(kotlin.math.abs(c.balancePaise))} with ${c.name}?")
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { confirmSettle = false }, modifier = Modifier.weight(1f)) { Text("Cancel") }
                        Button(
                            onClick = {
                                scope.launch {
                                    withContext(Dispatchers.IO) { repo.settle(contactId) }
                                    confirmSettle = false
                                    msg = "Settled · ₹0"
                                    reload()
                                }
                            },
                            modifier = Modifier.weight(1f),
                        ) { Text("Yes, ₹0") }
                    }
                }
            }
        }
        msg?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        Text("History loads in Txns filter — open after save.", style = MaterialTheme.typography.bodySmall)
        var txns by remember { mutableStateOf<List<com.ryvv.money.data.model.Transaction>>(emptyList()) }
        LaunchedEffect(contactId, c.balancePaise) {
            txns = withContext(Dispatchers.IO) { repo.contactTxns(contactId) }
        }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.weight(1f, fill = false)) {
            items(txns) { t ->
                Text(
                    "${t.type} · ${formatInr(t.amountPaise)}" + (t.note?.let { " · $it" } ?: ""),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
    }
}
