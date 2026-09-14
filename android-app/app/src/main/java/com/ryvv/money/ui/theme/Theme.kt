package com.ryvv.money.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val RyvvBlue = Color(0xFF0866FF)
val RyvvGreen = Color(0xFF059669)
val RyvvRose = Color(0xFFE11D48)

private val LightColors = lightColorScheme(
    primary = RyvvBlue,
    onPrimary = Color.White,
    secondary = RyvvBlue,
    background = Color(0xFFF7F9FC),
    surface = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A),
    error = RyvvRose,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF5B9BFF),
    onPrimary = Color(0xFF001A40),
    background = Color(0xFF0B1220),
    surface = Color(0xFF121A2A),
    onBackground = Color(0xFFE8EEF8),
    onSurface = Color(0xFFE8EEF8),
    error = Color(0xFFFF6B8A),
)

@Composable
fun RyvvTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
