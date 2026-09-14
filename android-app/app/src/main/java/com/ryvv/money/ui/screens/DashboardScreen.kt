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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ryvv.money.data.model.Dashboard
import com.ryvv.money.data.repo.MoneyRepository
import com.ryvv.money.ui.theme.RyvvGreen
import com.ryvv.money.ui.theme.RyvvRose
import com.ryvv.money.ui.util.balanceLabel
import com.ryvv.money.ui.util.formatInr
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun DashboardScreen(
    repo: MoneyRepository,
    onOpenContact: (String) -> Unit,
) {
    var data by remember { mutableStateOf<Dashboard?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            data = withContext(Dispatchers.IO) { repo.dashboard() }
        } catch (e: Exception) {
            error = e.message
        }
    }

    when {
        error != null -> Text(error!!, modifier = Modifier.padding(16.dp), color = MaterialTheme.colorScheme.error)
        data == null -> CircularProgressIndicator(modifier = Modifier.padding(24.dp))
        else -> {
            val d = data!!
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    Text("RYVV", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text("Your money at a glance", style = MaterialTheme.typography.bodyMedium)
                }
                item { StatCard("Total balance", formatInr(d.totalBalancePaise)) }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                        StatCard("On hand", formatInr(d.onHandPaise), Modifier.weight(1f))
                        StatCard("Accounts", formatInr(d.accountsBalancePaise), Modifier.weight(1f))
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                        StatCard("Will get", formatInr(d.youWillGetPaise), Modifier.weight(1f), RyvvGreen)
                        StatCard("Will give", formatInr(d.youWillGivePaise), Modifier.weight(1f), RyvvRose)
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                        StatCard("Income", formatInr(d.monthIncomePaise), Modifier.weight(1f), RyvvGreen)
                        StatCard("Expense", formatInr(d.monthExpensePaise), Modifier.weight(1f), RyvvRose)
                    }
                }
                item {
                    Spacer(Modifier.height(8.dp))
                    Text("Contacts", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                }
                items(d.contacts.take(12)) { c ->
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onOpenContact(c.id) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    ) {
                        Row(
                            Modifier.fillMaxWidth().padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(c.name, fontWeight = FontWeight.Medium)
                            Text(
                                balanceLabel(c.balancePaise),
                                color = when {
                                    c.balancePaise > 0 -> RyvvGreen
                                    c.balancePaise < 0 -> RyvvRose
                                    else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface,
) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(14.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(6.dp))
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = valueColor)
        }
    }
}
