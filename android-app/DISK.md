# Put heavy build caches on D: (C: is full)

## Already set up (or do once)

1. Folder: `D:\dev-cache\gradle`
2. Windows user env:
   - `GRADLE_USER_HOME` = `D:\dev-cache\gradle`
3. **Fully quit Android Studio** (File → Exit), then open again so it picks up the env var.
4. Rebuild / Run.

## If build still says disk full

Free more on **C:**:

1. Empty Recycle Bin
2. Disk Cleanup on C: (temp files)
3. Delete old Android Studio caches if needed:
   - `%LOCALAPPDATA%\Google\AndroidStudio*` → `caches` folders (Studio closed)
4. Move Android SDK later (optional, bigger):
   - Android Studio → Settings → Android SDK → change location to `D:\Android\Sdk`

## Check free space

```powershell
Get-PSDrive C,D | Format-Table Name, @{N='FreeGB';E={[math]::Round($_.Free/1GB,2)}}
```

Need ~2–4 GB free on C: for Windows/Studio temp even when Gradle is on D:.
