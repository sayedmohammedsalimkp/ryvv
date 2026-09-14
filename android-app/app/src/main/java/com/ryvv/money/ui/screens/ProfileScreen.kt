package com.ryvv.money.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import com.ryvv.money.data.auth.SessionStore
import com.ryvv.money.data.model.TelegramLinkCode
import com.ryvv.money.data.model.TelegramLinkStatus
import com.ryvv.money.data.model.User
import com.ryvv.money.data.repo.AuthRepository
import com.ryvv.money.data.repo.MoneyRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun ProfileScreen(
    moneyRepository: MoneyRepository,
    authRepository: AuthRepository,
    sessionStore: SessionStore,
    onLoggedOut: () -> Unit,
) {
    var user by remember { mutableStateOf<User?>(null) }
    var email by remember { mutableStateOf<String?>(null) }
    var tg by remember { mutableStateOf<TelegramLinkStatus?>(null) }
    var code by remember { mutableStateOf<TelegramLinkCode?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        email = sessionStore.getEmail()
        try {
            user = withContext(Dispatchers.IO) { moneyRepository.me() }
            tg = withContext(Dispatchers.IO) { moneyRepository.telegramLink() }
        } catch (e: Exception) {
            error = e.message
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Profile", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(user?.fullName ?: "…", fontWeight = FontWeight.SemiBold)
        Text(email ?: user?.email ?: "", style = MaterialTheme.typography.bodyMedium)
        Text("Currency: INR", color = MaterialTheme.colorScheme.primary)

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Telegram", fontWeight = FontWeight.SemiBold)
                when {
                    tg == null -> Text("Loading…")
                    tg?.configured != true -> Text("Bot not configured on backend.")
                    tg?.linked == true -> Text("Linked @${tg?.telegramUsername ?: "—"}")
                    else -> {
                        Text("Generate code, then /start CODE in Telegram.")
                        Button(
                            onClick = {
                                scope.launch {
                                    try {
                                        code = withContext(Dispatchers.IO) { moneyRepository.telegramCode() }
                                    } catch (e: Exception) {
                                        error = e.message
                                    }
                                }
                            },
                        ) { Text("Generate link code") }
                        code?.let {
                            Text("/start ${it.code}", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            Text("Expires in ${it.expiresInMinutes} min")
                            it.botUsername?.let { u -> Text("@$u") }
                        }
                    }
                }
            }
        }

        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        Spacer(Modifier.height(8.dp))
        OutlinedButton(
            onClick = {
                scope.launch {
                    authRepository.logout()
                    onLoggedOut()
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Sign out") }
    }
}
