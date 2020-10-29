$ScriptDir = Split-Path $script:MyInvocation.MyCommand.Path

$MainFile = $ScriptDir + "\..\deno_mud.ts"

deno run --allow-net $MainFile