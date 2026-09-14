package com.ryvv.money.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.ryvv.money.data.AppContainer
import com.ryvv.money.ui.screens.AccountDetailScreen
import com.ryvv.money.ui.screens.AccountsScreen
import com.ryvv.money.ui.screens.ContactDetailScreen
import com.ryvv.money.ui.screens.ContactsScreen
import com.ryvv.money.ui.screens.DashboardScreen
import com.ryvv.money.ui.screens.LoginScreen
import com.ryvv.money.ui.screens.OnHandScreen
import com.ryvv.money.ui.screens.ProfileScreen
import com.ryvv.money.ui.screens.SignupScreen
import com.ryvv.money.ui.screens.TransactionsScreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private object Routes {
    const val Login = "login"
    const val Signup = "signup"
    const val Home = "home"
    const val Contacts = "contacts"
    const val Contact = "contact/{id}"
    const val Accounts = "accounts"
    const val OnHand = "onhand"
    const val Account = "account/{id}"
    const val Txns = "txns"
    const val Profile = "profile"
}

@Composable
fun RyvvRoot(container: AppContainer) {
    var booting by remember { mutableStateOf(true) }
    var loggedIn by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        loggedIn = withContext(Dispatchers.IO) { container.authRepository.hasSession() }
        booting = false
    }

    if (booting) {
        Text("Loading RYVV…")
        return
    }

    if (!loggedIn) {
        val authNav = rememberNavController()
        NavHost(navController = authNav, startDestination = Routes.Login) {
            composable(Routes.Login) {
                LoginScreen(
                    authRepository = container.authRepository,
                    onLoggedIn = { loggedIn = true },
                    onGoSignup = { authNav.navigate(Routes.Signup) },
                )
            }
            composable(Routes.Signup) {
                SignupScreen(
                    authRepository = container.authRepository,
                    onLoggedIn = { loggedIn = true },
                    onBack = { authNav.popBackStack() },
                )
            }
        }
        return
    }

    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val route = backStack?.destination?.route
    val showBar = route in setOf(
        Routes.Home, Routes.Contacts, Routes.Accounts, Routes.Txns, Routes.Profile
    )

    Scaffold(
        bottomBar = {
            if (showBar) {
                NavigationBar {
                    NavigationBarItem(
                        selected = route == Routes.Home,
                        onClick = { nav.navigate(Routes.Home) { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.Home, null) },
                        label = { Text("Home") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Contacts || route?.startsWith("contact") == true,
                        onClick = { nav.navigate(Routes.Contacts) { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.People, null) },
                        label = { Text("Contacts") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Accounts || route == Routes.OnHand || route?.startsWith("account") == true,
                        onClick = { nav.navigate(Routes.Accounts) { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.AccountBalanceWallet, null) },
                        label = { Text("Accounts") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Txns,
                        onClick = { nav.navigate(Routes.Txns) { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.ReceiptLong, null) },
                        label = { Text("Txns") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Profile,
                        onClick = { nav.navigate(Routes.Profile) { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.Person, null) },
                        label = { Text("Profile") },
                    )
                }
            }
        }
    ) { pad ->
        NavHost(
            navController = nav,
            startDestination = Routes.Home,
            modifier = Modifier.padding(pad),
        ) {
            composable(Routes.Home) {
                DashboardScreen(
                    repo = container.moneyRepository,
                    onOpenContact = { nav.navigate("contact/$it") },
                )
            }
            composable(Routes.Contacts) {
                ContactsScreen(
                    repo = container.moneyRepository,
                    onOpen = { nav.navigate("contact/$it") },
                )
            }
            composable(
                Routes.Contact,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) { entry ->
                ContactDetailScreen(
                    contactId = entry.arguments!!.getString("id")!!,
                    repo = container.moneyRepository,
                    onBack = { nav.popBackStack() },
                )
            }
            composable(Routes.Accounts) {
                AccountsScreen(
                    repo = container.moneyRepository,
                    onOpenOnHand = { nav.navigate(Routes.OnHand) },
                    onOpenAccount = { nav.navigate("account/$it") },
                )
            }
            composable(Routes.OnHand) {
                OnHandScreen(repo = container.moneyRepository, onBack = { nav.popBackStack() })
            }
            composable(
                Routes.Account,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) { entry ->
                AccountDetailScreen(
                    accountId = entry.arguments!!.getString("id")!!,
                    repo = container.moneyRepository,
                    onBack = { nav.popBackStack() },
                )
            }
            composable(Routes.Txns) {
                TransactionsScreen(repo = container.moneyRepository)
            }
            composable(Routes.Profile) {
                ProfileScreen(
                    moneyRepository = container.moneyRepository,
                    authRepository = container.authRepository,
                    sessionStore = container.sessionStore,
                    onLoggedOut = { loggedIn = false },
                )
            }
        }
    }
}
