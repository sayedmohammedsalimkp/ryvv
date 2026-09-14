package com.ryvv.money.ui.util

fun formatInr(paise: Long): String {
    val rupees = paise / 100.0
    return "₹" + "%,.2f".format(rupees)
}

fun balanceLabel(paise: Long): String = when {
    paise > 0 -> "Get ${formatInr(paise)}"
    paise < 0 -> "Give ${formatInr(kotlin.math.abs(paise))}"
    else -> "Settled · ₹0"
}
